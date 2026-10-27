const mongoose = require('mongoose');
const Product = require('../models/Product');

const RESERVATION_MINUTES = 15;

const reservationExpiry = () =>
  new Date(
    Date.now() +
      RESERVATION_MINUTES * 60 * 1000
  );

/*
|--------------------------------------------------------------------------
| NORMALIZE ITEMS
|--------------------------------------------------------------------------
*/

const normalizeItems = (items = []) => {
  const map = new Map();

  for (const item of items) {
    const productId = String(
      item.productId ||
        item.product ||
        ''
    );

    const quantity = Number(
      item.quantity
    );
    const variantId = String(item.variantId || '');

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      throw new Error(
        'Invalid product ID.'
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error(
        'Invalid inventory quantity.'
      );
    }

    if (variantId && !mongoose.Types.ObjectId.isValid(variantId)) {
      throw new Error('Invalid product variant ID.');
    }

    const key = `${productId}:${variantId}`;
    map.set(
      key,
      (map.get(key) || 0) +
        quantity
    );
  }

  return Array.from(
    map.entries()
  ).map(
    ([key, quantity]) => {
      const [productId, variantId = ''] = key.split(':');
      return { productId, variantId, quantity };
    }
  );
};

const stockIncrement = (item, quantity) => ({
  stock: quantity,
  ...(item.variantId ? { 'variants.$[selectedVariant].stock': quantity } : {})
});

const stockUpdateOptions = (item, session = null) => ({
  new: true,
  ...(session ? { session } : {}),
  ...(item.variantId ? { arrayFilters: [{ 'selectedVariant._id': item.variantId }] } : {})
});

/*
|--------------------------------------------------------------------------
| RAW RESTORE
|--------------------------------------------------------------------------
|
| Used only when reservation succeeded but
| Order creation failed.
|
*/

const restoreReservedItems = async (
  items = [],
  session = null
) => {
  for (const item of items) {
    if (
      !item?.productId ||
      !Number.isInteger(
        Number(item.quantity)
      ) ||
      Number(item.quantity) < 1
    ) {
      continue;
    }

    const query =
      Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            ...stockIncrement(item, Number(item.quantity))
          }
        },
        stockUpdateOptions(item, session)
      );

    await query.exec();
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| RESERVE STOCK
|--------------------------------------------------------------------------
|
| Atomic:
|
| stock >= quantity
|       ↓
| stock -= quantity
|
*/

const reserveStock = async (
  items
) => {
  const normalized =
    normalizeItems(items);

  const reserved = [];

  try {
    for (const item of normalized) {
      const updated =
        await Product.findOneAndUpdate(
          {
            _id:
              item.productId,

            archived: {
              $ne: true
            },

            isDirectPurchaseAllowed:
              true,

            ...(item.variantId ? {
              variants: { $elemMatch: { _id: item.variantId, isActive: { $ne: false }, stock: { $gte: item.quantity } } }
            } : {
              $or: [{ variants: { $exists: false } }, { variants: { $size: 0 } }]
            }),

            $expr: {
              $gte: [
                {
                  $ifNull: [
                    '$stock',
                    0
                  ]
                },
                item.quantity
              ]
            }
          },
          {
            $inc: {
              ...stockIncrement(item, -item.quantity)
            }
          },
          stockUpdateOptions(item)
        );

      if (!updated) {
        const product =
          await Product.findById(
            item.productId
          ).select(
            'name stock archived isDirectPurchaseAllowed'
          );

        if (!product) {
          throw new Error(
            `Product ${item.productId} was not found.`
          );
        }

        if (product.archived) {
          throw new Error(
            `"${product.name}" is no longer available.`
          );
        }

        if (
          product.isDirectPurchaseAllowed !==
          true
        ) {
          throw new Error(
            `"${product.name}" is available through Request Quote only.`
          );
        }

        const stock =
          Number(
            product.stock
          ) || 0;

        throw new Error(
          `"${product.name}" has only ${stock} unit(s) available.`
        );
      }

      reserved.push({
        productId:
          item.productId,

        variantId: item.variantId || '',

        quantity:
          item.quantity
      });
    }

    return {
      items: reserved,

      expiresAt:
        reservationExpiry()
    };
  } catch (error) {
    try {
      await restoreReservedItems(
        reserved
      );
    } catch (rollbackError) {
      console.error(
        'CRITICAL: Failed to rollback inventory reservation:',
        rollbackError
      );
    }

    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| RELEASE RESERVATION
|--------------------------------------------------------------------------
|
| Reserved -> Released
|
| IMPORTANT:
| The state transition is atomic FIRST.
| Only the request that wins the race
| returns stock.
|
*/

const releaseReservation =
  async (order, session = null) => {
    if (!order?._id) {
      throw new Error(
        'Valid order is required.'
      );
    }

    const query =
      order.constructor.findOneAndUpdate(
        {
          _id: order._id,

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
          new: true
        }
      );

    if (session) {
      query.session(session);
    }

    const updatedOrder =
      await query.exec();

    if (!updatedOrder) {
      return false;
    }

    for (const item of
      updatedOrder.items || []) {
      const productQuery =
        Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              ...stockIncrement(item, item.quantity)
            }
          },
          stockUpdateOptions(item, session)
        );

      const product =
        await productQuery.exec();

      if (!product) {
        throw new Error(
          `Product not found while releasing stock: ${
            item.name ||
            item.sku ||
            item.product
          }`
        );
      }
    }

    return true;
  };

/*
|--------------------------------------------------------------------------
| CONSUME RESERVATION
|--------------------------------------------------------------------------
|
| Reserved -> Consumed
|
| NO stock change here.
|
| Stock was already deducted when reservation
| was created.
|
*/

const consumeReservation =
  async (
    order,
    session = null
  ) => {
    if (!order?._id) {
      return false;
    }

    const query =
      order.constructor.findOneAndUpdate(
        {
          _id: order._id,

          'inventoryReservation.status':
            'Reserved'
        },
        {
          $set: {
            'inventoryReservation.status':
              'Consumed',

            'inventoryReservation.consumedAt':
              new Date()
          }
        },
        {
          new: true
        }
      );

    if (session) {
      query.session(session);
    }

    const updated =
      await query.exec();

    if (!updated) {
      return false;
    }

    order.inventoryReservation =
      updated.inventoryReservation;

    return true;
  };

/*
|--------------------------------------------------------------------------
| RESTORE PAID ORDER STOCK
|--------------------------------------------------------------------------
|
| Paid
|  ↓
| Cancel / Refund
|  ↓
| Restore stock
|
| Atomic claim prevents double restoration.
|
*/

const restoreOrderStock =
  async (
    order,
    session = null
  ) => {
    if (!order?._id) {
      throw new Error(
        'Valid order is required.'
      );
    }

    if (
      order.payment?.status !==
      'Paid'
    ) {
      return false;
    }

    const claimQuery =
      order.constructor.findOneAndUpdate(
        {
          _id: order._id,

          inventoryRestored: {
            $ne: true
          },

          'payment.status':
            'Paid'
        },
        {
          $set: {
            inventoryRestored:
              true,

            'inventoryReservation.status':
              'Restored',

            'inventoryReservation.restoredAt':
              new Date()
          }
        },
        {
          new: true
        }
      );

    if (session) {
      claimQuery.session(
        session
      );
    }

    const claimedOrder =
      await claimQuery.exec();

    if (!claimedOrder) {
      return false;
    }

    for (const item of
      claimedOrder.items || []) {
      const productQuery =
        Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              ...stockIncrement(item, item.quantity)
            }
          },
          stockUpdateOptions(item, session)
        );

      const product =
        await productQuery.exec();

      if (!product) {
        throw new Error(
          `Product not found while restoring stock: ${
            item.name ||
            item.sku ||
            item.product
          }`
        );
      }
    }

    order.inventoryRestored =
      true;

    order.inventoryReservation =
      claimedOrder.inventoryReservation;

    return true;
  };

/*
|--------------------------------------------------------------------------
| EXPIRED RESERVATIONS
|--------------------------------------------------------------------------
*/

const releaseExpiredReservations =
  async (Order) => {
    if (!Order) {
      throw new Error(
        'Order model is required.'
      );
    }

    const now =
      new Date();

    const orders =
      await Order.find({
        'inventoryReservation.status':
          'Reserved',

        'inventoryReservation.expiresAt':
          {
            $lte: now
          }
      });

    let count = 0;

    for (const order of orders) {
      try {
        const released =
          await releaseReservation(
            order
          );

        if (!released) {
          continue;
        }

        /*
         * Re-read after atomic release.
         *
         * If payment won another race,
         * NEVER overwrite Paid.
         */
        const freshOrder =
          await Order.findById(
            order._id
          );

        if (!freshOrder) {
          continue;
        }

        if (
          freshOrder.payment?.status ===
          'Paid'
        ) {
          continue;
        }

        freshOrder.status =
          'Payment Failed';

        freshOrder.payment =
          freshOrder.payment || {};

        freshOrder.payment.status =
          'Failed';

        freshOrder.payment.failureReason =
          'Payment window expired.';

        freshOrder.statusHistory =
          freshOrder.statusHistory || [];

        freshOrder.statusHistory.push({
          status:
            'Payment Failed',

          note:
            'Inventory reservation expired before payment.',

          changedBy:
            'system',

          changedAt:
            new Date()
        });

        await freshOrder.save();

        count++;
      } catch (error) {
        console.error(
          `Failed to release expired reservation for ${order.orderNumber}:`,
          error.message
        );
      }
    }

    return count;
  };

module.exports = {
  reserveStock,
  releaseReservation,
  consumeReservation,
  restoreOrderStock,
  releaseExpiredReservations,
  restoreReservedItems
};
