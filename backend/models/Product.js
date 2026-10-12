const mongoose = require('mongoose');

/* =========================================================
   SPECIFICATION
========================================================= */

const specificationSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true
      },

      value: {
        type: String,
        required: true,
        trim: true
      },

      unit: {
        type: String,
        default: '',
        trim: true
      }
    },
    {
      _id: false
    }
  );

/* =========================================================
   PRODUCT IMAGE
========================================================= */

const productImageSchema =
  new mongoose.Schema(
    {
      url: {
        type: String,
        required: true,
        trim: true
      },

      alt: {
        type: String,
        default: '',
        trim: true
      },

      sortOrder: {
        type: Number,
        default: 0
      },

      isPrimary: {
        type: Boolean,
        default: false
      }
    },
    {
      _id: false
    }
  );

/* =========================================================
   PRODUCT DOCUMENT
========================================================= */

const productDocumentSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        default: '',
        trim: true
      },

      url: {
        type: String,
        required: true,
        trim: true
      },

      type: {
        type: String,
        default: '',
        trim: true
      }
    },
    {
      _id: false
    }
  );

/* =========================================================
   PRODUCT VARIANT
========================================================= */

const variantSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true
      },

      sku: {
        type: String,
        default: '',
        trim: true,
        uppercase: true
      },

      price: {
        type: Number,
        min: 0,
        default: 0
      },

      stock: {
        type: Number,
        min: 0,
        default: 0
      },

      /*
       * Completely dynamic variant attributes.
       *
       * Examples:
       *
       * {
       *   size: "Large",
       *   material: "Steel",
       *   capacity: "500ml"
       * }
       *
       * No field is hardcoded.
       */
      attributes: {
        type: Map,
        of: String,
        default: {}
      },

      imageUrl: {
        type: String,
        default: '',
        trim: true
      },

      isActive: {
        type: Boolean,
        default: true
      }
    },
    {
      _id: true
    }
  );

/* =========================================================
   CURRENCY PRICING CONFIG
========================================================= */

const currencyPricingSchema =
  new mongoose.Schema(
    {
      mode: {
        type: String,
        enum: [
          'auto',
          'multiplier',
          'override'
        ],
        default: 'auto'
      },
      multiplier: {
        type: Number,
        default: 1,
        min: 0
      },
      price: {
        type: Number,
        default: null,
        min: 0
      },
      // 👇 Add this line so overridePrice gets saved successfully
      overridePrice: {
        type: Number,
        default: null,
        min: 0
      }
    },
    {
      _id: false
    }
  );

/* =========================================================
   QUANTITY TIER
========================================================= */

const quantityTierSchema =
  new mongoose.Schema(
    {
      currency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
      },

      minQuantity: {
        type: Number,
        required: true,
        min: 1
      },

      maxQuantity: {
        type: Number,
        default: null,
        min: 1
      },

      price: {
        type: Number,
        required: true,
        min: 0
      }
    },
    {
      _id: false
    }
  );

/* =========================================================
   PRODUCT PRICING
========================================================= */

const pricingSchema =
  new mongoose.Schema(
    {
      /*
       * base
       * currency
       * rule
       *
       * Kept dynamic for admin UI.
       */
      pricingMode: {
        type: String,
        enum: [
          'base',
          'currency',
          'rule'
        ],
        default: 'base'
      },

      allowCurrencyConversion: {
        type: Boolean,
        default: true
      },

      allowQuantityPricing: {
        type: Boolean,
        default: false
      },

      /*
       * Legacy exact currency overrides.
       *
       * Example:
       *
       * USD: 2.50
       * EUR: 2.10
       */
      currencyMultipliers: {
        type: Map,
        of: Number,
        default: {}
      },

      /*
       * NEW dynamic currency strategy.
       *
       * Example:
       *
       * USD:
       * {
       *   mode: "multiplier",
       *   multiplier: 1.5
       * }
       *
       * EUR:
       * {
       *   mode: "auto"
       * }
       *
       * GBP:
       * {
       *   mode: "override",
       *   price: 10
       * }
       */
      currencyPricing: {
        type: Map,
        of: currencyPricingSchema,
        default: {}
      },

      quantityTiers: {
        type: [quantityTierSchema],
        default: []
      }
    },
    {
      _id: false
    }
  );

/* =========================================================
   SEO
========================================================= */

const seoSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        default: '',
        trim: true
      },

      description: {
        type: String,
        default: '',
        trim: true
      },

      keywords: {
        type: [String],
        default: []
      },

      slug: {
        type: String,
        default: '',
        trim: true,
        lowercase: true,
        index: true
      }
    },
    {
      _id: false
    }
  );

/* =========================================================
   PRODUCT
========================================================= */

const productSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         BASIC
      ===================================================== */

      sku: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true
      },

      name: {
        type: String,
        required: true,
        trim: true,
        index: true
      },
      storeType: {
        type: String,
        enum: ['B2B', 'B2C'],
        default: 'B2B',
        index: true
      },

      /* =====================================================
         CATEGORY
      ===================================================== */

      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
        index: true
      },

      subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
        index: true
      },

      /*
       * Backward compatibility.
       */
      category: {
        type: String,
        default: '',
        trim: true
      },

      subcategory: {
        type: String,
        default: '',
        trim: true
      },

      /* =====================================================
         BASE PRICE
      ===================================================== */

      price: {
        type: Number,
        default: 0,
        min: 0
      },

      baseCurrency: {
        type: String,
        default: 'INR',
        trim: true,
        uppercase: true,
        index: true
      },

      /*
       * Exact product-level currency overrides.
       *
       * Example:
       *
       * {
       *   USD: 2.5,
       *   EUR: 2.1
       * }
       */
      currencyPrices: {
        type: Map,
        of: Number,
        default: {}
      },

      pricing: {
        type: pricingSchema,
        default: {}
      },
currencyPricing: {
        type: Map,
        of: currencyPricingSchema,
        default: {}
      },
      /* =====================================================
         MOQ / STOCK
      ===================================================== */

      moq: {
        type: Number,
        default: 1,
        min: 1
      },

      stock: {
        type: Number,
        default: 0,
        min: 0
      },

      /* =====================================================
         PURCHASE / VISIBILITY
      ===================================================== */

      isDirectPurchaseAllowed: {
        type: Boolean,
        default: true
      },

      archived: {
        type: Boolean,
        default: false,
        index: true
      },

      /*
       * Featured product.
       */
      featured: {
        type: Boolean,
        default: false,
        index: true
      },

      /*
       * Customer-facing publication flag.
       */
      published: {
        type: Boolean,
        default: true,
        index: true
      },

      /* =====================================================
         MEDIA
      ===================================================== */

      imageUrl: {
        type: String,
        default: '',
        trim: true
      },

      /*
       * IMPORTANT:
       *
       * Images are OBJECTS, not strings.
       *
       * This fixes:
       *
       * Cast to [string] failed for images.0
       */
      images: {
        type: [productImageSchema],
        default: []
      },

      /* =====================================================
         CONTENT
      ===================================================== */

      shortDescription: {
        type: String,
        default: '',
        trim: true
      },

      description: {
        type: String,
        default: ''
      },

      /* =====================================================
         DYNAMIC FEATURES
      ===================================================== */

      features: {
        type: [String],
        default: []
      },

      /* =====================================================
         DYNAMIC APPLICATIONS
      ===================================================== */

      applications: {
        type: [String],
        default: []
      },

      /* =====================================================
         DOCUMENTS
      ===================================================== */

      documents: {
        type: [productDocumentSchema],
        default: []
      },

      /* =====================================================
         DYNAMIC SPECIFICATIONS
      ===================================================== */

      specifications: {
        type: [specificationSchema],
        default: []
      },

      /* =====================================================
         VARIANTS
      ===================================================== */

      variants: {
        type: [variantSchema],
        default: []
      },

      /* =====================================================
         SEO
      ===================================================== */

      seo: {
        type: seoSchema,
        default: {}
      },

      /* =====================================================
         RELATED PRODUCTS
      ===================================================== */

      relatedProducts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        }
      ],

      /* =====================================================
         FLEXIBLE METADATA
      ===================================================== */

      /*
       * Anything future admin wants to add
       * without changing Mongo schema.
       */
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    {
      timestamps: true,

      toJSON: {
        virtuals: true
      },

      toObject: {
        virtuals: true
      }
    }
  );

/* =========================================================
   VIRTUAL
========================================================= */

productSchema.virtual(
  'availableForSale'
).get(function () {
  return (
    this.isDirectPurchaseAllowed === true &&
    this.archived !== true &&
    this.published !== false &&
    Number(this.stock) > 0
  );
});

/* =========================================================
   INDEXES
========================================================= */

productSchema.index({
  name: 'text',
  sku: 'text',
  category: 'text',
  subcategory: 'text',
  shortDescription: 'text',
  description: 'text'
});

productSchema.index({
  categoryId: 1,
  subcategoryId: 1,
  archived: 1,
  published: 1
});

productSchema.index({
  featured: 1,
  published: 1,
  archived: 1
});

/* =========================================================
   MODEL
========================================================= */

module.exports =
  mongoose.models.Product ||
  mongoose.model(
    'Product',
    productSchema
  );