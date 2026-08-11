import React, {
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import api from '../lib/api';

import {
  MapPin,
  Wrench,
  Globe,
  ChevronDown,
  UserCheck,
  Package,
  FileText,
  Mail,
  PhoneCall,
  MessageSquareQuote,
  ShoppingCart
} from 'lucide-react';

const readCartCount = () => {
  try {
    const cart = JSON.parse(
      localStorage.getItem(
        'cart'
      ) || '[]'
    );

    return cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );
  } catch {
    return 0;
  }
};

const Navbar = () => {
  const [
    selectedCurrency,
    setSelectedCurrency
  ] = useState(
    localStorage.getItem('selectedCurrency') || 'INR'
  );

  const [
    isCurrencyOpen,
    setIsCurrencyOpen
  ] = useState(false);

  const [
    availableCurrencies,
    setAvailableCurrencies
  ] = useState([
    { code: 'INR', name: 'Indian Rupee', symbol: '\u20b9' }
  ]);

  const [
    cartCount,
    setCartCount
  ] = useState(
    readCartCount()
  );

  const isAdminLoggedIn =
    !!localStorage.getItem(
      'adminToken'
    );

  /*
   * =========================================================
   * CURRENCY: single source of truth for the whole site.
   *
   * Fetches the real active currencies configured by admin
   * (backend/models/Currency.js), stores the chosen CODE
   * ('USD', 'EUR', ...) in localStorage['selectedCurrency'],
   * and dispatches a 'currencyChanged' event.
   *
   * HomePage.jsx, ProductDetailPage.jsx and CheckoutPage.jsx
   * already listen for this exact event + localStorage key,
   * so switching currency here updates every page live.
   * =========================================================
   */

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await api.get('/currencies');
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.currencies || res.data?.data || [];

        const active = list.filter(
          (currency) => currency.isActive !== false
        );

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
  }, []);

  const handleCurrencyChange = (code) => {
    localStorage.setItem('selectedCurrency', code);
    setSelectedCurrency(code);
    setIsCurrencyOpen(false);

    window.dispatchEvent(new Event('currencyChanged'));
  };

  useEffect(() => {
    const updateCart =
      () => {
        setCartCount(
          readCartCount()
        );
      };

    window.addEventListener(
      'storage',
      updateCart
    );

    window.addEventListener(
      'cartUpdated',
      updateCart
    );

    return () => {
      window.removeEventListener(
        'storage',
        updateCart
      );

      window.removeEventListener(
        'cartUpdated',
        updateCart
      );
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 font-sans shadow-xs">

      {/* TOP BAR */}
      <div className="bg-slate-100 border-b border-slate-200 py-1.5 px-6 text-xs text-slate-600">

        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-6 font-medium">

            <a
              href="https://www.google.com/maps/search/?api=1&query=Bansal+Scientific+Khurja"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-blue-600 transition"
            >
              <MapPin
                size={13}
                className="text-blue-600"
              />

              <span>
                Partner Locator
              </span>
            </a>

            <Link
              to="/contact"
              className="flex items-center gap-1.5 hover:text-blue-600 transition"
            >
              <Wrench
                size={13}
                className="text-blue-600"
              />

              <span>
                Service & Support
              </span>
            </Link>

          </div>

          <div className="flex items-center gap-4">

            {/* CURRENCY */}
            <div className="relative">

              <button
                onClick={() =>
                  setIsCurrencyOpen(
                    !isCurrencyOpen
                  )
                }
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-2.5 py-1 rounded border border-slate-300 text-slate-700 transition"
              >
                <Globe
                  size={13}
                  className="text-blue-600"
                />

                <span className="font-medium">
                  {selectedCurrency}
                </span>

                <ChevronDown
                  size={12}
                  className="text-slate-400"
                />
              </button>

              {isCurrencyOpen && (
                <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">

                  {availableCurrencies.map(
                    (currency) => (
                      <button
                        key={currency.code}
                        onClick={() =>
                          handleCurrencyChange(currency.code)
                        }
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 hover:text-blue-600 transition font-medium ${
                          currency.code === selectedCurrency
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-700'
                        }`}
                      >
                        {currency.name} ({currency.symbol}) - {currency.code}
                      </button>
                    )
                  )}

                </div>
              )}

            </div>

            {/* ADMIN */}
            <Link
              to="/admin"
              className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition font-semibold"
            >
              <UserCheck
                size={13}
                className="text-blue-600"
              />

              Admin
            </Link>

            {isAdminLoggedIn && (
              <>
                <Link
                  to="/admin/inquiries"
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-md transition"
                >
                  <MessageSquareQuote
                    size={13}
                  />

                  RFQs
                </Link>

                <Link
                  to="/admin/orders"
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-md transition"
                >
                  <Package
                    size={13}
                  />

                  Orders
                </Link>
              </>
            )}

          </div>

        </div>
      </div>

      {/* MAIN NAV */}
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-3 group"
        >

          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
            BS
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-wide leading-none">
              BANSAL SCIENTIFIC
            </h1>

            <span className="text-[10px] text-blue-600 uppercase tracking-widest font-bold">
              High Temp Ceramics
            </span>
          </div>

        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-700">

          <Link
            to="/"
            className="flex items-center gap-1.5 hover:text-blue-600 transition"
          >
            <Package
              size={16}
              className="text-slate-400"
            />
            Products
          </Link>

          <Link
            to="/technicals"
            className="flex items-center gap-1.5 hover:text-blue-600 transition"
          >
            <FileText
              size={16}
              className="text-slate-400"
            />
            Technicals
          </Link>

          <Link
            to="/cart"
            className="relative flex items-center gap-1.5 hover:text-blue-600 transition"
          >
            <ShoppingCart
              size={16}
              className="text-slate-400"
            />

            Cart

            {cartCount > 0 && (
              <span className="absolute -top-3 -right-4 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            to="/contact"
            className="flex items-center gap-1.5 hover:text-blue-600 transition"
          >
            <Mail
              size={16}
              className="text-slate-400"
            />

            Contact
          </Link>

        </nav>

        <a
          href="https://wa.me/919149062163"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-lg transition shadow-md shadow-blue-600/20"
        >
          <PhoneCall size={14} />
          Direct Inquiry
        </a>

      </div>

    </header>
  );
};

export default Navbar;