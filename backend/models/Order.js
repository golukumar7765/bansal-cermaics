const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },

    sku: {
      type: String,
      required: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    variantName: {
      type: String,
      default: '',
      trim: true
    },

    variantAttributes: {
      type: Map,
      of: String,
      default: {}
    },

    imageUrl: {
      type: String,
      default: ''
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },

    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    company: {
      type: String,
      default: '',
      trim: true
    },

    phone: {
      type: String,
      default: '',
      trim: true
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true
    },

    addressLine2: {
      type: String,
      default: '',
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true
    },

    postalCode: {
      type: String,
      required: true,
      trim: true
    },

    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India'
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    customer: {
      name: {
        type: String,
        required: true,
        trim: true
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      },

      phone: {
        type: String,
        required: true,
        trim: true
      },

      company: {
        type: String,
        default: '',
        trim: true
      },

      gstin: {
        type: String,
        default: '',
        trim: true,
        uppercase: true
      }
    },

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: (items) =>
          Array.isArray(items) &&
          items.length > 0,

        message:
          'Order must contain at least one item.'
      }
    },

    shippingAddress: {
      type: addressSchema,
      required: true
    },

    billingAddress: {
      type: addressSchema,
      required: true
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    shippingAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    customerNote: {
      type: String,
      default: '',
      trim: true
    },

    adminNote: {
      type: String,
      default: '',
      trim: true
    },

    status: {
      type: String,

      enum: [
        'Payment Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Delivered',
        'Stock Review',
        'Cancelled',
        'Payment Failed',
        'Refunded'
      ],

      default: 'Payment Pending',

      index: true
    },

    payment: {
      provider: {
        type: String,

        enum: [
          'Razorpay',
          'Manual',
          'Other'
        ],

        default: 'Razorpay'
      },

      status: {
        type: String,

        enum: [
          'Pending',
          'Paid',
          'Failed',
          'Refunded'
        ],

        default: 'Pending'
      },

      razorpayOrderId: {
        type: String,
        default: '',
        index: true
      },

      razorpayPaymentId: {
        type: String,
        default: '',
        index: true
      },

      razorpaySignature: {
        type: String,
        default: ''
      },

      razorpayRefundId: {
        type: String,
        default: ''
      },

      paidAt: {
        type: Date,
        default: null
      },

      refundedAt: {
        type: Date,
        default: null
      },

      failureReason: {
        type: String,
        default: ''
      }
    },

    /*
     * Razorpay refund succeeded but MongoDB
     * update failed.
     *
     * Such an order must never be refunded
     * automatically a second time.
     */
    refundReconciliationRequired: {
      type: Boolean,
      default: false,
      index: true
    },

    /*
     * Where successful payment confirmation
     * came from.
     */
    paymentVerificationSource: {
      type: String,

      enum: [
        'Frontend',
        'Webhook',
        'Both'
      ],

      default: 'Frontend'
    },

    // A short-lived, high-entropy capability issued only to the browser that
    // created checkout. It stops a guessed Mongo ObjectId being used to cancel
    // or confirm somebody else's pending order.
    checkoutAccessTokenHash: {
      type: String,
      default: '',
      select: false
    },

    /*
     * Used to make webhook processing
     * idempotent for this order.
     */
    lastPaymentWebhookEventId: {
      type: String,
      default: ''
    },

    /*
     * Inventory reservation lifecycle:
     *
     * Reserved
     * Consumed
     * Released
     * Restored
     */
    inventoryReservation: {
      status: {
        type: String,

        enum: [
          'None',
          'Reserved',
          'Consumed',
          'Released',
          'Restored'
        ],

        default: 'None'
      },

      reservedAt: {
        type: Date,
        default: null
      },

      expiresAt: {
        type: Date,
        default: null
      },

      releasedAt: {
        type: Date,
        default: null
      },

      consumedAt: {
        type: Date,
        default: null
      },

      restoredAt: {
        type: Date,
        default: null
      }
    },

    inventoryRestored: {
      type: Boolean,
      default: false
    },

    statusHistory: [
      {
        status: {
          type: String,
          required: true
        },

        note: {
          type: String,
          default: ''
        },

        changedBy: {
          type: String,
          default: 'system'
        },

        changedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    tracking: {
      courier: {
        type: String,
        default: '',
        trim: true
      },

      trackingNumber: {
        type: String,
        default: '',
        trim: true
      },

      trackingUrl: {
        type: String,
        default: '',
        trim: true
      }
    },

    shippedAt: {
      type: Date,
      default: null
    },

    deliveredAt: {
      type: Date,
      default: null
    },

    cancelledAt: {
      type: Date,
      default: null
    },

    cancellation: {
      cancelledBy: {
        type: String,
        default: ''
      },

      reason: {
        type: String,
        default: ''
      },

      cancelledAt: {
        type: Date,
        default: null
      }
    }
  },

  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Order ||
  mongoose.model(
    'Order',
    orderSchema
  );
