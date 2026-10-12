const Currency = require('../models/Currency');

const DEFAULT_API_URL = 'https://api.frankfurter.app/latest';

const getApiUrl = () =>
  process.env.EXCHANGE_RATE_API_URL || DEFAULT_API_URL;

const getBaseCurrency = () =>
  String(process.env.BASE_CURRENCY || 'INR')
    .trim()
    .toUpperCase();

/* =========================================================
   FETCH RATES FROM PROVIDER (WITH SMART FALLBACK)
========================================================= */

const fetchExchangeRates = async ({
  baseCurrency = getBaseCurrency(),
  currencies = []
} = {}) => {
  const base = String(baseCurrency).trim().toUpperCase();

  // ---------------------------------------------------------
  // 1. TRY PRIMARY API (Frankfurter)
  // ---------------------------------------------------------
  try {
    const url = new URL(getApiUrl());
    url.searchParams.set('base', base);

    if (Array.isArray(currencies) && currencies.length > 0) {
      url.searchParams.set(
        'symbols',
        currencies.map((item) => String(item).trim().toUpperCase()).join(',')
      );
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data.rates !== 'object') {
      throw new Error('Invalid data format.');
    }

    return {
      base,
      rates: data.rates,
      date: data.date || null
    };

  } catch (primaryError) {
    console.warn(`Primary currency API failed (${primaryError.message}). Switching to fallback...`);

    // ---------------------------------------------------------
    // 2. TRY FALLBACK API (ExchangeRate-API)
    // ---------------------------------------------------------
    const fallbackUrl = `https://open.er-api.com/v6/latest/${base}`;
    const fallbackResponse = await fetch(fallbackUrl);

    if (!fallbackResponse.ok) {
      throw new Error(
        `Fallback exchange rate provider also failed with HTTP ${fallbackResponse.status}.`
      );
    }

    const fallbackData = await fallbackResponse.json();

    if (!fallbackData || typeof fallbackData.rates !== 'object') {
      throw new Error('Fallback provider returned invalid data.');
    }

    return {
      base,
      rates: fallbackData.rates,
      date: fallbackData.time_last_update_utc || null
    };
  }
};

/* =========================================================
   UPDATE ALL ACTIVE CURRENCIES
========================================================= */

const updateCurrencyRates = async () => {
  const baseCurrency = getBaseCurrency();

  const currencies = await Currency.find({
    isActive: true
  }).lean();

  const targetCodes = currencies
    .map((currency) => currency.code)
    .filter((code) => code !== baseCurrency);

  /*
   * Base currency always has rate 1.
   */
  await Currency.updateOne(
    { code: baseCurrency },
    {
      $set: {
        rateFromBase: 1,
        rateSource: 'base-currency',
        rateUpdatedAt: new Date(),
        isBaseCurrency: true
      }
    },
    { upsert: false }
  );

  if (targetCodes.length === 0) {
    return { updated: 0, baseCurrency };
  }

  const result = await fetchExchangeRates({
    baseCurrency,
    currencies: targetCodes
  });

  let updated = 0;

  for (const code of targetCodes) {
    const rate = Number(result.rates?.[code]);

    if (!Number.isFinite(rate) || rate <= 0) {
      console.warn(`No valid exchange rate returned for ${code}.`);
      continue;
    }

    await Currency.updateOne(
      { code },
      {
        $set: {
          rateFromBase: rate,
          rateSource: 'exchange-api',
          rateUpdatedAt: new Date(),
          isBaseCurrency: false
        }
      }
    );

    updated++;
  }

  return {
    updated,
    baseCurrency,
    date: result.date
  };
};

/* =========================================================
   UPDATE ONE CURRENCY
========================================================= */

const updateSingleCurrencyRate = async (currencyCode) => {
  const code = String(currencyCode).trim().toUpperCase();
  const baseCurrency = getBaseCurrency();

  if (code === baseCurrency) {
    await Currency.updateOne(
      { code },
      {
        $set: {
          rateFromBase: 1,
          rateSource: 'base-currency',
          rateUpdatedAt: new Date(),
          isBaseCurrency: true
        }
      }
    );
    return 1;
  }

  const result = await fetchExchangeRates({
    baseCurrency,
    currencies: [code]
  });

  const rate = Number(result.rates?.[code]);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Unable to obtain exchange rate for ${code}.`);
  }

  await Currency.updateOne(
    { code },
    {
      $set: {
        rateFromBase: rate,
        rateSource: 'exchange-api',
        rateUpdatedAt: new Date(),
        isBaseCurrency: false
      }
    }
  );

  return rate;
};

module.exports = {
  fetchExchangeRates,
  updateCurrencyRates,
  updateSingleCurrencyRate,
  getBaseCurrency
};