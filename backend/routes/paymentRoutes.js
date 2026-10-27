const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { rateLimit } = require('../middleware/rateLimitMiddleware');

const router =
  express.Router();

const Product =
  require('../models/Product');

const Order =
  require('../models/Order');

const {
  getProductPrice
} = require('../services/pricingService');

const {
  reserveStock,
  releaseReservation,
  consumeReservation,
  restoreReservedItems
} = require(
  '../services/inventoryService'
);

const razorpay =
  new Razorpay({
    key_id:
      process.env.RAZORPAY_KEY_ID,

    key_secret:
      process.env.RAZORPAY_KEY_SECRET
  });

const checkoutRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, keyPrefix: 'checkout' });
const verifyRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'payment-verify' });
const allowedPaymentCurrencies = new Set(
  String(process.env.PAYMENT_ALLOWED_CURRENCIES || 'INR').split(',').map((currency) => currency.trim().toUpperCase()).filter(Boolean)
);

const checkoutTokenHash = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');
const newCheckoutToken = () => crypto.randomBytes(32).toString('hex');
const checkoutTokenMatches = (storedHash, token) => {
  const stored = Buffer.from(String(storedHash || ''), 'utf8');
  const received = Buffer.from(checkoutTokenHash(token), 'utf8');
  return stored.length === received.length && crypto.timingSafeEqual(stored, received);
};
const itemStockRestore = (item) => ({
  stock: Number(item.quantity),
  ...(item.variantId ? { 'variants.$[selectedVariant].stock': Number(item.quantity) } : {})
});
const itemStockRestoreOptions = (item, session) => ({
  new: true,
  session,
  ...(item.variantId ? { arrayFilters: [{ 'selectedVariant._id': item.variantId }] } : {})
});

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const roundMoney = (value) =>
  Math.round(
    (Number(value) +
      Number.EPSILON) *
      100
  ) / 100;

const generateOrderNumber = () => {
  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

  return `BS-${timestamp}-${random}`;
};

const addStatusHistory = (
  order,
  status,
  note,
  changedBy = 'system'
) => {
  if (
    !Array.isArray(
      order.statusHistory
    )
  ) {
    order.statusHistory = [];
  }

  order.statusHistory.push({
    status,

    note:
      String(
        note || ''
      ).trim(),

    changedBy,

    changedAt:
      new Date()
  });
};

const validateCustomer = (
  customer
) => {
  if (!customer) {
    throw new Error(
      'Customer information is required.'
    );
  }

  if (
    !String(
      customer.name || ''
    ).trim()
  ) {
    throw new Error(
      'Customer name is required.'
    );
  }

  if (
    !String(
      customer.email || ''
    ).trim()
  ) {
    throw new Error(
      'Customer email is required.'
    );
  }

  if (
    !/^\S+@\S+\.\S+$/.test(
      String(
        customer.email
      ).trim()
    )
  ) {
    throw new Error(
      'Please provide a valid customer email.'
    );
  }

  if (
    !String(
      customer.phone || ''
    ).trim()
  ) {
    throw new Error(
      'Customer phone is required.'
    );
  }
};

const validateAddress = (
  address,
  label
) => {
  if (!address) {
    throw new Error(
      `${label} address is required.`
    );
  }

  if (
    !String(
      address.addressLine1 || ''
    ).trim()
  ) {
    throw new Error(
      `${label} address is required.`
    );
  }

  if (
    !String(
      address.city || ''
    ).trim()
  ) {
    throw new Error(
      `${label} city is required.`
    );
  }

  if (
    !String(
      address.state || ''
    ).trim()
  ) {
    throw new Error(
      `${label} state is required.`
    );
  }

  if (
    !String(
      address.postalCode ||
        address.pincode ||
        ''
    ).trim()
  ) {
    throw new Error(
      `${label} postal code is required.`
    );
  }

  if (
    !String(
      address.country || ''
    ).trim()
  ) {
    throw new Error(
      `${label} country is required.`
    );
  }
};

/*
|--------------------------------------------------------------------------
| PAYMENT SIGNATURE
|--------------------------------------------------------------------------
*/

const verifyPaymentSignature = (
  razorpayOrderId,
  razorpayPaymentId,
  signature
) => {
  const body =
    `${razorpayOrderId}|${razorpayPaymentId}`;

  const expected =
    crypto
      .createHmac(
        'sha256',
        process.env
          .RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest('hex');

  const expectedBuffer =
    Buffer.from(
      expected,
      'utf8'
    );

  const receivedBuffer =
    Buffer.from(
      String(signature),
      'utf8'
    );

  return (
    expectedBuffer.length ===
      receivedBuffer.length &&
    crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    )
  );
};

/*
|--------------------------------------------------------------------------
| WEBHOOK SIGNATURE
|--------------------------------------------------------------------------
*/

const verifyWebhookSignature = (
  rawBody,
  signature
) => {
  if (
    !rawBody ||
    !signature
  ) {
    return false;
  }

  const expected =
    crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
      .update(rawBody)
      .digest('hex');

  const expectedBuffer =
    Buffer.from(
      expected,
      'utf8'
    );

  const receivedBuffer =
    Buffer.from(
      String(signature),
      'utf8'
    );

  return (
    expectedBuffer.length ===
      receivedBuffer.length &&
    crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    )
  );
};

/*
|--------------------------------------------------------------------------
| ATOMIC SUCCESSFUL PAYMENT PROCESSOR
|--------------------------------------------------------------------------
|
| Used by BOTH:
|
| frontend /verify-payment
| webhook payment.captured
|
| Exactly one request can consume:
|
| Reserved -> Consumed
|
| and mark:
|
| Pending -> Paid
|
*/

const processSuccessfulPayment =
  async ({
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature = '',
    source
  }) => {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          const order =
            await Order.findById(
              orderId
            ).session(session);

          if (!order) {
            throw new Error(
              'Order not found.'
            );
          }

          if (
            order.payment
              ?.razorpayOrderId !==
            razorpayOrderId
          ) {
            throw new Error(
              'Razorpay order does not match our order.'
            );
          }

          /*
           * Already Paid:
           *
           * Frontend and webhook can race.
           *
           * If payment ID is same, this is
           * simply an idempotent retry.
           */
          if (
            order.payment?.status ===
              'Paid' &&
            order.payment
              ?.razorpayPaymentId ===
              razorpayPaymentId
          ) {
            if (
              order.paymentVerificationSource !==
              source &&
              order.paymentVerificationSource !==
              'Both'
            ) {
              order.paymentVerificationSource =
                'Both';

              await order.save({
                session
              });
            }

            result = {
              alreadyProcessed:
                true,

              order
            };

            return;
          }

          /*
           * Another payment ID cannot replace
           * an already successful payment.
           */
          if (
            order.payment?.status ===
            'Paid'
          ) {
            throw new Error(
              'Order is already paid with another payment ID.'
            );
          }

          /*
           * Reservation must still exist.
           *
           * This prevents a late payment from
           * becoming Paid after stock was released.
           */
          const reservationStatus =
            order
              .inventoryReservation
              ?.status;

          if (
            reservationStatus !==
            'Reserved'
          ) {
            throw new Error(
              'Inventory reservation is no longer available. Payment requires manual review.'
            );
          }

          /*
           * Atomically consume reservation.
           */
          const consumed =
            await Order.findOneAndUpdate(
              {
                _id:
                  order._id,

                'inventoryReservation.status':
                  'Reserved',

                'payment.status':
                  {
                    $in: [
                      'Pending',
                      'Failed'
                    ]
                  }
              },
              {
                $set: {
                  'inventoryReservation.status':
                    'Consumed',

                  'inventoryReservation.consumedAt':
                    new Date(),

                  'payment.status':
                    'Paid',

                  'payment.razorpayPaymentId':
                    razorpayPaymentId,

                  'payment.razorpaySignature':
                    razorpaySignature || '',

                  'payment.paidAt':
                    new Date(),

                  paymentVerificationSource:
                    source,

                  status:
                    'Confirmed'
                },

                $push: {
                  statusHistory: {
                    status:
                      'Confirmed',

                    note:
                      source ===
                      'Webhook'
                        ? 'Payment confirmed by Razorpay webhook.'
                        : 'Payment verified successfully.',

                    changedBy:
                      source ===
                      'Webhook'
                        ? 'razorpay-webhook'
                        : 'system',

                    changedAt:
                      new Date()
                  }
                }
              },
              {
                new: true,
                session
              }
            );

          if (!consumed) {
            /*
             * Re-check for race.
             */
            const latest =
              await Order.findById(
                order._id
              ).session(session);

            if (
              latest?.payment
                ?.status ===
                'Paid'
            ) {
              result = {
                alreadyProcessed:
                  true,

                order:
                  latest
              };

              return;
            }

            throw new Error(
              'Payment could not be atomically confirmed. Manual review required.'
            );
          }

          result = {
            alreadyProcessed:
              false,

            order:
              consumed
          };
        }
      );

      return result;
    } finally {
      await session.endSession();
    }
  };

/*
|--------------------------------------------------------------------------
| POST /api/payment/create-order
|--------------------------------------------------------------------------
*/

router.post(
  '/create-order',
  checkoutRateLimit,
  async (req, res) => {
    let localOrder = null;
    let reservation = null;
    let reservationItems = [];

    try {
      const {
        items,
        customer,
        shippingAddress,
        billingAddress,
        customerNote = '',
        currency: requestedCurrency = 'INR'
      } = req.body;

      const orderCurrency = String(requestedCurrency || 'INR').toUpperCase();

      if (!allowedPaymentCurrencies.has(orderCurrency)) {
        return res.status(400).json({ success: false, message: `Checkout is not enabled for ${orderCurrency}.` });
      }

      validateCustomer(
        customer
      );

      validateAddress(
        shippingAddress,
        'Shipping'
      );

      validateAddress(
        billingAddress ||
          shippingAddress,
        'Billing'
      );

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Cart cannot be empty.'
        });
      }

      /*
       * Normalize duplicate products.
       */
      const itemMap =
        new Map();

      for (const item of items) {
        if (
          !mongoose.Types.ObjectId.isValid(
            item.productId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid product in cart.'
          });
        }

        const quantity =
          Number(
            item.quantity
          );

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity < 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid product quantity.'
          });
        }

        const variantId = item.variantId && mongoose.Types.ObjectId.isValid(item.variantId)
          ? String(item.variantId)
          : '';
        const itemKey = `${item.productId}:${variantId}`;

        itemMap.set(
          itemKey,
          (
            itemMap.get(
              itemKey
            ) || 0
          ) + quantity
        );
      }

      const normalizedItems = Array.from(itemMap.entries()).map(
        ([itemKey, quantity]) => {
          const [productId, variantId = ''] = itemKey.split(':');
          return { productId, variantId, quantity };
        }
      );

      const productIds =
        normalizedItems.map(
          (item) =>
            item.productId
        );

      const products =
        await Product.find({
          _id: {
            $in: productIds
          },

          archived: {
            $ne: true
          }
        });

      if (
        products.length !==
        productIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            'One or more products in your cart are no longer available.'
        });
      }

      const productMap =
        new Map(
          products.map(
            (product) => [
              product._id.toString(),
              product
            ]
          )
        );

      const orderItems = [];

      for (
        const cartItem of
          normalizedItems
      ) {
        const product =
          productMap.get(
            cartItem.productId
          );

        if (!product) {
          throw new Error(
            'Product not found.'
          );
        }

        const selectedVariant = cartItem.variantId
          ? product.variants.id(cartItem.variantId)
          : null;

        if (cartItem.variantId && (!selectedVariant || selectedVariant.isActive === false)) {
          throw new Error(`The selected variant for "${product.name}" is no longer available.`);
        }

        if (
          product.isDirectPurchaseAllowed !==
          true
        ) {
          throw new Error(
            `"${product.name}" is available through Request Quote only.`
          );
        }

        const quantity =
          cartItem.quantity;

        const moq =
          Number(
            product.moq
          ) || 1;

        if (
          quantity < moq
        ) {
          throw new Error(
            `"${product.name}" requires a minimum order quantity of ${moq}.`
          );
        }

        let resolved;

        try {
          /*
           * IMPORTANT:
           * The payment server MUST use the same authoritative
           * pricingService as product listing/detail/checkout.
           *
           * This means an admin only needs to enter the product
           * base price (e.g. INR 100). USD/EUR/GBP/AED/JPY/etc.
           * are automatically calculated from the configured FX
           * rate unless the admin explicitly chooses:
           *
           *   auto       = base × FX
           *   multiplier = base × FX × multiplier
           *   override   = exact selling price
           *
           * Quantity pricing and pricing rules are also applied here.
           */
          const pricedProduct = selectedVariant
            ? { ...product.toObject(), price: Number(selectedVariant.price) || 0 }
            : product;

          resolved =
            await getProductPrice({
              product: pricedProduct,
              currency:
                orderCurrency,
              quantity
            });
        } catch (priceErr) {
          throw new Error(
            priceErr.message
          );
        }

        const unitPrice =
          roundMoney(
            resolved.amount
          );

        if (
          !Number.isFinite(
            unitPrice
          ) ||
          unitPrice <= 0
        ) {
          throw new Error(
            `"${product.name}" does not have a valid selling price in ${orderCurrency}.`
          );
        }

        const lineTotal =
          roundMoney(
            unitPrice *
              quantity
          );

        orderItems.push({
          product:
            product._id,

          sku:
            product.sku,

          name:
            selectedVariant?.name ? `${product.name} — ${selectedVariant.name}` : product.name,

          variantId:
            selectedVariant?._id || null,

          variantName:
            selectedVariant?.name || '',

          variantAttributes:
            selectedVariant?.attributes || {},

          imageUrl:
            product.imageUrl ||
            '',

          quantity,

          unitPrice,

          lineTotal
        });
      }

      const subtotal =
        roundMoney(
          orderItems.reduce(
            (sum, item) =>
              sum +
              item.lineTotal,
            0
          )
        );

      const taxRate =
        Math.max(
          0,
          Number(
            process.env.GST_RATE ||
              0
          )
        );

      const taxAmount =
        roundMoney(
          subtotal *
            (taxRate / 100)
        );

      const shippingAmount =
        0;

      const totalAmount =
        roundMoney(
          subtotal +
            taxAmount +
            shippingAmount
        );

      if (
        !Number.isFinite(
          totalAmount
        ) ||
        totalAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid order amount.'
        });
      }

      /*
       * Reserve inventory BEFORE payment.
       */
      reservation =
        await reserveStock(
          normalizedItems
        );

      reservationItems =
        reservation.items || [];

      const orderNumber =
        generateOrderNumber();
      const checkoutToken = newCheckoutToken();

      const normalizedShipping = {
        fullName:
          String(
            shippingAddress.fullName ||
              customer.name ||
              ''
          ).trim(),

        phone:
          String(
            shippingAddress.phone ||
              customer.phone ||
              ''
          ).trim(),

        addressLine1:
          String(
            shippingAddress.addressLine1
          ).trim(),

        addressLine2:
          String(
            shippingAddress.addressLine2 ||
              ''
          ).trim(),

        city:
          String(
            shippingAddress.city
          ).trim(),

        state:
          String(
            shippingAddress.state
          ).trim(),

        postalCode:
          String(
            shippingAddress.postalCode ||
              shippingAddress.pincode ||
              ''
          ).trim(),

        country:
          String(
            shippingAddress.country ||
              'India'
          ).trim()
      };

      const billing =
        billingAddress ||
        shippingAddress;

      const normalizedBilling = {
        fullName:
          String(
            billing.fullName ||
              customer.name ||
              ''
          ).trim(),

        phone:
          String(
            billing.phone ||
              customer.phone ||
              ''
          ).trim(),

        addressLine1:
          String(
            billing.addressLine1
          ).trim(),

        addressLine2:
          String(
            billing.addressLine2 ||
              ''
          ).trim(),

        city:
          String(
            billing.city
          ).trim(),

        state:
          String(
            billing.state
          ).trim(),

        postalCode:
          String(
            billing.postalCode ||
              billing.pincode ||
              ''
          ).trim(),

        country:
          String(
            billing.country ||
              'India'
          ).trim()
      };

      localOrder =
        await Order.create({
          orderNumber,

          customer: {
            name:
              customer.name.trim(),

            email:
              customer.email
                .trim()
                .toLowerCase(),

            phone:
              customer.phone.trim(),

            company:
              customer.company
                ?.trim() || '',

            gstin:
              customer.gstin
                ?.trim()
                .toUpperCase() ||
              ''
          },

          items:
            orderItems,

          shippingAddress:
            normalizedShipping,

          billingAddress:
            normalizedBilling,

          currency:
            orderCurrency,

          subtotal,

          taxRate,

          taxAmount,

          shippingAmount,

          totalAmount,

          customerNote:
            String(
              customerNote || ''
            ).trim(),

          checkoutAccessTokenHash: checkoutTokenHash(checkoutToken),

          payment: {
            provider:
              'Razorpay',

            status:
              'Pending'
          },

          status:
            'Payment Pending',

          inventoryReservation: {
            status:
              'Reserved',

            reservedAt:
              new Date(),

            expiresAt:
              reservation.expiresAt
          }
        });

      try {
        // Zero-decimal currencies (Razorpay): amount is NOT multiplied by 100.
        const ZERO_DECIMAL_CURRENCIES = ['JPY'];

        const razorpayAmount =
          ZERO_DECIMAL_CURRENCIES.includes(orderCurrency)
            ? Math.round(totalAmount)
            : Math.round(totalAmount * 100);

        const razorpayOrder =
          await razorpay.orders.create({
            amount:
              razorpayAmount,

            currency:
              orderCurrency,

            receipt:
              orderNumber,

            notes: {
              orderNumber,

              localOrderId:
                localOrder._id.toString()
            }
          });

        localOrder.payment.razorpayOrderId =
          razorpayOrder.id;

        await localOrder.save();

        return res.status(201).json({
          success: true,

          keyId:
            process.env
              .RAZORPAY_KEY_ID,

          razorpayOrder: {
            id:
              razorpayOrder.id,

            amount:
              razorpayOrder.amount,

            currency:
              razorpayOrder.currency
          },

          order: {
            id:
              localOrder._id,

            orderNumber:
              localOrder.orderNumber,

            subtotal:
              localOrder.subtotal,

            taxRate:
              localOrder.taxRate,

            taxAmount:
              localOrder.taxAmount,

            shippingAmount:
              localOrder.shippingAmount,

            totalAmount: localOrder.totalAmount,
            checkoutAccessToken: checkoutToken
          }
        });
      } catch (razorpayError) {
        await releaseReservation(
          localOrder
        );

        await Order.findByIdAndDelete(
          localOrder._id
        );

        throw razorpayError;
      }
    } catch (error) {
      console.error(
        'Create payment order error:',
        error
      );

      if (
        reservation &&
        reservationItems.length >
          0 &&
        !localOrder
      ) {
        try {
          await restoreReservedItems(
            reservationItems
          );
        } catch (rollbackError) {
          console.error(
            'CRITICAL inventory rollback failure:',
            rollbackError
          );
        }
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          'Unable to create payment order.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| POST /api/payment/verify-payment
|--------------------------------------------------------------------------
*/

router.post(
  '/verify-payment',
  verifyRateLimit,
  async (req, res) => {
    try {
      const {
        localOrderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        checkoutAccessToken
      } = req.body;

      if (
        !localOrderId ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
        || !checkoutAccessToken
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment verification fields are required.'
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          localOrderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid local order ID.'
        });
      }

      const order = await Order.findById(localOrderId).select('+checkoutAccessTokenHash');

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            'Order not found.'
        });
      }

      if (!checkoutTokenMatches(order.checkoutAccessTokenHash, checkoutAccessToken)) {
        return res.status(403).json({ success: false, message: 'Checkout session is not authorized.' });
      }

      if (
        order.payment
          ?.razorpayOrderId !==
        razorpay_order_id
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Razorpay order does not match our order.'
        });
      }

      const gatewayPayment = await razorpay.payments.fetch(razorpay_payment_id);
      const expectedAmount = Math.round(Number(order.totalAmount) * 100);
      if (gatewayPayment.order_id !== razorpay_order_id || gatewayPayment.status !== 'captured' || Number(gatewayPayment.amount) !== expectedAmount || String(gatewayPayment.currency || '').toUpperCase() !== order.currency) {
        return res.status(409).json({ success: false, message: 'Payment is not captured or does not match this order yet. Please wait for confirmation.' });
      }

      if (
        !verifyPaymentSignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid payment signature.'
        });
      }

      const result =
        await processSuccessfulPayment({
          orderId:
            localOrderId,

          razorpayOrderId:
            razorpay_order_id,

          razorpayPaymentId:
            razorpay_payment_id,

          razorpaySignature:
            razorpay_signature,

          source:
            'Frontend'
        });

      return res.json({
        success: true,

        alreadyProcessed:
          result.alreadyProcessed,

        message:
          result.alreadyProcessed
            ? 'Payment was already processed.'
            : 'Payment verified successfully.',

        order: {
          id:
            result.order._id,

          orderNumber:
            result.order.orderNumber,

          status:
            result.order.status,

          paymentStatus:
            result.order.payment
              .status,

          totalAmount:
            result.order.totalAmount
        }
      });
    } catch (error) {
      console.error(
        'Verify payment error:',
        error
      );

      return res.status(409).json({
        success: false,
        message:
          error.message ||
          'Payment verification failed.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| POST /api/payment/webhook
|--------------------------------------------------------------------------
|
| Razorpay -> Backend
|
| IMPORTANT:
| server.js MUST preserve req.rawBody.
|
*/

router.post(
  '/webhook',
  async (req, res) => {
    try {
      const signature =
        req.headers[
          'x-razorpay-signature'
        ];

      const rawBody =
        req.rawBody;

      if (
        !rawBody ||
        !verifyWebhookSignature(
          rawBody,
          signature
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid webhook signature.'
        });
      }

      const event =
        req.body;

      const eventName =
        event?.event;

      /*
       * ---------------------------------------------------------
       * PAYMENT CAPTURED / AUTHORIZED
       * ---------------------------------------------------------
       */

      if (
        eventName ===
          'payment.captured'
      ) {
        const payment =
          event.payload
            ?.payment?.entity;

        const razorpayOrderId =
          payment?.order_id;

        const razorpayPaymentId =
          payment?.id;

        if (
          !razorpayOrderId ||
          !razorpayPaymentId
        ) {
          return res.json({
            success: true,
            ignored: true
          });
        }

        const order =
          await Order.findOne({
            'payment.razorpayOrderId':
              razorpayOrderId
          });

        if (!order) {
          return res.json({
            success: true,
            ignored: true
          });
        }

        if (payment.status !== 'captured' || Number(payment.amount) !== Math.round(Number(order.totalAmount) * 100) || String(payment.currency || '').toUpperCase() !== order.currency) {
          return res.status(400).json({ success: false, message: 'Webhook payment details do not match this order.' });
        }

        const result =
          await processSuccessfulPayment({
            orderId:
              order._id,

            razorpayOrderId,

            razorpayPaymentId,

            source:
              'Webhook'
          });

        return res.json({
          success: true,

          alreadyProcessed:
            result.alreadyProcessed
        });
      }

      /*
       * ---------------------------------------------------------
       * PAYMENT FAILED
       * ---------------------------------------------------------
       */

      if (
        eventName ===
        'payment.failed'
      ) {
        const payment =
          event.payload
            ?.payment?.entity;

        const razorpayOrderId =
          payment?.order_id;

        if (!razorpayOrderId) {
          return res.json({
            success: true,
            ignored: true
          });
        }

        const session =
          await mongoose.startSession();

        try {
          await session.withTransaction(
            async () => {
              const order =
                await Order.findOne({
                  'payment.razorpayOrderId':
                    razorpayOrderId
                }).session(session);

              if (!order) {
                return;
              }

              /*
               * Never convert Paid -> Failed.
               */
              if (
                order.payment
                  ?.status ===
                'Paid'
              ) {
                return;
              }

              /*
               * Release only if reservation
               * is still Reserved.
               */
              const released =
                await Order.findOneAndUpdate(
                  {
                    _id:
                      order._id,

                    'inventoryReservation.status':
                      'Reserved'
                  },
                  {
                    $set: {
                      'inventoryReservation.status':
                        'Released',

                      'inventoryReservation.releasedAt':
                        new Date()
                    }
                  },
                  {
                    new: true,
                    session
                  }
                );

              if (released) {
                for (const item of
                  released.items || []) {
                  await Product.findByIdAndUpdate(
                    item.product,
                    {
                      $inc: {
                        ...itemStockRestore(item)
                      }
                    },
                    itemStockRestoreOptions(item, session)
                  );
                }
              }

              order.payment.status =
                'Failed';

              order.payment.failureReason =
                payment?.error_description ||
                payment?.error_reason ||
                'Razorpay payment failed.';

              order.status =
                'Payment Failed';

              addStatusHistory(
                order,
                'Payment Failed',
                order.payment
                  .failureReason,
                'razorpay-webhook'
              );

              await order.save({
                session
              });
            }
          );
        } finally {
          await session.endSession();
        }

        return res.json({
          success: true
        });
      }

      /*
       * ---------------------------------------------------------
       * REFUND PROCESSED
       * ---------------------------------------------------------
       */

      if (
        eventName ===
        'refund.processed'
      ) {
        const refund =
          event.payload
            ?.refund?.entity;

        const paymentId =
          refund?.payment_id;

        if (!paymentId) {
          return res.json({
            success: true,
            ignored: true
          });
        }

        const order =
          await Order.findOne({
            'payment.razorpayPaymentId':
              paymentId
          });

        if (!order) {
          return res.json({
            success: true,
            ignored: true
          });
        }

        /*
         * Refund may already have been processed
         * by admin endpoint.
         */
        if (
          order.payment
            ?.status ===
            'Refunded'
        ) {
          if (
            !order.payment
              .razorpayRefundId
          ) {
            order.payment
              .razorpayRefundId =
              refund.id || '';

            await order.save();
          }

          return res.json({
            success: true,
            alreadyProcessed:
              true
          });
        }

        const session =
          await mongoose.startSession();

        try {
          await session.withTransaction(
            async () => {
              const freshOrder =
                await Order.findById(
                  order._id
                ).session(session);

              if (!freshOrder) {
                return;
              }

              if (
                freshOrder.payment
                  ?.status ===
                'Refunded'
              ) {
                return;
              }

              /*
               * Mark refund first.
               */
              freshOrder.payment.status =
                'Refunded';

              freshOrder.payment
                .razorpayRefundId =
                refund.id || '';

              freshOrder.payment
                .refundedAt =
                new Date();

              /*
               * Restore inventory exactly once.
               */
              if (
                freshOrder.inventoryRestored !==
                true
              ) {
                freshOrder.inventoryRestored =
                  true;

                freshOrder
                  .inventoryReservation
                  .status =
                  'Restored';

                freshOrder
                  .inventoryReservation
                  .restoredAt =
                  new Date();

                for (const item of
                  freshOrder.items ||
                  []) {
                  const product =
                    await Product.findByIdAndUpdate(
                      item.product,
                      {
                        $inc: {
                          ...itemStockRestore(item)
                        }
                      },
                      itemStockRestoreOptions(item, session)
                    );

                  if (!product) {
                    throw new Error(
                      `Product not found during webhook refund restoration: ${item.product}`
                    );
                  }
                }
              }

              freshOrder.status =
                'Refunded';

              addStatusHistory(
                freshOrder,
                'Refunded',
                'Refund confirmed by Razorpay webhook and inventory restored.',
                'razorpay-webhook'
              );

              await freshOrder.save({
                session
              });
            }
          );
        } finally {
          await session.endSession();
        }

        return res.json({
          success: true
        });
      }

      /*
       * Other Razorpay events are acknowledged.
       */
      return res.json({
        success: true,
        ignored: true,
        event:
          eventName || null
      });
    } catch (error) {
      console.error(
        'Razorpay webhook error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Webhook processing failed.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| POST /api/payment/cancel-order
|--------------------------------------------------------------------------
*/

router.post(
  '/cancel-order',
  verifyRateLimit,
  async (req, res) => {
    try {
      const {
        localOrderId
        , checkoutAccessToken
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          localOrderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid local order ID.'
        });
      }

      const order =
        await Order.findById(localOrderId).select('+checkoutAccessTokenHash');

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            'Order not found.'
        });
      }

      if (!checkoutAccessToken || !checkoutTokenMatches(order.checkoutAccessTokenHash, checkoutAccessToken)) {
        return res.status(403).json({ success: false, message: 'Checkout session is not authorized.' });
      }

      if (
        order.payment?.status ===
        'Paid'
      ) {
        return res.status(409).json({
          success: false,
          message:
            'Paid order cannot be cancelled through this endpoint.'
        });
      }

      if (
        [
          'Cancelled',
          'Payment Failed',
          'Refunded'
        ].includes(
          order.status
        )
      ) {
        return res.json({
          success: true,
          message:
            'Order was already closed.'
        });
      }

      const released =
        await releaseReservation(
          order
        );

      if (!released) {
        const latest =
          await Order.findById(
            order._id
          );

        if (
          latest?.payment
            ?.status ===
          'Paid'
        ) {
          return res.status(409).json({
            success: false,
            message:
              'Payment completed concurrently. Order cannot be cancelled here.'
          });
        }
      }

      order.payment.status =
        'Failed';

      order.payment.failureReason =
        'Checkout cancelled by customer.';

      order.status =
        'Cancelled';

      order.cancellation = {
        cancelledAt:
          new Date(),

        cancelledBy:
          'customer',

        reason:
          'Checkout cancelled before payment.'
      };

      addStatusHistory(
        order,
        'Cancelled',
        'Checkout cancelled before payment.',
        'customer'
      );

      await order.save();

      return res.json({
        success: true,

        message:
          'Checkout cancelled and inventory released.',

        order: {
          id:
            order._id,

          orderNumber:
            order.orderNumber,

          status:
            order.status
        }
      });
    } catch (error) {
      console.error(
        'Cancel payment order error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

module.exports = router;
