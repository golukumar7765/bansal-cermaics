import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  RefreshCw
} from 'lucide-react';

import api from '../lib/api';

const readCart = () => {
  try {
    return JSON.parse(
      localStorage.getItem('cart') || '[]'
    );
  } catch {
    return [];
  }
};

const normalizeCurrencyList = (payload) => {
  const list =
    Array.isArray(payload)
      ? payload
      : payload?.currencies ||
        payload?.data ||
        [];

  return Array.isArray(list)
    ? list.filter(
        (currency) =>
          currency &&
          currency.code &&
          currency.isActive !== false
      )
    : [];
};

const CartPage = () => {
  const navigate = useNavigate();

  const [cart, setCart] =
    useState(readCart);

  const [selectedCurrency, setSelectedCurrency] =
    useState(
      localStorage.getItem('selectedCurrency') || 'INR'
    );

  const [currencies, setCurrencies] =
    useState([]);

  const [refreshing, setRefreshing] =
    useState(true);

  const [error, setError] =
    useState('');

  const selectedCurrencyConfig =
    currencies.find(
      (currency) =>
        String(currency.code).toUpperCase() ===
        String(selectedCurrency).toUpperCase()
    );

  const currencySymbol =
    selectedCurrencyConfig?.symbol ||
    (selectedCurrency === 'INR'
      ? '₹'
      : selectedCurrency);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits:
          Number(
            selectedCurrencyConfig?.decimalPlaces
          ) || 2
      }
    );

  const saveCart = (items) => {
    setCart(items);

    localStorage.setItem(
      'cart',
      JSON.stringify(items)
    );

    window.dispatchEvent(
      new Event('cartUpdated')
    );
  };

  /*
   * IMPORTANT:
   *
   * Product pricing is resolved by the backend:
   *
   *   GET /products?currency=USD
   *
   * The backend returns displayPrice/displayCurrency
   * from the authoritative pricingService.
   *
   * The cart NEVER calculates FX itself and NEVER
   * trusts an old saved price.
   */
  const refreshCart = async (
    currencyCode = selectedCurrency
  ) => {
    const existingCart =
      readCart();

    if (!existingCart.length) {
      setCart([]);
      setRefreshing(false);
      return;
    }

    setRefreshing(true);

    try {
      setError('');

      const response =
        await api.get(
          `/products?currency=${encodeURIComponent(
            String(currencyCode || 'INR').toUpperCase()
          )}`
        );

      const products =
        Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

      const productMap =
        new Map(
          products.map(
            (product) => [
              String(product._id),
              product
            ]
          )
        );

      const updatedCart = [];

      for (
        const oldItem of existingCart
      ) {
        const current =
          productMap.get(
            String(oldItem._id)
          );

        if (!current) {
          continue;
        }

        const moq =
          Number(current.moq) || 1;

        const stock =
          Number(current.stock) || 0;

        let quantity =
          Number(oldItem.quantity) || moq;

        if (stock <= 0) {
          continue;
        }

        quantity =
          Math.max(
            moq,
            quantity
          );

        quantity =
          Math.min(
            quantity,
            stock
          );

        /*
         * Keep the fresh product returned by
         * the server. This includes:
         *
         * displayPrice
         * displayCurrency
         * pricingSource
         *
         * so the cart always shows the selected
         * currency's authoritative price.
         */
        const variantId = String(oldItem.variantId || '');
        const selectedVariant = variantId
          ? (current.variants || []).find((variant) => String(variant._id || '') === variantId && variant.isActive !== false)
          : null;
        const productDisplayPrice = Number(current.displayPrice ?? current.price) || 0;
        const productBasePrice = Number(current.price) || 0;
        const variantBasePrice = Number(selectedVariant?.price);
        const displayPrice = selectedVariant && Number.isFinite(variantBasePrice) && productBasePrice > 0
          ? productDisplayPrice * (variantBasePrice / productBasePrice)
          : productDisplayPrice;

        updatedCart.push({
          ...current,
          variantId,
          selectedVariant,
          displayedUnitPrice: displayPrice,
          displayPrice,
          quantity
        });
      }

      saveCart(updatedCart);
    } catch (err) {
      console.error(
        'Cart refresh error:',
        err
      );

      setError(
        'Unable to refresh your cart. Please try again.'
      );
    } finally {
      setRefreshing(false);
    }
  };

  /*
   * Load active currencies.
   */
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response =
          await api.get('/currencies');

        const active =
          normalizeCurrencyList(
            response.data
          );

        setCurrencies(active);
      } catch (err) {
        console.warn(
          'Currency loading failed:',
          err?.response?.data ||
            err?.message
        );
      }
    };

    fetchCurrencies();
  }, []);

  /*
   * Currency changes come from Navbar,
   * Checkout, or another component.
   */
  useEffect(() => {
    const handleCurrencyChange = () => {
      const next =
        String(
          localStorage.getItem(
            'selectedCurrency'
          ) || 'INR'
        ).toUpperCase();

      setSelectedCurrency(next);

      refreshCart(next);
    };

    window.addEventListener(
      'currencyChanged',
      handleCurrencyChange
    );

    window.addEventListener(
      'storage',
      handleCurrencyChange
    );

    return () => {
      window.removeEventListener(
        'currencyChanged',
        handleCurrencyChange
      );

      window.removeEventListener(
        'storage',
        handleCurrencyChange
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Initial cart refresh in the selected currency.
   */
  useEffect(() => {
    refreshCart(
      selectedCurrency
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total =
    useMemo(
      () =>
        cart.reduce(
          (sum, item) =>
            sum +
            (
              Number(
                item.displayedUnitPrice ??
                  item.displayPrice ??
                  item.price ??
                  0
              ) || 0
            ) *
              Number(
                item.quantity || 0
              ),
          0
        ),
      [cart]
    );

  const setQuantity = (
    id,
    quantity
  ) => {
    const item =
      cart.find(
        (product) =>
          String(product._id) ===
          String(id)
      );

    if (!item) return;

    const moq =
      Number(item.moq) || 1;

    const stock =
      Number(item.stock) || 0;

    let nextQuantity =
      Number(quantity);

    if (
      !Number.isFinite(
        nextQuantity
      )
    ) {
      nextQuantity = moq;
    }

    nextQuantity =
      Math.max(
        moq,
        nextQuantity
      );

    nextQuantity =
      Math.min(
        stock,
        nextQuantity
      );

    saveCart(
      cart.map(
        (product) =>
          String(product._id) ===
          String(id)
            ? {
                ...product,
                quantity:
                  nextQuantity
              }
            : product
      )
    );
  };

  const removeItem = (id) => {
    saveCart(
      cart.filter(
        (item) =>
          String(item._id) !==
          String(id)
      )
    );
  };

  if (refreshing) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw
            size={20}
            className="animate-spin"
          />
          Refreshing inventory and prices...
        </div>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-center">
        <ShoppingCart
          className="mx-auto text-slate-400"
          size={52}
        />

        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
          Your cart is empty
        </h1>

        <p className="mt-2 text-slate-500">
          Products may have become unavailable or
          your cart is empty.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl"
        >
          Browse Products
          <ArrowRight size={17} />
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider font-bold text-blue-600">
            Bansal Scientific
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            Your Cart
          </h1>

          <p className="mt-2 text-slate-500">
            Review your products before checkout.
          </p>

          <p className="mt-2 text-xs font-semibold text-slate-400">
            Prices shown in{' '}
            <span className="text-slate-700">
              {selectedCurrency}
            </span>{' '}
            and resolved automatically from the
            configured FX/pricing strategy.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => {
              const stock =
                Number(item.stock) || 0;

              const moq =
                Number(item.moq) || 1;

              const unitPrice =
                Number(
                  item.displayPrice ??
                    item.price ??
                    0
                ) || 0;

              return (
                <article
                  key={item._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item._id}`}
                      className="font-bold text-slate-900 hover:text-blue-600"
                    >
                      {item.name}
                    </Link>

                    <p className="text-xs text-slate-500 mt-1">
                      SKU: {item.sku || 'N/A'}
                    </p>

                    <p className="text-sm text-slate-600 mt-2">
                      {currencySymbol}
                      {formatMoney(unitPrice)} each
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      MOQ: {moq} · Available: {stock}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">
                      <button
                        aria-label="Decrease quantity"
                        className="p-2.5 hover:bg-slate-100"
                        onClick={() =>
                          setQuantity(
                            item._id,
                            Number(
                              item.quantity
                            ) - 1
                          )
                        }
                      >
                        <Minus size={15} />
                      </button>

                      <span className="min-w-10 text-center text-sm font-bold">
                        {item.quantity}
                      </span>

                      <button
                        aria-label="Increase quantity"
                        disabled={
                          Number(
                            item.quantity
                          ) >= stock
                        }
                        className="p-2.5 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() =>
                          setQuantity(
                            item._id,
                            Number(
                              item.quantity
                            ) + 1
                          )
                        }
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <button
                      aria-label="Remove item"
                      className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl"
                      onClick={() =>
                        removeItem(
                          item._id
                        )
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-xl font-extrabold text-slate-900">
              Order Summary
            </h2>

            <div className="mt-5 flex justify-between text-sm">
              <span className="text-slate-500">
                Products
              </span>

              <span className="font-semibold">
                {cart.length}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-slate-500">
                Subtotal
              </span>

              <span className="font-semibold">
                {currencySymbol}
                {formatMoney(total)}
              </span>
            </div>

            <div className="border-t border-slate-200 my-5" />

            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">
                Estimated Total
              </span>

              <span className="text-2xl font-extrabold text-blue-600">
                {currencySymbol}
                {formatMoney(total)}
              </span>
            </div>

            <button
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
              onClick={() =>
                navigate('/checkout')
              }
            >
              Proceed to Checkout
              <ArrowRight size={17} />
            </button>

            <Link
              to="/"
              className="mt-3 block text-center text-sm font-semibold text-slate-500 hover:text-blue-600"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
