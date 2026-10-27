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
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';

import api, {
  getApiError
} from '../lib/api';

const readCart = () => {
  try {
    return JSON.parse(
      localStorage.getItem('cart') || '[]'
    );
  } catch {
    return [];
  }
};

const emptyAddress = {
  fullName: '',
  company: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India'
};

const CheckoutPage = () => {
  const navigate =
    useNavigate();

  const [cart, setCart] =
    useState(readCart);

  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem('selectedCurrency') || 'INR'
  );

  const [availableCurrencies, setAvailableCurrencies] = useState([
    { code: 'INR', name: 'Indian Rupee', symbol: '\u20b9' }
  ]);

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  // =========================================================
  // CURRENCY (same source of truth as Navbar/HomePage/ProductDetailPage)
  // =========================================================

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await api.get('/currencies');
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.currencies ||
            res.data?.data ||
            [];

        const active = list.filter((c) => c.isActive !== false);

        if (active.length > 0) {
          setAvailableCurrencies(active);
        }
      } catch (error) {
        console.warn(
          'Currency API unavailable, defaulting to INR only:',
          error?.response?.data || error?.message
        );
      }
    };

    fetchCurrencies();

    const updateCurrency = () => {
      setSelectedCurrency(
        localStorage.getItem('selectedCurrency') || 'INR'
      );
    };

    window.addEventListener('currencyChanged', updateCurrency);
    window.addEventListener('storage', updateCurrency);

    return () => {
      window.removeEventListener('currencyChanged', updateCurrency);
      window.removeEventListener('storage', updateCurrency);
    };
  }, []);

  const handleCurrencyChange = (code) => {
    localStorage.setItem('selectedCurrency', code);
    setSelectedCurrency(code);
    setIsCurrencyOpen(false);
    window.dispatchEvent(new Event('currencyChanged'));
  };

  const [customer, setCustomer] =
    useState({
      name: '',
      email: '',
      phone: '',
      company: '',
      gstin: ''
    });

  const [shippingAddress, setShippingAddress] =
    useState(emptyAddress);

  const [billingAddress, setBillingAddress] =
    useState(emptyAddress);

  const [sameBilling, setSameBilling] =
    useState(true);

  const [customerNote, setCustomerNote] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
   * Refresh cart against DB.
   */
  useEffect(() => {
    const refresh = async () => {
      const oldCart =
        readCart();

      if (!oldCart.length) {
        navigate('/cart', {
          replace: true
        });
        return;
      }

      try {
        const response =
          await api.get(
            `/products?currency=${encodeURIComponent(
              String(selectedCurrency || 'INR').toUpperCase()
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
                product._id,
                product
              ]
            )
          );

        const freshCart = [];

        for (
          const item of oldCart
        ) {
          const product =
            productMap.get(
              item._id
            );

          if (!product) {
            continue;
          }

          const stock =
            Number(product.stock) || 0;

          const moq =
            Number(product.moq) || 1;

          if (stock < moq) {
            continue;
          }

          let quantity =
            Number(
              item.quantity
            ) || moq;

          quantity =
            Math.max(
              moq,
              quantity
            );

          quantity =
            Math.min(
              stock,
              quantity
            );

          freshCart.push({
            ...product,
            quantity
          });
        }

        if (!freshCart.length) {
          localStorage.removeItem(
            'cart'
          );

          setCart([]);

          navigate('/cart', {
            replace: true
          });

          return;
        }

        setCart(freshCart);

        localStorage.setItem(
          'cart',
          JSON.stringify(
            freshCart
          )
        );
      } catch (err) {
        console.error(
          'Checkout cart refresh:',
          err
        );

        setError(
          'Unable to refresh inventory. Please go back to cart and try again.'
        );
      } finally {
        setRefreshing(false);
      }
    };

    refresh();
  }, [navigate, selectedCurrency]);

  /*
   * The backend is the single source of truth for price.
   *
   * /products?currency=USD returns:
   *   displayPrice
   *   displayCurrency
   *   pricingSource
   *
   * Therefore checkout never looks at item.prices and never
   * falls back to INR. If a currency is configured, pricingService
   * calculates it automatically from the product base price.
   */
  const getItemUnitPrice = (item) => ({
    amount: Number(
      item.displayedUnitPrice ??
        item.displayPrice ??
        item.price ??
        0
    ) || 0,

    currency:
      String(
        item.displayCurrency ||
          selectedCurrency ||
          'INR'
      ).toUpperCase(),

    available: true
  });

  const currencySymbol =
    availableCurrencies.find(
      (c) =>
        String(c.code).toUpperCase() ===
        String(selectedCurrency).toUpperCase()
    )?.symbol ||
    (selectedCurrency === 'INR'
      ? '₹'
      : selectedCurrency);

  const subtotal =
    useMemo(
      () =>
        cart.reduce((sum, item) => {
          const { amount } = getItemUnitPrice(item);

          return (
            sum +
            amount * Number(item.quantity || 0)
          );
        }, 0),
      [cart, getItemUnitPrice]
    );

  const taxRate = 0;

  const taxAmount =
    useMemo(
      () =>
        subtotal *
        (taxRate / 100),
      [subtotal]
    );

  const total =
    subtotal + taxAmount;

  const updateCustomer = (
    field,
    value
  ) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateShipping = (
    field,
    value
  ) => {
    setShippingAddress(
      (prev) => ({
        ...prev,
        [field]: value
      })
    );
  };

  const updateBilling = (
    field,
    value
  ) => {
    setBillingAddress(
      (prev) => ({
        ...prev,
        [field]: value
      })
    );
  };

  const loadRazorpayScript =
    () =>
      new Promise(
        (resolve) => {
          if (
            window.Razorpay
          ) {
            resolve(true);
            return;
          }

          const script =
            document.createElement(
              'script'
            );

          script.src =
            'https://checkout.razorpay.com/v1/checkout.js';

          script.onload = () =>
            resolve(true);

          script.onerror = () =>
            resolve(false);

          document.body.appendChild(
            script
          );
        }
      );

  const validateForm = () => {
    if (
      !customer.name.trim()
    ) {
      return 'Please enter your name.';
    }

    if (
      !customer.email.trim() ||
      !/^\S+@\S+\.\S+$/.test(
        customer.email.trim()
      )
    ) {
      return 'Please enter a valid email address.';
    }

    if (
      !customer.phone.trim()
    ) {
      return 'Please enter your phone number.';
    }

    const requiredAddressFields = [
      ['fullName', 'Full name'],
      [
        'addressLine1',
        'Address'
      ],
      ['city', 'City'],
      ['state', 'State'],
      [
        'postalCode',
        'Postal code'
      ],
      ['country', 'Country']
    ];

    for (
      const [
        field,
        label
      ] of requiredAddressFields
    ) {
      if (
        !shippingAddress[
          field
        ]?.trim()
      ) {
        return `Please enter ${label.toLowerCase()} in shipping address.`;
      }
    }

    if (!sameBilling) {
      for (
        const [
          field,
          label
        ] of requiredAddressFields
      ) {
        if (
          !billingAddress[
            field
          ]?.trim()
        ) {
          return `Please enter ${label.toLowerCase()} in billing address.`;
        }
      }
    }

    return '';
  };

  const handlePayment =
    async () => {
      setError('');

      const validationError =
        validateForm();

      if (validationError) {
        setError(
          validationError
        );

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });

        return;
      }

      if (!cart.length) {
        setError(
          'Your cart is empty.'
        );
        return;
      }

      setLoading(true);

      try {
        const scriptLoaded =
          await loadRazorpayScript();

        if (!scriptLoaded) {
          throw new Error(
            'Unable to load Razorpay Checkout. Please check your internet connection.'
          );
        }

        /*
         * NEVER send price.------
         * Backend gets price from MongoDB, resolved for
         * `selectedCurrency` (component state, kept in synced hai
         * with Navbar/HomePage/ProductDetailPage via
         * localStorage + the 'currencyChanged' event).
         */
        const payload = {
          items: cart.map(
            (item) => ({
              productId:
                item._id,
              variantId:
                item.variantId || undefined,
              quantity:
                Number(
                  item.quantity
                )
            })
          ),

          customer,

          shippingAddress,

          billingAddress:
            sameBilling
              ? {
                  ...shippingAddress
                }
              : billingAddress,

          customerNote,

          currency: selectedCurrency
        };

        const createResponse =
          await api.post(
            '/payment/create-order',
            payload
          );

        const data =
          createResponse.data;

        if (!data?.success) {
          throw new Error(
            data?.message ||
              'Unable to create payment order.'
          );
        }

        const razorpayOrder =
          data.razorpayOrder;

        const options = {
          key: data.keyId,

          amount:
            razorpayOrder.amount,

          currency:
            razorpayOrder.currency,

          name:
            'Bansal Scientific',

          description:
            `Order ${data.order.orderNumber}`,

          order_id:
            razorpayOrder.id,

          prefill: {
            name:
              customer.name,

            email:
              customer.email,

            contact:
              customer.phone
          },

          notes: {
            orderNumber:
              data.order.orderNumber
          },

          theme: {
            color:
              '#2563eb'
          },

          modal: {
            confirm_close: true,
            backdropclose: false
          },

          handler:
            async (
              response
            ) => {
              try {
                setLoading(true);

                const verifyResponse =
                  await api.post(
                    '/payment/verify-payment',
                    {
                      localOrderId:
                        data.order.id,

                      razorpay_order_id:
                        response.razorpay_order_id,

                      razorpay_payment_id:
                        response.razorpay_payment_id,

                      razorpay_signature:
                        response.razorpay_signature,

                      checkoutAccessToken:
                        data.order.checkoutAccessToken
                    }
                  );

                const verification =
                  verifyResponse.data;

                if (
                  !verification.success
                ) {
                  throw new Error(
                    verification.message ||
                      'Payment verification failed.'
                  );
                }

                localStorage.setItem(
                  'lastOrder',
                  JSON.stringify(
                    verification.order
                  )
                );

                localStorage.removeItem(
                  'cart'
                );

                window.dispatchEvent(
                  new Event(
                    'cartUpdated'
                  )
                );

                navigate(
                  `/order-success?order=${encodeURIComponent(
                    verification.order
                      .orderNumber
                  )}`,
                  {
                    replace: true
                  }
                );
              } catch (
                verificationError
              ) {
                setError(
                  getApiError(
                    verificationError,
                    'Payment was completed but verification failed. Please contact Bansal Scientific with your payment ID.'
                  )
                );

                setLoading(false);
              }
            }
        };

        const razorpay =
          new window.Razorpay(
            options
          );

        razorpay.on(
  'payment.failed',
  async (response) => {
    console.error(
      'Razorpay payment failed:',
      response
    );

    try {
      await api.post(
        '/payment/cancel-order',
        {
          localOrderId:
            data.order.id,

          checkoutAccessToken:
            data.order.checkoutAccessToken
        }
      );
    } catch (cancelError) {
      console.error(
        'Unable to release reserved stock after payment failure:',
        cancelError
      );
    }

    setError(
      response.error?.description ||
        'Payment failed. Please try again.'
    );

    setLoading(false);
  }
);
razorpay.on(
  'modal.close',
  () => {
    // Closing the modal is not proof that the bank/payment provider failed.
    // Keep the reservation until Razorpay's failed/captured webhook or the
    // 15-minute expiry resolves it, so a late successful payment is never lost.
    setLoading(false);
  }
);

        razorpay.open();

        setLoading(false);
      } catch (err) {
        console.error(
          'Checkout error:',
          err
        );

        setError(
          getApiError(
            err,
            'Unable to start checkout.'
          )
        );

        setLoading(false);
      }
    };

  if (
    refreshing ||
    !cart.length
  ) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2
          className="animate-spin text-blue-600"
          size={28}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Cart
        </Link>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Checkout
            </h1>

            <p className="mt-2 text-slate-500">
              Complete your details and securely pay
              through Razorpay.
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setIsCurrencyOpen(!isCurrencyOpen)
              }
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold transition"
            >
              Pay in: {selectedCurrency}
            </button>

            {isCurrencyOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                {availableCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() =>
                      handleCurrencyChange(currency.code)
                    }
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 hover:text-blue-600 transition font-medium ${
                      currency.code === selectedCurrency
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-700'
                    }`}
                  >
                    {currency.name} ({currency.symbol}) -{' '}
                    {currency.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-lg text-slate-900">
                    Customer Information
                  </h2>

                  <p className="text-xs text-slate-500">
                    We will use this information for order updates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Full Name"
                  required
                  value={
                    customer.name
                  }
                  onChange={(value) =>
                    updateCustomer(
                      'name',
                      value
                    )
                  }
                />

                <Field
                  label="Email"
                  required
                  type="email"
                  value={
                    customer.email
                  }
                  onChange={(value) =>
                    updateCustomer(
                      'email',
                      value
                    )
                  }
                />

                <Field
                  label="Phone"
                  required
                  value={
                    customer.phone
                  }
                  onChange={(value) =>
                    updateCustomer(
                      'phone',
                      value
                    )
                  }
                />

                <Field
                  label="Company"
                  value={
                    customer.company
                  }
                  onChange={(value) =>
                    updateCustomer(
                      'company',
                      value
                    )
                  }
                />

                <Field
                  label="GSTIN"
                  value={
                    customer.gstin
                  }
                  onChange={(value) =>
                    updateCustomer(
                      'gstin',
                      value
                    )
                  }
                />
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-lg text-slate-900">
                    Shipping Address
                  </h2>
                </div>
              </div>

              <AddressFields
                address={
                  shippingAddress
                }
                updateAddress={
                  updateShipping
                }
              />
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={
                    sameBilling
                  }
                  onChange={(e) =>
                    setSameBilling(
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 accent-blue-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  Billing address is same as shipping address
                </span>
              </label>

              {!sameBilling && (
                <AddressFields
                  address={
                    billingAddress
                  }
                  updateAddress={
                    updateBilling
                  }
                />
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Order Notes
              </label>

              <textarea
                value={
                  customerNote
                }
                onChange={(e) =>
                  setCustomerNote(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Any delivery or product instructions..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </section>
          </div>

          <aside className="xl:sticky xl:top-24 h-fit">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-xl text-slate-900 mb-5">
                Order Summary
              </h2>

              <div className="space-y-4">
                {cart.map(
                  (item) => (
                    <div
                      key={
                        item._id
                      }
                      className="flex gap-3"
                    >
                      <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={
                              item.imageUrl
                            }
                            alt={
                              item.name
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800">
                          {
                            item.name
                          }
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          Qty:{' '}
                          {
                            item.quantity
                          }
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {currencySymbol}
                          {(
                            getItemUnitPrice(item).amount *
                            Number(item.quantity || 0)
                          ).toLocaleString('en-IN', {
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="border-t border-slate-200 my-5" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    {currencySymbol}
                    {subtotal.toLocaleString('en-IN', {
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    GST
                  </span>

                  <span className="font-semibold">
                    {currencySymbol}
                    {taxAmount.toLocaleString('en-IN', {
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Shipping
                  </span>

                  <span className="font-semibold text-emerald-600">
                    Calculated by team
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 my-5" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">
                  Total
                </span>

                <span className="text-2xl font-extrabold text-blue-600">
                  {currencySymbol}
                  {total.toLocaleString('en-IN', {
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>

              <button
                onClick={
                  handlePayment
                }
                disabled={
                  loading
                }
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl px-5 py-4 flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Pay Securely
                  </>
                )}
              </button>

              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
                <ShieldCheck
                  size={15}
                  className="text-emerald-500 flex-shrink-0"
                />

                <span>
                  Secure payment powered by Razorpay.
                  Your payment credentials are handled
                  by Razorpay Checkout.
                </span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <CheckCircle2
                  size={14}
                />
                Order confirmation after successful payment
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};

const Field = ({
  label,
  required = false,
  type = 'text',
  value,
  onChange
}) => (
  <label className="block">
    <span className="block text-sm font-semibold text-slate-700 mb-2">
      {label}

      {required && (
        <span className="text-rose-500">
          {' '}*
        </span>
      )}
    </span>

    <input
      type={type}
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value
        )
      }
      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </label>
);

const AddressFields = ({
  address,
  updateAddress
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Field
      label="Full Name"
      required
      value={
        address.fullName
      }
      onChange={(value) =>
        updateAddress(
          'fullName',
          value
        )
      }
    />

    <Field
      label="Company"
      value={
        address.company
      }
      onChange={(value) =>
        updateAddress(
          'company',
          value
        )
      }
    />

    <div className="md:col-span-2">
      <Field
        label="Address Line 1"
        required
        value={
          address.addressLine1
        }
        onChange={(value) =>
          updateAddress(
            'addressLine1',
            value
          )
        }
      />
    </div>

    <div className="md:col-span-2">
      <Field
        label="Address Line 2"
        value={
          address.addressLine2
        }
        onChange={(value) =>
          updateAddress(
            'addressLine2',
            value
          )
        }
      />
    </div>

    <Field
      label="City"
      required
      value={
        address.city
      }
      onChange={(value) =>
        updateAddress(
          'city',
          value
        )
      }
    />

    <Field
      label="State"
      required
      value={
        address.state
      }
      onChange={(value) =>
        updateAddress(
          'state',
          value
        )
      }
    />

    <Field
      label="Postal Code"
      required
      value={
        address.postalCode
      }
      onChange={(value) =>
        updateAddress(
          'postalCode',
          value
        )
      }
    />

    <Field
      label="Country"
      required
      value={
        address.country
      }
      onChange={(value) =>
        updateAddress(
          'country',
          value
        )
      }
    />
  </div>
);

export default CheckoutPage;
