const mongoose = require('mongoose');

const pricingRuleSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true
      },

      /*
       * Where this rule applies.
       */
      scope: {
        type: String,
        enum: [
          'global',
          'category',
          'subcategory',
          'product'
        ],
        required: true,
        index: true
      },

      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
        index: true
      },

      subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        default: null,
        index: true
      },

      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null,
        index: true
      },

      /*
       * If null, rule applies to every currency.
       */
      currency: {
        type: String,
        default: null,
        uppercase: true,
        trim: true,
        index: true
      },

      /*
       * percentage:
       *
       * +10 = increase by 10%
       * -10 = decrease by 10%
       *
       * fixed:
       *
       * +100 = add 100 currency units
       * -100 = subtract 100
       *
       * multiplier:
       *
       * 1.25 = x1.25
       */
      method: {
        type: String,
        enum: [
          'percentage',
          'fixed',
          'multiplier'
        ],
        required: true
      },

      value: {
        type: Number,
        required: true
      },

      /*
       * Quantity conditions.
       */
      minQuantity: {
        type: Number,
        default: null,
        min: 1
      },

      maxQuantity: {
        type: Number,
        default: null,
        min: 1
      },

      priority: {
        type: Number,
        default: 0,
        index: true
      },

      isActive: {
        type: Boolean,
        default: true,
        index: true
      },

      startsAt: {
        type: Date,
        default: null
      },

      endsAt: {
        type: Date,
        default: null
      }
    },
    {
      timestamps: true
    }
  );

pricingRuleSchema.index({
  scope: 1,
  currency: 1,
  priority: -1
});

module.exports =
  mongoose.models.PricingRule ||
  mongoose.model(
    'PricingRule',
    pricingRuleSchema
  );