process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret-that-is-long-enough-for-validation';
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
process.env.RAZORPAY_KEY_SECRET = 'test-only-razorpay-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-only-webhook-secret';
process.env.PAYMENT_ALLOWED_CURRENCIES = 'INR';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const { app } = require('../server');
const Product = require('../models/Product');
const SiteContent = require('../models/SiteContent');
const { reserveStock, restoreReservedItems } = require('../services/inventoryService');

let replicaSet;
let adminToken;

test.before(async () => {
  process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash('Correct-Horse-Battery-Staple!', 10);
  replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replicaSet.getUri(), { dbName: 'bansal-scientific-test' });
  const login = await request(app).post('/api/auth/login').send({
    email: process.env.ADMIN_EMAIL,
    password: 'Correct-Horse-Battery-Staple!'
  });
  assert.equal(login.status, 200);
  adminToken = login.body.token;
});

test.after(async () => {
  await mongoose.disconnect();
  if (replicaSet) await replicaSet.stop();
});

test('admin authentication rejects wrong credentials and protects product CRUD', async () => {
  const deniedLogin = await request(app).post('/api/auth/login').send({ email: process.env.ADMIN_EMAIL, password: 'wrong-password' });
  assert.equal(deniedLogin.status, 401);

  const deniedCrud = await request(app).post('/api/products').send({ sku: 'NO-AUTH', name: 'Denied product' });
  assert.equal(deniedCrud.status, 401);
});

test('admin CRUD publishes only explicitly published products to the public catalog', async () => {
  const headers = { Authorization: `Bearer ${adminToken}` };
  const visible = await request(app).post('/api/products').set(headers).send({
    sku: 'TEST-VISIBLE-001', name: 'Visible test product', price: 100, stock: 5, published: true, storeType: 'B2B'
  });
  assert.equal(visible.status, 201);

  const updated = await request(app).put(`/api/products/${visible.body.data._id}`).set(headers).send({
    sku: 'TEST-VISIBLE-001', name: 'Visible test product updated', price: 125, stock: 5, published: true, storeType: 'B2B'
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.name, 'Visible test product updated');

  const draft = await request(app).post('/api/products').set(headers).send({
    sku: 'TEST-DRAFT-001', name: 'Draft test product', price: 100, stock: 5, published: false, storeType: 'B2C'
  });
  assert.equal(draft.status, 201);

  const publicCatalog = await request(app).get('/api/products?storeType=B2B');
  assert.equal(publicCatalog.status, 200);
  assert.ok(publicCatalog.body.data.some((product) => product.sku === 'TEST-VISIBLE-001'));
  assert.ok(!publicCatalog.body.data.some((product) => product.sku === 'TEST-DRAFT-001'));

  const archived = await request(app).patch(`/api/products/${visible.body.data._id}/archive`).set(headers);
  assert.equal(archived.status, 200);
  const missingAfterArchive = await request(app).get(`/api/products/${visible.body.data._id}`);
  assert.equal(missingAfterArchive.status, 404);
});

test('CMS rejects mass-assigned fields and retains only supported content', async () => {
  const response = await request(app).put('/api/site-content').set('Authorization', `Bearer ${adminToken}`).send({
    singletonId: 'ATTACKER_VALUE',
    unexpectedInternalField: 'must not persist',
    homeSlideshow: [{ title: 'Test offer', imageUrl: '/offers/test.png', ctaUrl: '/scientific' }]
  });
  assert.equal(response.status, 200);
  const content = await SiteContent.findOne({ singletonId: 'CMS_CONTENT' }).lean();
  assert.equal(content.singletonId, 'CMS_CONTENT');
  assert.equal(content.unexpectedInternalField, undefined);
  assert.equal(content.homeSlideshow[0].title, 'Test offer');
});

test('variant reservations are atomic at the selected variant and restore correctly', async () => {
  const product = await Product.create({
    sku: 'TEST-VARIANT-001', name: 'Variant stock test', price: 100, stock: 5,
    variants: [{ name: 'Small', sku: 'TEST-VARIANT-S', price: 100, stock: 5, attributes: { Size: 'Small' } }]
  });
  const variantId = product.variants[0]._id.toString();
  const reservation = await reserveStock([{ productId: product._id.toString(), variantId, quantity: 2 }]);
  const reserved = await Product.findById(product._id).lean();
  assert.equal(reserved.stock, 3);
  assert.equal(reserved.variants[0].stock, 3);

  await restoreReservedItems(reservation.items);
  const restored = await Product.findById(product._id).lean();
  assert.equal(restored.stock, 5);
  assert.equal(restored.variants[0].stock, 5);

  await assert.rejects(() => reserveStock([{ productId: product._id.toString(), quantity: 1 }]));
});

test('checkout refuses currencies not explicitly enabled before creating a gateway order', async () => {
  const response = await request(app).post('/api/payment/create-order').send({ currency: 'USD' });
  assert.equal(response.status, 400);
  assert.match(response.body.message, /not enabled/i);
});
