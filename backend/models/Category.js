const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },

    description: {
      type: String,
      default: '',
      trim: true
    },

    imageUrl: {
      type: String,
      default: ''
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true
    },

    /*
     * null parent = main category
     * parent category = subcategory
     */

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    sortOrder: {
      type: Number,
      default: 0
    },
    storeType: {
      type: String,
      enum: ['B2B', 'B2C'],
      default: 'B2B',
      index: true
    },

    /*
     * Admin can define default specification
     * fields for products in this category.
     *
     * Example:
     *
     * [
     *   {
     *     name: "Material",
     *     type: "text",
     *     required: true
     *   },
     *   {
     *     name: "Maximum Temperature",
     *     type: "text",
     *     required: false
     *   }
     * ]
     */
    specificationFields: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },

        type: {
          type: String,
          enum: [
            'text',
            'number',
            'select',
            'boolean'
          ],
          default: 'text'
        },

        options: {
          type: [String],
          default: []
        },

        required: {
          type: Boolean,
          default: false
        },

        unit: {
          type: String,
          default: '',
          trim: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

categorySchema.index({
  parent: 1,
  name: 1
});

module.exports =
  mongoose.models.Category ||
  mongoose.model(
    'Category',
    categorySchema
  );