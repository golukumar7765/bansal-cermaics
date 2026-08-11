const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');

const router =
  express.Router();

const Order =
  require('../models/Order');

const protect =
  require('../middleware/authMiddleware');

const {
  restoreOrderStock
} = require(
  '../services/inventoryService'
);

const ORDER_STATUSES = [
  'Payment Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Stock Review',
  'Cancelled',
  'Payment Failed',
  'Refunded'
];

const ACTIVE_FLOW = [
  'Payment Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered'
];

const razorpay =
  new Razorpay({
    key_id:
      process.env.RAZORPAY_KEY_ID,

    key_secret:
      process.env.RAZORPAY_KEY_SECRET
  });

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const escapeRegex = (
  value = ''
) =>
  String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );

const getAdminName = (req) =>
  req.admin?.email ||
  req.admin?.name ||
  req.admin?.username ||
  req.user?.email ||
  req.user?.name ||
  req.user?.username ||
  'admin';

const addStatusHistory = (
  order,
  status,
  note = '',
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

    changedBy:
      String(
        changedBy ||
          'system'
      ),

    changedAt:
      new Date()
  });
};

const getCurrentFlowIndex =
  (status) =>
    ACTIVE_FLOW.indexOf(
      status
    );

const validateStatusTransition = (
  currentStatus,
  nextStatus
) => {
  if (
    currentStatus ===
    nextStatus
  ) {
    return {
      allowed: false,
      message:
        `Order is already ${nextStatus}.`
    };
  }

  if (
    currentStatus ===
    'Delivered'
  ) {
    return {
      allowed: false,
      message:
        'Delivered orders cannot be changed.'
    };
  }

  if (
    currentStatus ===
    'Refunded'
  ) {
    return {
      allowed: false,
      message:
        'Refunded orders cannot be changed.'
    };
  }

  if (
    currentStatus ===
    'Payment Failed'
  ) {
    return {
      allowed: false,
      message:
        'Payment failed orders cannot be changed.'
    };
  }

  if (
    currentStatus ===
    'Cancelled'
  ) {
    return {
      allowed: false,
      message:
        'Cancelled orders cannot be changed.'
    };
  }

  if (
    nextStatus ===
    'Cancelled'
  ) {
    if (
      currentStatus ===
        'Confirmed' ||
      currentStatus ===
        'Processing'
    ) {
      return {
        allowed: true
      };
    }

    return {
      allowed: false,
      message:
        currentStatus ===
        'Shipped'
          ? 'A shipped order cannot be cancelled from the normal status flow.'
          : 'This order cannot be cancelled at its current stage.'
    };
  }

  /*
   * Refund is a separate financial operation.
   */
  if (
    nextStatus ===
    'Refunded'
  ) {
    return {
      allowed: true
    };
  }

  const currentIndex =
    getCurrentFlowIndex(
      currentStatus
    );

  const nextIndex =
    getCurrentFlowIndex(
      nextStatus
    );

  if (
    currentIndex === -1 ||
    nextIndex === -1
  ) {
    if (
      nextStatus ===
        'Stock Review' &&
      (
        currentStatus ===
          'Payment Pending' ||
        currentStatus ===
          'Confirmed'
      )
    ) {
      return {
        allowed: true
      };
    }

    if (
      currentStatus ===
        'Stock Review' &&
      nextStatus ===
        'Confirmed'
    ) {
      return {
        allowed: true
      };
    }

    return {
      allowed: false,
      message:
        `Invalid transition from "${currentStatus}" to "${nextStatus}".`
    };
  }

  if (
    nextIndex !==
    currentIndex + 1
  ) {
    return {
      allowed: false,
      message:
        `Invalid status transition from "${currentStatus}" to "${nextStatus}".`
    };
  }

  return {
    allowed: true
  };
};

/*
|--------------------------------------------------------------------------
| PUBLIC TRACKING
|--------------------------------------------------------------------------
*/

router.get(
  '/track/:orderNumber',
  async (req, res) => {
    try {
      const orderNumber =
        String(
          req.params
            .orderNumber ||
            ''
        ).trim();

      if (!orderNumber) {
        return res.status(400).json({
          success: false,
          message:
            'Order number is required.'
        });
      }

      const order =
        await Order.findOne({
          orderNumber: {
            $regex:
              `^${escapeRegex(
                orderNumber
              )}$`,

            $options: 'i'
          }
        }).lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            'Order not found.'
        });
      }

      const publicOrder = {
        _id:
          order._id,

        orderNumber:
          order.orderNumber,

        customer: {
          name:
            order.customer
              ?.name || ''
        },

        items: (
          order.items || []
        ).map(
          (item) => ({
            product:
              item.product,

            sku:
              item.sku,

            name:
              item.name,

            imageUrl:
              item.imageUrl ||
              '',

            quantity:
              item.quantity,

            unitPrice:
              item.unitPrice,

            lineTotal:
              item.lineTotal
          })
        ),

        currency:
          order.currency ||
          'INR',

        subtotal:
          order.subtotal ||
          0,

        taxRate:
          order.taxRate ||
          0,

        taxAmount:
          order.taxAmount ||
          0,

        shippingAmount:
          order.shippingAmount ||
          0,

        totalAmount:
          order.totalAmount ||
          0,

        status:
          order.status ||
          'Payment Pending',

        customerNote:
          order.customerNote ||
          '',

        tracking: {
          courier:
            order.tracking
              ?.courier || '',

          trackingNumber:
            order.tracking
              ?.trackingNumber ||
            '',

          trackingUrl:
            order.tracking
              ?.trackingUrl || ''
        },

        paidAt:
          order.payment
            ?.paidAt || null,

        shippedAt:
          order.shippedAt ||
          null,

        deliveredAt:
          order.deliveredAt ||
          null,

        cancelledAt:
          order.cancelledAt ||
          null,

        createdAt:
          order.createdAt,

        updatedAt:
          order.updatedAt
      };

      return res.json({
        success: true,
        data:
          publicOrder
      });
    } catch (error) {
      console.error(
        'Public order tracking error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to load order tracking.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET ALL ORDERS
|--------------------------------------------------------------------------
*/

router.get(
  '/',
  protect,
  async (req, res) => {
    try {
      const {
        status,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const safePage =
        Math.max(
          1,
          Number(page) || 1
        );

      const safeLimit =
        Math.min(
          100,
          Math.max(
            1,
            Number(limit) || 20
          )
        );

      const query = {};

      if (
        status &&
        status !== 'All' &&
        ORDER_STATUSES.includes(
          status
        )
      ) {
        query.status =
          status;
      }

      if (
        search?.trim()
      ) {
        const term =
          escapeRegex(
            search.trim()
          );

        query.$or = [
          {
            orderNumber: {
              $regex:
                term,

              $options:
                'i'
            }
          },

          {
            'customer.name': {
              $regex:
                term,

              $options:
                'i'
            }
          },

          {
            'customer.email': {
              $regex:
                term,

              $options:
                'i'
            }
          },

          {
            'customer.phone': {
              $regex:
                term,

              $options:
                'i'
            }
          }
        ];
      }

      const skip =
        (safePage - 1) *
        safeLimit;

      const [
        orders,
        total
      ] =
        await Promise.all([
          Order.find(query)
            .sort({
              createdAt:
                -1
            })
            .skip(skip)
            .limit(
              safeLimit
            ),

          Order.countDocuments(
            query
          )
        ]);

      return res.json({
        success: true,

        data:
          orders,

        pagination: {
          total,

          page:
            safePage,

          limit:
            safeLimit,

          pages:
            Math.ceil(
              total /
                safeLimit
            )
        }
      });
    } catch (error) {
      console.error(
        'Get orders error:',
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

/*
|--------------------------------------------------------------------------
| GET SINGLE ORDER
|--------------------------------------------------------------------------
*/

router.get(
  '/:id',
  protect,
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid order ID.'
        });
      }

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            'Order not found.'
        });
      }

      return res.json({
        success: true,
        data:
          order
      });
    } catch (error) {
      console.error(
        'Get order error:',
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

/*
|--------------------------------------------------------------------------
| PATCH /api/orders/:id/status
|--------------------------------------------------------------------------
*/

router.patch(
  '/:id/status',
  protect,
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid order ID.'
        });
      }

      const {
        status,
        adminNote,
        courier,
        trackingNumber,
        trackingUrl,
        cancellationReason
      } = req.body;

      if (
        !ORDER_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid order status.'
        });
      }

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            'Order not found.'
        });
      }

      const currentStatus =
        order.status;

      const sameStatus =
        currentStatus ===
        status;

      if (!sameStatus) {
        const transition =
          validateStatusTransition(
            currentStatus,
            status
          );

        if (
          !transition.allowed
        ) {
          return res.status(409).json({
            success: false,
            message:
              transition.message
          });
        }
      }

      /*
       * -------------------------------------------------------
       * REFUND
       * -------------------------------------------------------
       */

      if (
        status ===
        'Refunded'
      ) {
        if (
          order.payment
            ?.status ===
          'Refunded'
        ) {
          return res.json({
            success: true,
            message:
              'Order is already refunded.',
            data:
              order
          });
        }

        if (
          order.payment
            ?.status !==
          'Paid'
        ) {
          return res.status(409).json({
            success: false,
            message:
              'Only a paid order can be refunded.'
          });
        }

        const paymentId =
          order.payment
            ?.razorpayPaymentId;

        if (!paymentId) {
          return res.status(409).json({
            success: false,
            message:
              'Razorpay payment ID is missing. Cannot create automatic refund.'
          });
        }

        const refundAmount =
          Math.round(
            Number(
              order.totalAmount ||
                0
            ) * 100
          );

        if (
          !Number.isInteger(
            refundAmount
          ) ||
          refundAmount <= 0
        ) {
          return res.status(409).json({
            success: false,
            message:
              'Invalid order amount for refund.'
          });
        }

        let refund;

        try {
          refund =
            await razorpay
              .payments
              .refund(
                paymentId,
                {
                  amount:
                    refundAmount,

                  speed:
                    'normal',

                  notes: {
                    orderNumber:
                      order.orderNumber
                  }
                }
              );
        } catch (refundError) {
          console.error(
            'Razorpay refund error:',
            refundError
          );

          return res.status(502).json({
            success: false,
            message:
              refundError
                ?.error
                ?.description ||
              refundError?.description ||
              refundError?.message ||
              'Razorpay refund failed.'
          });
        }

        const session =
          await mongoose.startSession();

        try {
          let updatedOrder =
            null;

          await session.withTransaction(
            async () => {
              const freshOrder =
                await Order.findById(
                  order._id
                ).session(
                  session
                );

              if (!freshOrder) {
                throw new Error(
                  'Order disappeared while processing refund.'
                );
              }

              /*
               * Webhook may have already completed
               * the refund.
               */
              if (
                freshOrder.payment
                  ?.status ===
                'Refunded'
              ) {
                updatedOrder =
                  freshOrder;

                return;
              }

              /*
               * Razorpay refund succeeded.
               *
               * Restore stock atomically and
               * mark refund.
               */
              const restored =
                await restoreOrderStock(
                  freshOrder,
                  session
                );

              /*
               * If another request already restored,
               * do not restore twice.
               */
              if (
                restored ||
                freshOrder
                  .inventoryRestored
              ) {
                freshOrder.payment
                  .status =
                  'Refunded';

                freshOrder.payment
                  .razorpayRefundId =
                  refund?.id ||
                  '';

                freshOrder.payment
                  .refundedAt =
                  new Date();

                freshOrder.status =
                  'Refunded';

                freshOrder.refundReconciliationRequired =
                  false;

                if (
                  typeof adminNote ===
                  'string'
                ) {
                  freshOrder.adminNote =
                    adminNote.trim();
                }

                addStatusHistory(
                  freshOrder,
                  'Refunded',
                  adminNote ||
                    'Payment refunded through Razorpay and inventory restored.',
                  getAdminName(
                    req
                  )
                );

                updatedOrder =
                  await freshOrder.save({
                    session
                  });
              }
            }
          );

          return res.json({
            success: true,

            message:
              'Order refunded successfully and inventory restored.',

            data:
              updatedOrder
          });
        } catch (dbError) {
          console.error(
            'Refund database update error:',
            dbError
          );

          try {
            await Order.findByIdAndUpdate(
              order._id,
              {
                $set: {
                  refundReconciliationRequired:
                    true,

                  'payment.razorpayRefundId':
                    refund?.id ||
                    ''
                }
              }
            );
          } catch (reconciliationError) {
            console.error(
              'CRITICAL: Failed to mark refund reconciliation:',
              reconciliationError
            );
          }

          return res.status(500).json({
            success: false,

            message:
              'Razorpay refund succeeded but order database update failed. Please reconcile this order manually.',

            refundId:
              refund?.id ||
              null
          });
        } finally {
          await session.endSession();
        }
      }

      /*
       * -------------------------------------------------------
       * CANCELLATION
       * -------------------------------------------------------
       */

      if (
        status ===
        'Cancelled'
      ) {
        const session =
          await mongoose.startSession();

        try {
          let updatedOrder;

          await session.withTransaction(
            async () => {
              const freshOrder =
                await Order.findById(
                  order._id
                ).session(
                  session
                );

              if (!freshOrder) {
                throw new Error(
                  'Order not found.'
                );
              }

              if (
                freshOrder.status ===
                'Cancelled'
              ) {
                updatedOrder =
                  freshOrder;

                return;
              }

              /*
               * Paid orders:
               * restore stock.
               *
               * Refund remains separate.
               */
              if (
                freshOrder.payment
                  ?.status ===
                'Paid'
              ) {
                await restoreOrderStock(
                  freshOrder,
                  session
                );
              }

              freshOrder.status =
                'Cancelled';

              freshOrder.cancelledAt =
                freshOrder.cancelledAt ||
                new Date();

              freshOrder.cancellation = {
                ...(freshOrder
                  .cancellation
                  ?.toObject
                  ? freshOrder
                      .cancellation
                      .toObject()
                  : freshOrder
                      .cancellation ||
                    {}),

                cancelledBy:
                  getAdminName(
                    req
                  ),

                reason:
                  String(
                    cancellationReason ||
                      adminNote ||
                      'Cancelled by admin'
                  ).trim(),

                cancelledAt:
                  new Date()
              };

              if (
                typeof adminNote ===
                'string'
              ) {
                freshOrder.adminNote =
                  adminNote.trim();
              }

              addStatusHistory(
                freshOrder,
                'Cancelled',
                cancellationReason ||
                  adminNote ||
                  'Order cancelled by admin.',
                getAdminName(
                  req
                )
              );

              updatedOrder =
                await freshOrder.save({
                  session
                });
            }
          );

          return res.json({
            success: true,

            message:
              'Order cancelled successfully. Inventory was restored when applicable.',

            data:
              updatedOrder
          });
        } catch (cancelError) {
          console.error(
            'Cancel order error:',
            cancelError
          );

          return res.status(500).json({
            success: false,
            message:
              cancelError.message
          });
        } finally {
          await session.endSession();
        }
      }

      /*
       * -------------------------------------------------------
       * NORMAL STATUS UPDATE
       * -------------------------------------------------------
       */

      order.status =
        status;

      if (
        typeof adminNote ===
        'string'
      ) {
        order.adminNote =
          adminNote.trim();
      }

      if (
        typeof courier ===
        'string'
      ) {
        order.tracking.courier =
          courier.trim();
      }

      if (
        typeof trackingNumber ===
        'string'
      ) {
        order.tracking.trackingNumber =
          trackingNumber.trim();
      }

      if (
        typeof trackingUrl ===
        'string'
      ) {
        order.tracking.trackingUrl =
          trackingUrl.trim();
      }

      if (
        status ===
        'Shipped'
      ) {
        order.shippedAt =
          order.shippedAt ||
          new Date();
      }

      if (
        status ===
        'Delivered'
      ) {
        order.deliveredAt =
          order.deliveredAt ||
          new Date();
      }

      if (!sameStatus) {
        addStatusHistory(
          order,
          status,
          adminNote ||
            `Order status changed from ${currentStatus} to ${status}.`,
          getAdminName(
            req
          )
        );
      }

      await order.save();

      return res.json({
        success: true,

        message:
          sameStatus
            ? 'Order details updated successfully.'
            : 'Order status updated successfully.',

        data:
          order
      });
    } catch (error) {
      console.error(
        'Update order status error:',
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