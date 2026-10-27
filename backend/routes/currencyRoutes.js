const express =
  require('express');

const Currency =
  require('../models/Currency');

const Product =
  require('../models/Product');

const protect =
  require('../middleware/authMiddleware');

const { computeCurrencyPrices } =
  require('../utils/pricing');

const { updateCurrencyRates } =
  require('../services/exchangeRateService');

const router =
  express.Router();

/*
 * Frankfurter provides ECB-based
 * exchange rates and does not require
 * an API key.
 */

const FX_BASE =
  'https://api.frankfurter.app';

const DEFAULT_CURRENCIES = [
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimalPlaces: 2
  },

  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2
  },

  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2
  },

  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimalPlaces: 2
  }
];
const SUPPORTED_CURRENCY_CODES = DEFAULT_CURRENCIES.map((currency) => currency.code);

const ensureDefaultCurrencies =
  async () => {
    for (
      const currency of
        DEFAULT_CURRENCIES
    ) {
      await Currency.updateOne(
        {
          code:
            currency.code
        },

        {
          $setOnInsert: {
            code:
              currency.code,

            name:
              currency.name,

            symbol:
              currency.symbol,

            decimalPlaces:
              currency.decimalPlaces,

            rateFromBase:
              currency.code ===
              'INR'
                ? 1
                : 0,

            isActive:
              true,

            isBase:
              currency.code ===
              'INR',

            rateSource:
              currency.code ===
              'INR'
                ? 'base'
                : 'pending'
          }
        },

        {
          upsert: true
        }
      );
    }
  };

/*
 * =========================================================
 * GET /api/currencies
 * =========================================================
 */

router.get(
  '/',
  async (
    req,
    res
  ) => {
    try {
      await ensureDefaultCurrencies();

      const currencies =
        await Currency.find({
          isActive: true,
          code: { $in: SUPPORTED_CURRENCY_CODES }
        })
          .sort({
            isBase: -1,
            code: 1
          })
          .lean();

      return res.json({
        success: true,
        currencies,
        data: currencies
      });
    } catch (error) {
      console.error(
        'Get currencies error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to load currencies.'
      });
    }
  }
);

/*
 * =========================================================
 * POST /api/currencies
 * =========================================================
 *
 * Admin can create a custom currency.
 */

router.post(
  '/',
  protect,
  async (
    req,
    res
  ) => {
    try {
      const {
        code,
        name,
        symbol = '',
        decimalPlaces = 2,
        rateFromBase = 0
      } = req.body;

      const normalizedCode =
        String(
          code || ''
        )
          .trim()
          .toUpperCase();

      if (
        !normalizedCode
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Currency code is required.'
        });
      }

      if (!SUPPORTED_CURRENCY_CODES.includes(normalizedCode)) {
        return res.status(400).json({ success: false, message: 'Only INR, USD, EUR and GBP are supported.' });
      }

      if (
        normalizedCode.length !==
        3
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Currency code must contain 3 characters.'
        });
      }

      if (
        !String(
          name || ''
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Currency name is required.'
        });
      }

      const rate =
        Number(
          rateFromBase
        );

      if (
        normalizedCode !==
          'INR' &&
        (
          !Number.isFinite(rate) ||
          rate <= 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'A valid FX rate is required.'
        });
      }

      const currency =
        await Currency.findOneAndUpdate(
          {
            code:
              normalizedCode
          },

          {
            $set: {
              name:
                String(
                  name
                ).trim(),

              symbol:
                String(
                  symbol
                ),

              decimalPlaces:
                Math.max(
                  0,
                  Math.min(
                    6,
                    Number(
                      decimalPlaces
                    ) || 2
                  )
                ),

              rateFromBase:
                normalizedCode ===
                'INR'
                  ? 1
                  : rate,

              isActive:
                true
            },

            $setOnInsert: {
              isBase:
                normalizedCode ===
                'INR',

              rateSource:
                'manual'
            }
          },

          {
            upsert: true,
            new: true
          }
        );

      return res.status(201).json({
        success: true,
        currency
      });
    } catch (error) {
      console.error(
        'Create currency error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to create currency.'
      });
    }
  }
);

/*
 * =========================================================
 * PUT /api/currencies/:code
 * =========================================================
 */

router.put(
  '/:code',
  protect,
  async (
    req,
    res
  ) => {
    try {
      const code =
        String(
          req.params.code
        )
          .trim()
          .toUpperCase();

      if (!SUPPORTED_CURRENCY_CODES.includes(code)) {
        return res.status(400).json({ success: false, message: 'Only INR, USD, EUR and GBP are supported.' });
      }

      const {
        name,
        symbol,
        decimalPlaces,
        rateFromBase,
        isActive
      } = req.body;

      const update = {};

      if (
        name !==
        undefined
      ) {
        update.name =
          String(
            name
          ).trim();
      }

      if (
        symbol !==
        undefined
      ) {
        update.symbol =
          String(
            symbol
          );
      }

      if (
        decimalPlaces !==
        undefined
      ) {
        update.decimalPlaces =
          Math.max(
            0,
            Math.min(
              6,
              Number(
                decimalPlaces
              ) || 2
            )
          );
      }

      if (
        rateFromBase !==
        undefined
      ) {
        const rate =
          Number(
            rateFromBase
          );

        if (
          code !==
            'INR' &&
          (
            !Number.isFinite(
              rate
            ) ||
            rate <= 0
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid FX rate.'
          });
        }

        update.rateFromBase =
          code ===
          'INR'
            ? 1
            : rate;

        update.rateSource =
          'manual';

        update.lastRateUpdatedAt =
          new Date();
      }

      if (
        isActive !==
        undefined
      ) {
        update.isActive =
          Boolean(
            isActive
          );
      }

      if (
        code ===
        'INR'
      ) {
        update.rateFromBase =
          1;

        update.isBase =
          true;
      }

      const currency =
        await Currency.findOneAndUpdate(
          {
            code
          },

          {
            $set:
              update
          },

          {
            new: true
          }
        );

      if (!currency) {
        return res.status(404).json({
          success: false,
          message:
            'Currency not found.'
        });
      }

      return res.json({
        success: true,
        currency
      });
    } catch (error) {
      console.error(
        'Update currency error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to update currency.'
      });
    }
  }
);

/*
 * =========================================================
 * POST /api/currencies/sync-rates
 * =========================================================
 *
 * Base currency = INR.
 *
 * Frankfurter uses EUR as its
 * reference currency, therefore:
 *
 * INR → EUR
 * EUR → requested currency
 *
 * is combined to get:
 *
 * INR → requested currency
 */

router.post(
  '/sync-rates',
  protect,
  async (req, res) => {
    try {
      await ensureDefaultCurrencies();

      const result =
        await updateCurrencyRates();

      const refreshed =
        await Currency.find({
          isActive: true,
          code: { $in: SUPPORTED_CURRENCY_CODES }
        })
          .sort({
            isBase: -1,
            code: 1
          })
          .lean();

      return res.json({
        success: true,
        message: 'FX rates refreshed successfully.',
        updated: result.updated,
        baseCurrency: result.baseCurrency,
        currencies: refreshed,
        data: refreshed
      });
    } catch (error) {
      console.error(
        'Sync FX rates error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Unable to refresh FX rates.'
      });
    }
  }
);


/*
 * =========================================================
 * RESYNC ALL PRODUCT PRICES
 * =========================================================
 * Recomputes prices[] for every product from its
 * currencyPricing config + the latest Currency.rateFromBase.
 * Call this after /sync-rates (or on demand) so all
 * auto/multiplier-mode products pick up new FX rates.
 * Override-mode prices are left untouched by design.
 */

router.post(
  '/resync-product-prices',
  protect,
  async (req, res) => {
    try {
      const activeCurrencies =
        await Currency.find({
          isActive: true,
          code: { $in: SUPPORTED_CURRENCY_CODES }
        }).lean();

      const products =
        await Product.find({}).select(
          'price baseCurrency currencyPricing prices name'
        );

      let updated = 0;

      for (const product of products) {
        const newPrices =
          computeCurrencyPrices(
            product,
            activeCurrencies
          );

        const changed =
          JSON.stringify(newPrices) !==
          JSON.stringify(
            product.prices || []
          );

        if (changed) {
          product.prices = newPrices;
          await product.save();
          updated += 1;
        }
      }

      return res.json({
        success: true,
        totalProducts: products.length,
        updated
      });
    } catch (error) {
      console.error(
        'Resync product prices error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to resync product prices.'
      });
    }
  }
);

module.exports =
  router;
