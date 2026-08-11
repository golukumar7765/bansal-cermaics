/**
 * -----------------------------------------------------------------------
 * SHARED CURRENCY PRICING RESOLVER
 * -----------------------------------------------------------------------
 *
 * Formula:
 *   auto        => basePrice * currency.rateFromBase
 *   multiplier  => basePrice * currency.rateFromBase * config.multiplier
 *   override    => config.overridePrice   (exact, ignores FX rate)
 */

const roundToDecimals = (value, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

function computeCurrencyPrices(product, currencies) {
  const basePrice = Number(product.price) || 0;
  const baseCurrency = String(product.baseCurrency || 'INR').toUpperCase();

  const currencyPricing =
    product.currencyPricing instanceof Map
      ? Object.fromEntries(product.currencyPricing)
      : product.currencyPricing || {};

  const result = [];

  for (const currency of currencies) {
    if (!currency || currency.isActive === false) continue;

    const code = String(currency.code).toUpperCase();
    const decimals = Number.isFinite(currency.decimalPlaces)
      ? currency.decimalPlaces
      : 2;

    if (code === baseCurrency) {
      result.push({
        currency: code,
        price: roundToDecimals(basePrice, decimals),
        enabled: true,
        source: 'base'
      });
      continue;
    }

    let config = currencyPricing[code];
    if (config && typeof config.toObject === 'function') {
      config = config.toObject();
    }

    if (!config || config.enabled === false) continue;

    const rate = Number(currency.rateFromBase);
    const mode = config.mode || 'auto';

    let finalPrice = null;

    if (mode === 'override') {
      const override = Number(config.overridePrice);
      if (Number.isFinite(override) && override >= 0) {
        finalPrice = override;
      }
    } else if (mode === 'multiplier') {
      const multiplier = Number.isFinite(Number(config.multiplier))
        ? Number(config.multiplier)
        : 1;
      if (Number.isFinite(rate) && rate > 0) {
        finalPrice = basePrice * rate * multiplier;
      }
    } else {
      if (Number.isFinite(rate) && rate > 0) {
        finalPrice = basePrice * rate;
      }
    }

    if (finalPrice === null || !Number.isFinite(finalPrice)) continue;

    result.push({
      currency: code,
      price: roundToDecimals(finalPrice, decimals),
      enabled: true,
      source: mode
    });
  }

  return result;
}

function resolveUnitPrice(product, currencyCode) {
  const code = String(currencyCode || product.baseCurrency || 'INR').toUpperCase();
  const baseCurrency = String(product.baseCurrency || 'INR').toUpperCase();

  if (code === baseCurrency) {
    const price = Number(product.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`"${product.name}" has no valid base price.`);
    }
    return { amount: price, currency: code };
  }

  const match = (product.prices || []).find(
    (p) => String(p.currency).toUpperCase() === code && p.enabled !== false
  );

  if (!match || !Number.isFinite(Number(match.price))) {
    throw new Error(
      `"${product.name}" is not available for purchase in ${code}.`
    );
  }

  return { amount: Number(match.price), currency: code };
}

module.exports = {
  computeCurrencyPrices,
  resolveUnitPrice,
  roundToDecimals
};