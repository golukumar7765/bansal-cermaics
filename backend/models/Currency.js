const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    symbol: {
      type: String,
      default: ''
    },

    rateFromBase: {
      type: Number,
      required: true,
      min: 0
    },

    decimalPlaces: {
      type: Number,
      default: 2,
      min: 0,
      max: 6
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    isBase: {
      type: Boolean,
      default: false
    },

    lastRateUpdatedAt: {
      type: Date,
      default: null
    },

    rateSource: {
      type: String,
      default: 'manual'
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Currency ||
  mongoose.model('Currency', currencySchema);