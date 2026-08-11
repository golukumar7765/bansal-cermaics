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
      lowercase: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      default: '',
      trim: true
    },

    imageUrl: {
      type: String,
      default: '',
      trim: true
    },

    icon: {
      type: String,
      default: '',
      trim: true
    },

    sortOrder: {
      type: Number,
      default: 0,
      index: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    /*
     * Allows admin to hide category from customer-facing
     * navigation without deleting it.
     */
    showInMenu: {
      type: Boolean,
      default: true
    },

    /*
     * Optional SEO information.
     */
    seo: {
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
      }
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

categorySchema.index({
  name: 1
});

categorySchema.index({
  isActive: 1,
  sortOrder: 1
});

module.exports =
  mongoose.models.Category ||
  mongoose.model(
    'Category',
    categorySchema
  );