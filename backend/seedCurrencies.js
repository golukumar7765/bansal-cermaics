const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// IMPORTANT:
// Always load the .env file from the backend directory,
// regardless of where this script is executed from.
dotenv.config({
  path: path.join(__dirname, '.env')
});

const Currency = require('./models/Currency');

const currencies = [
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimalPlaces: 2,
    rateFromBase: 1,
    isActive: true
  },

  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    rateFromBase: 0.011,
    isActive: true
  },

  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2,
    rateFromBase: 0.0095,
    isActive: true
  },

  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimalPlaces: 2,
    rateFromBase: 0.0082,
    isActive: true
  },

  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    decimalPlaces: 2,
    rateFromBase: 0.040,
    isActive: true
  },

  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimalPlaces: 0,
    rateFromBase: 1.61,
    isActive: true
  }
];

const seedCurrencies = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        'MONGO_URI is not defined in backend/.env file.'
      );
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(mongoUri);

    console.log('MongoDB Connected.');

    for (const currency of currencies) {
      await Currency.findOneAndUpdate(
        {
          code: currency.code
        },
        {
          $set: {
            name: currency.name,
            symbol: currency.symbol,
            decimalPlaces: currency.decimalPlaces,
            rateFromBase: currency.rateFromBase,
            isActive: currency.isActive
          }
        },
        {
          upsert: true,
          returnDocument: 'after'
        }
      );

      console.log(
        `✓ ${currency.code} configured`
      );
    }

    console.log('');
    console.log(
      `✓ Currency seed completed successfully. ${currencies.length} currencies configured.`
    );

    await mongoose.disconnect();

    console.log('MongoDB connection closed.');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('Currency seed error:', error);

    try {
      await mongoose.disconnect();
    } catch (_) {}

    process.exit(1);
  }
};

seedCurrencies();