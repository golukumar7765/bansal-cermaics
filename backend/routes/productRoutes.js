const express = require('express');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Category = require('../models/Category');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

/* ------------------------------------------------------------------ */
/* small helpers                                                      */
/* ------------------------------------------------------------------ */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const str = (v) => (v === null || v === undefined ? '' : String(v)).trim();
const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const stringList = (v) =>
  (Array.isArray(v) ? v : []).map(str).filter(Boolean);

const slugify = (s) =>
  str(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const keywordList = (v) =>
  (Array.isArray(v) ? v : str(v).split(','))
    .map(str)
    .filter(Boolean);

const plainObject = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) ? v : {};

/* ------------------------------------------------------------------ */
/* category resolution                                                */
/* ------------------------------------------------------------------ */

async function resolveCategories(body) {
  let categoryId = body.categoryId || null;
  let subcategoryId = body.subcategoryId || null;
  let category = str(body.category);
  let subcategory = str(body.subcategory);

  if (categoryId) {
    if (!isId(categoryId)) throw new HttpError(400, 'Invalid category ID.');
    const doc = await Category.findById(categoryId);
    if (!doc) throw new HttpError(404, 'Category not found.');
    category = doc.name;
  }

  if (subcategoryId) {
    if (!isId(subcategoryId)) throw new HttpError(400, 'Invalid subcategory ID.');
    const doc = await Category.findById(subcategoryId);
    if (!doc) throw new HttpError(404, 'Subcategory not found.');
    if (!doc.parent) {
      throw new HttpError(400, 'Selected subcategory is actually a main category.');
    }
    if (categoryId && String(doc.parent) !== String(categoryId)) {
      throw new HttpError(400, 'Subcategory does not belong to the selected category.');
    }
    subcategory = doc.name;
    if (!categoryId) {
      categoryId = doc.parent;
      const parentDoc = await Category.findById(doc.parent);
      if (parentDoc) category = parentDoc.name;
    }
  } else {
    subcategory = '';
  }

  return { categoryId, subcategoryId, category, subcategory };
}

/* ------------------------------------------------------------------ */
/* the one sanitiser                                                  */
/* ------------------------------------------------------------------ */

function buildProductData(body) {
  const sku = str(body.sku).toUpperCase();
  const name = str(body.name);

  if (!sku) throw new HttpError(400, 'SKU is required.');
  if (!name) throw new HttpError(400, 'Product name is required.');

  const images = (Array.isArray(body.images) ? body.images : [])
    .map((img, i) => ({
      url: str(img?.url),
      alt: str(img?.alt),
      sortOrder: Number.isFinite(Number(img?.sortOrder)) ? Number(img.sortOrder) : i,
      isPrimary: Boolean(img?.isPrimary)
    }))
    .filter((img) => img.url);

  const specifications = (Array.isArray(body.specifications) ? body.specifications : [])
    .map((s) => ({ name: str(s?.name), value: str(s?.value), unit: str(s?.unit) }))
    .filter((s) => s.name && s.value);

  const documents = (Array.isArray(body.documents) ? body.documents : [])
    .map((d) => ({ name: str(d?.name), url: str(d?.url), type: str(d?.type) }))
    .filter((d) => d.url);

  const variants = (Array.isArray(body.variants) ? body.variants : []).map((v) => {
    const attributes = {};
    Object.entries(plainObject(v?.attributes)).forEach(([k, val]) => {
      const key = str(k);
      const value = str(val);
      if (key && value && !key.includes('.') && !key.startsWith('$')) {
        attributes[key] = value;
      }
    });

    const out = {
      name: str(v?.name) || Object.values(attributes).join(' / '),
      sku: str(v?.sku).toUpperCase(),
      price: Math.max(0, num(v?.price)),
      stock: Math.max(0, num(v?.stock)),
      attributes,
      imageUrl: str(v?.imageUrl),
      isActive: v?.isActive !== false
    };

    if (v?._id && isId(v._id)) out._id = v._id;
    return out;
  });

  if (variants.some((v) => !v.name)) {
    throw new HttpError(400, 'Every variant needs at least one option value.');
  }

  const seo = plainObject(body.seo);
  const metadata = plainObject(body.metadata);

  return {
    sku,
    name,
    storeType: ['B2B', 'B2C'].includes(body.storeType) ? body.storeType : 'B2B',
    price: Math.max(0, num(body.price)),
    baseCurrency: str(body.baseCurrency || 'INR').toUpperCase(),
    currencyPrices: plainObject(body.currencyPrices),
    currencyPricing: plainObject(body.currencyPricing),
    pricing: plainObject(body.pricing),
    moq: Math.max(1, Math.floor(num(body.moq, 1)) || 1),
    stock: Math.max(0, num(body.stock)),
    isDirectPurchaseAllowed: body.isDirectPurchaseAllowed !== false,
    archived: body.archived === true,
    featured: body.featured === true,
    published: body.published !== false,
    imageUrl: str(body.imageUrl) || images[0]?.url || '',
    images,
    shortDescription: str(body.shortDescription),
    description: typeof body.description === 'string' ? body.description : '',
    features: stringList(body.features),
    applications: stringList(body.applications),
    documents,
    specifications,
    variants,
    seo: {
      title: str(seo.title) || name,
      description: str(seo.description),
      keywords: keywordList(seo.keywords),
      slug: slugify(seo.slug || name)
    },
    relatedProducts: (Array.isArray(body.relatedProducts) ? body.relatedProducts : [])
      .map((x) => (x && typeof x === 'object' ? x._id : x))
      .filter(isId),
    metadata
  };
}

const sendError = (res, error, label) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  if (error?.code === 11000) {
    return res
      .status(409)
      .json({ success: false, message: 'A product with this SKU already exists.' });
  }
  console.error(`${label}:`, error);
  return res.status(400).json({ success: false, message: error.message });
};

/* ------------------------------------------------------------------ */
/* POST /api/products                                                 */
/* ------------------------------------------------------------------ */

router.post('/', protect, async (req, res) => {
  try {
    const data = buildProductData(req.body || {});

    if (await Product.findOne({ sku: data.sku })) {
      throw new HttpError(409, 'A product with this SKU already exists.');
    }

    Object.assign(data, await resolveCategories(req.body || {}));
    const product = await Product.create(data);

    return res
      .status(201)
      .json({ success: true, message: 'Product created successfully.', data: product });
  } catch (error) {
    return sendError(res, error, 'Create product error');
  }
});

/* ------------------------------------------------------------------ */
/* PUT /api/products/:id                                              */
/* ------------------------------------------------------------------ */

router.put('/:id', protect, async (req, res) => {
  try {
    if (!isId(req.params.id)) throw new HttpError(400, 'Invalid product ID.');

    const product = await Product.findById(req.params.id);
    if (!product) throw new HttpError(404, 'Product not found.');

    const data = buildProductData(req.body || {});

    const clash = await Product.findOne({ sku: data.sku, _id: { $ne: product._id } });
    if (clash) throw new HttpError(409, 'Another product already uses this SKU.');

    Object.assign(data, await resolveCategories(req.body || {}));

    product.set(data);
    product.markModified('metadata');
    await product.save();

    return res.json({
      success: true,
      message: 'Product updated successfully.',
      data: product
    });
  } catch (error) {
    return sendError(res, error, 'Update product error');
  }
});

// KEEP YOUR EXISTING GET / DELETE ROUTES HERE...

module.exports = router;