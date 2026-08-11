const Currency =
  require('../models/Currency');

const PricingRule =
  require('../models/PricingRule');

const roundMoney = (
  value,
  decimals = 2
) => {
  const factor =
    Math.pow(10, decimals);

  return (
    Math.round(
      (Number(value) + Number.EPSILON) *
        factor
    ) / factor
  );
};

const getCurrency =
  async (currencyCode) => {
    const code =
      String(
        currencyCode || 'INR'
      )
        .trim()
        .toUpperCase();

    return Currency.findOne({
      code,
      isActive: true
    }).lean();
  };

const applyRule = (
  price,
  rule
) => {
  let result =
    Number(price);

  if (
    rule.method ===
    'percentage'
  ) {
    result =
      result +
      (
        result *
        Number(rule.value)
      ) /
        100;
  }

  if (
    rule.method ===
    'fixed'
  ) {
    result =
      result +
      Number(rule.value);
  }

  if (
    rule.method ===
    'multiplier'
  ) {
    result =
      result *
      Number(rule.value);
  }

  return result;
};

const getProductCurrencyConfig =
  (product, currency) => {
    const requested =
      String(currency || '')
        .trim()
        .toUpperCase();

    /*
     * Current schema: product.currencyPricing is a Map/object keyed by
     * currency code. This is what AdminPage sends and what Product.js stores.
     */
    let topLevel =
      product?.currencyPricing;

    if (topLevel instanceof Map) {
      topLevel = Object.fromEntries(
        topLevel.entries()
      );
    }

    if (topLevel && typeof topLevel === 'object') {
      const direct =
        topLevel[requested];

      if (direct) {
        return {
          ...direct,
          currency: requested,
          overridePrice:
            direct.overridePrice ??
            direct.price ??
            null
        };
      }
    }

    /*
     * Backward-compatible schema: pricing.currencyPricing as an array.
     */
    const nested =
      product?.pricing
        ?.currencyPricing;

    if (Array.isArray(nested)) {
      return (
        nested.find(
          (item) =>
            String(item?.currency || '')
              .trim()
              .toUpperCase() ===
            requested
        ) || null
      );
    }

    return null;
  };

const getProductPrice =
  async ({
    product,
    currency = 'INR',
    quantity = 1
  }) => {
    const requestedCurrency =
      String(currency)
        .trim()
        .toUpperCase();

    const qty =
      Math.max(
        1,
        Number(quantity) || 1
      );

    const baseCurrency =
      String(
        product.baseCurrency ||
          'INR'
      )
        .trim()
        .toUpperCase();

    const basePrice =
      Number(product.price) || 0;

    /*
     * ======================================================
     * BASE CURRENCY
     * ======================================================
     */

    if (
      requestedCurrency ===
      baseCurrency
    ) {
      const config =
        getProductCurrencyConfig(
          product,
          requestedCurrency
        );

      /*
       * Base currency override.
       */
      if (
        config &&
        config.enabled !== false &&
        config.mode ===
          'override' &&
        Number.isFinite(
          Number(
            config.overridePrice
          )
        )
      ) {
        return {
          currency:
            requestedCurrency,

          amount:
            roundMoney(
              config.overridePrice
            ),

          baseAmount:
            basePrice,

          rateFromBase: 1,

          source:
            'base-currency-override'
        };
      }

      /*
       * Base currency multiplier.
       *
       * FX = 1 for base currency.
       */
      if (
        config &&
        config.enabled !== false &&
        config.mode ===
          'multiplier'
      ) {
        return {
          currency:
            requestedCurrency,

          amount:
            roundMoney(
              basePrice *
                (
                  Number(
                    config.multiplier
                  ) || 1
                )
            ),

          baseAmount:
            basePrice,

          rateFromBase: 1,

          source:
            'base-currency-multiplier'
        };
      }

      return {
        currency:
          requestedCurrency,

        amount:
          roundMoney(
            basePrice
          ),

        baseAmount:
          basePrice,

        rateFromBase: 1,

        source:
          'base-price'
      };
    }

    /*
     * ======================================================
     * LEGACY CURRENCY OVERRIDE
     * ======================================================
     */

    if (
      product.currencyPrices &&
      typeof product.currencyPrices.get ===
        'function'
    ) {
      const directPrice =
        product.currencyPrices.get(
          requestedCurrency
        );

      if (
        directPrice !==
          undefined &&
        directPrice !== null &&
        Number.isFinite(
          Number(directPrice)
        )
      ) {
        return {
          currency:
            requestedCurrency,

          amount:
            roundMoney(
              directPrice
            ),

          baseAmount:
            basePrice,

          source:
            'product-currency-price'
        };
      }
    }

    /*
     * ======================================================
     * QUANTITY PRICING
     * ======================================================
     */

    if (
      product.pricing
        ?.allowQuantityPricing &&
      Array.isArray(
        product.pricing
          ?.quantityTiers
      )
    ) {
      const tier =
        product.pricing.quantityTiers.find(
          (item) => {
            const min =
              Number(
                item.minQuantity
              ) || 1;

            const max =
              item.maxQuantity ===
                null ||
              item.maxQuantity ===
                undefined
                ? Infinity
                : Number(
                    item.maxQuantity
                  );

            return (
              qty >= min &&
              qty <= max &&
              String(
                item.currency ||
                  baseCurrency
              )
                .trim()
                .toUpperCase() ===
                requestedCurrency
            );
          }
        );

      if (tier) {
        return {
          currency:
            requestedCurrency,

          amount:
            roundMoney(
              Number(
                tier.price
              ) || 0
            ),

          baseAmount:
            basePrice,

          source:
            'quantity-tier'
        };
      }
    }

    /*
     * ======================================================
     * CURRENCY CONFIG
     * ======================================================
     */

    const currencyConfig =
      await getCurrency(
        requestedCurrency
      );

    if (!currencyConfig) {
      throw new Error(
        `Currency ${requestedCurrency} is not configured.`
      );
    }

    const rate =
      Number(
        currencyConfig.rateFromBase
      );

    if (
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      throw new Error(
        `Invalid FX rate configured for ${requestedCurrency}.`
      );
    }

    /*
     * ======================================================
     * PRODUCT CURRENCY STRATEGY
     * ======================================================
     */

    const config =
      getProductCurrencyConfig(
        product,
        requestedCurrency
      );

    let finalPrice =
      basePrice * rate;

    let source =
      'currency-conversion';

    if (
      config &&
      config.enabled !== false
    ) {
      /*
       * AUTO
       *
       * Base Price × FX Rate
       */
      if (
        config.mode ===
        'auto'
      ) {
        finalPrice =
          basePrice * rate;

        source =
          'auto-fx';
      }

      /*
       * MULTIPLIER
       *
       * Base Price × FX Rate × multiplier
       */
      else if (
        config.mode ===
        'multiplier'
      ) {
        const multiplier =
          Number(
            config.multiplier
          );

        finalPrice =
          basePrice *
          rate *
          (
            Number.isFinite(
              multiplier
            )
              ? multiplier
              : 1
          );

        source =
          'fx-multiplier';
      }

      /*
       * EXACT OVERRIDE
       */
      else if (
        config.mode ===
        'override'
      ) {
        const override =
          Number(
            config.overridePrice
          );

        if (
          Number.isFinite(
            override
          ) &&
          override >= 0
        ) {
          finalPrice =
            override;

          source =
            'exact-override';
        }
      }
    }

    /*
     * ======================================================
     * GLOBAL / CATEGORY / PRODUCT RULES
     * ======================================================
     */

    const rules =
      await PricingRule.find({
        isActive: true,

        $or: [
          {
            scope: 'global'
          },

          {
            scope: 'category',
            category:
              product.categoryId
          },

          {
            scope: 'subcategory',
            category:
              product.subcategoryId
          },

          {
            scope: 'product',
            product:
              product._id
          }
        ],

        $and: [
          {
            $or: [
              {
                currency:
                  requestedCurrency
              },

              {
                currency:
                  null
              }
            ]
          },

          {
            $or: [
              {
                minQuantity: {
                  $lte: qty
                }
              },

              {
                minQuantity:
                  null
              }
            ]
          }
        ]
      })
        .sort({
          priority: -1
        })
        .lean();

    for (
      const rule of rules
    ) {
      if (
        rule.startsAt &&
        new Date() <
          new Date(
            rule.startsAt
          )
      ) {
        continue;
      }

      if (
        rule.endsAt &&
        new Date() >
          new Date(
            rule.endsAt
          )
      ) {
        continue;
      }

      if (
        rule.maxQuantity !==
          null &&
        rule.maxQuantity !==
          undefined &&
        qty >
          Number(
            rule.maxQuantity
          )
      ) {
        continue;
      }

      finalPrice =
        applyRule(
          finalPrice,
          rule
        );
    }

    return {
      currency:
        requestedCurrency,

      amount:
        roundMoney(
          finalPrice,
          currencyConfig.decimalPlaces
        ),

      baseAmount:
        basePrice,

      rateFromBase:
        rate,

      source
    };
  };

const getProductPricing =
  async ({
    product,
    currencies = []
  }) => {
    let requestedCurrencies =
      currencies;

    if (
      !Array.isArray(
        requestedCurrencies
      ) ||
      requestedCurrencies.length ===
        0
    ) {
      const active =
        await Currency.find({
          isActive: true
        })
          .sort({
            code: 1
          })
          .lean();

      requestedCurrencies =
        active.map(
          (item) =>
            item.code
        );
    }

    const result = {};

    for (
      const currency of
        requestedCurrencies
    ) {
      const code =
        String(currency)
          .trim()
          .toUpperCase();

      result[code] =
        await getProductPrice({
          product,
          currency: code
        });
    }

    return result;
  };

module.exports = {
  roundMoney,
  getCurrency,
  getProductPrice,
  getProductPricing
};