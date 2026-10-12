import React, {
  useEffect,
  useState
} from 'react';

import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';

import api from '../lib/api';

import {
  MapPin,
  Wrench,
  Globe,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Package,
  Mail,
  PhoneCall,
  MessageSquareQuote,
  ShoppingCart,
  FlaskConical, // Added for Toggle
  Coffee // Added for Toggle
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
  const location = useLocation();
  const navigate = useNavigate();
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
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' }
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

  const [
    categoryTree,
    setCategoryTree
  ] = useState([]);

  const [
    isMegaMenuOpen,
    setIsMegaMenuOpen
  ] = useState(false);

  const [
    activeCategory,
    setActiveCategory
  ] = useState(null);

  // ==========================================
  // STORE TOGGLE LOGIC
  // ==========================================
  const [storeType, setStoreType] = useState(localStorage.getItem('storeType') || 'B2B');
  const storefrontPath = storeType === 'B2C' ? '/lifestyle' : '/scientific';

  const handleStoreToggle = (type) => {
    localStorage.setItem('storeType', type);
    setStoreType(type);
    window.dispatchEvent(new Event('storeTypeChanged'));
    navigate(type === 'B2C' ? '/lifestyle' : '/scientific');
  };

  useEffect(() => {
    const pathStoreType = location.pathname.startsWith('/lifestyle')
      ? 'B2C'
      : location.pathname.startsWith('/scientific')
        ? 'B2B'
        : null;

    if (!pathStoreType) return;

    localStorage.setItem('storeType', pathStoreType);
    setStoreType(pathStoreType);
    window.dispatchEvent(new Event('storeTypeChanged'));
  }, [location.pathname]);

  useEffect(() => {
    const fetchCategoryTree = async () => {
      try {
        const res = await api.get('/categories/tree');
        const tree = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        setCategoryTree(tree);

        if (tree.length > 0) {
          setActiveCategory(tree[0]._id);
        }
      } catch (error) {
        console.warn(
          'Category tree unavailable:',
          error?.response?.data || error?.message
        );
      }
    };

    fetchCategoryTree();
  }, []);

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
    const updateCart = () => {
      setCartCount(readCartCount());
    };

    // Listen to store changes from other tabs/components
    const handleStoreChange = () => {
      setStoreType(localStorage.getItem('storeType') || 'B2B');
    };

    window.addEventListener('storage', updateCart);
    window.addEventListener('cartUpdated', updateCart);
    window.addEventListener('storeTypeChanged', handleStoreChange);

    return () => {
      window.removeEventListener('storage', updateCart);
      window.removeEventListener('cartUpdated', updateCart);
      window.removeEventListener('storeTypeChanged', handleStoreChange);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 font-sans shadow-xs">

      {/* TOP BAR */}
      <div className="bg-slate-100 border-b border-slate-200 py-1.5 px-6 text-xs text-slate-600 relative">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 font-medium z-10">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Bansal+Scientific+Khurja"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-[#1a8b44] transition"
            >
              <MapPin size={13} className="text-[#1a8b44]" />
              <span>Partner Locator</span>
            </a>

            <Link
              to="/service-support"
              className="flex items-center gap-1.5 hover:text-[#1a8b44] transition"
            >
              <Wrench size={13} className="text-[#1a8b44]" />
              <span>Service & Support</span>
            </Link>
          </div>

          {/* ==========================================
              THE B2B / B2C STORE TOGGLE
          ========================================== */}
          <div className="flex bg-slate-200/70 p-1 rounded-full border border-slate-300 shadow-inner w-full sm:w-auto justify-center mx-auto lg:absolute lg:left-1/2 lg:-translate-x-1/2 z-0">
            <button
              onClick={() => handleStoreToggle('B2B')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${
                storeType === 'B2B' ? 'bg-white text-blue-700 shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FlaskConical size={12} /> Scientific
            </button>
            <button
              onClick={() => handleStoreToggle('B2C')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${
                storeType === 'B2C' ? 'bg-[#4a3b32] text-amber-100 shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Coffee size={12} /> Lifestyle
            </button>
          </div>

          <div className="flex items-center gap-4 z-10">
            {/* CURRENCY SELECTOR */}
            <div className="relative">
              <button
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 px-2.5 py-1 rounded border border-slate-300 text-slate-700 transition"
              >
                <Globe size={13} className="text-[#1a8b44]" />
                <span className="font-medium">{selectedCurrency}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {isCurrencyOpen && (
                <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
                  {availableCurrencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => handleCurrencyChange(currency.code)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-[#1a8b44] transition font-medium ${
                        currency.code === selectedCurrency
                          ? 'text-[#1a8b44] bg-emerald-50'
                          : 'text-slate-700'
                      }`}
                    >
                      {currency.name} ({currency.symbol}) - {currency.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ADMIN LINKS */}
            <Link
              to="/admin"
              className="flex items-center gap-1 text-slate-600 hover:text-[#1a8b44] transition font-semibold"
            >
              <UserCheck size={13} className="text-[#1a8b44]" />
              Admin
            </Link>

            {isAdminLoggedIn && (
              <>
                <Link
                  to="/admin/inquiries"
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-md transition"
                >
                  <MessageSquareQuote size={13} />
                  RFQs
                </Link>

                <Link
                  to="/admin/orders"
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-md transition"
                >
                  <Package size={13} />
                  Orders
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MAIN NAV */}
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to={storeType === 'B2C' ? '/lifestyle' : '/scientific'} className="flex items-center gap-3 group shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md transition-colors ${storeType === 'B2C' ? 'bg-orange-600 shadow-orange-500/20' : 'bg-[#1a8b44] shadow-emerald-500/20'} group-hover:scale-105 transition`}>
            BS
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-wide leading-none">
              BANSAL SCIENTIFIC
            </h1>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${storeType === 'B2C' ? 'text-orange-600' : 'text-[#1a8b44]'}`}>
              {storeType === 'B2C' ? 'Home & Lifestyle' : 'High Temp Ceramics'}
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="hidden xl:flex items-center gap-6 text-[13px] font-bold text-slate-700 uppercase tracking-wide">
          
          <Link to={storeType === 'B2C' ? '/lifestyle' : '/scientific'} className="hover:text-[#1a8b44] transition">Home</Link>

          {/* MEGA MENU: OUR PRODUCT */}
          <div
            className="relative"
            onMouseEnter={() => setIsMegaMenuOpen(true)}
            onMouseLeave={() => setIsMegaMenuOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-[#1a8b44] transition py-4">
              {storeType === 'B2C' ? 'Lifestyle Shop' : 'Scientific Shop'}
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {isMegaMenuOpen && categoryTree.length > 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-0 w-[780px] max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-2xl flex overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 normal-case tracking-normal">
                {/* LEVEL 1: MAIN CATEGORIES */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 py-3 shrink-0">
                  <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/60 mb-1">
                    Categories
                  </div>
                  {categoryTree.map((category) => {
                    // Automatically hide B2C categories when in B2B mode and vice versa 
                    // (Assuming you added storeType to backend Category model, otherwise all will show)
                    if (category.storeType && category.storeType !== storeType) return null;
                    
                    return (
                    <button
                      key={category._id}
                      onMouseEnter={() => setActiveCategory(category._id)}
                      className={`w-full text-left px-4 py-3 text-sm font-semibold flex items-center justify-between transition ${
                        activeCategory === category._id
                          ? 'bg-white text-[#1a8b44] border-l-4 border-[#1a8b44] pl-3 shadow-xs'
                          : 'text-slate-700 hover:bg-white hover:text-[#1a8b44]'
                      }`}
                    >
                      <Link
                        to={`${storefrontPath}/category/${encodeURIComponent(category.name)}`}
                        className="flex-1 truncate"
                        onClick={() => setIsMegaMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>
                  )})}
                </div>

                {/* LEVEL 2: SUBCATEGORIES GRID */}
                <div className="flex-1 p-6 bg-white overflow-y-auto max-h-[460px]">
                  {(() => {
                    const current = categoryTree.find(
                      (category) => category._id === activeCategory
                    );

                    if (!current) return null;

                    return (
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                          <h3 className="font-bold text-slate-900 text-base">
                            {current.name}
                          </h3>
                          <Link
                            to={`${storefrontPath}/category/${encodeURIComponent(current.name)}`}
                            onClick={() => setIsMegaMenuOpen(false)}
                            className="text-xs font-semibold text-[#1a8b44] hover:underline flex items-center gap-1"
                          >
                            Explore All <ChevronRight size={12} />
                          </Link>
                        </div>

                        {!current.children || current.children.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No subcategories under this section.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {current.children.map((sub) => (
                              <Link
                                key={sub._id}
                                to={`${storefrontPath}/category/${encodeURIComponent(
                                  current.name
                                )}/${encodeURIComponent(sub.name)}`}
                                onClick={() => setIsMegaMenuOpen(false)}
                                className="group p-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition flex items-center gap-3"
                              >
                                {sub.imageUrl ? (
                                  <img
                                    src={sub.imageUrl}
                                    alt={sub.name}
                                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-emerald-100 group-hover:text-[#1a8b44] transition">
                                    <Package size={18} />
                                  </div>
                                )}
                                <span className="text-xs font-semibold text-slate-700 group-hover:text-[#1a8b44] transition line-clamp-2">
                                  {sub.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <Link to="/about" className="hover:text-[#1a8b44] transition">About us</Link>
          <Link to="/service-support" className="hover:text-[#1a8b44] transition">Service & Support</Link>
          <Link to="/faq" className="hover:text-[#1a8b44] transition">FAQs</Link>
          <Link to="/technicals" className="hover:text-[#1a8b44] transition">Technical & Datasheet</Link>
          <Link to="/contact" className="hover:text-[#1a8b44] transition">Contact</Link>

          {/* CART */}
          <Link
            to="/cart"
            className="relative flex items-center gap-1.5 hover:text-[#1a8b44] transition ml-2 pl-6 border-l border-slate-200"
          >
            <ShoppingCart size={16} className="text-slate-400" />
            Cart
            {cartCount > 0 && (
              <span className={`absolute -top-3 -right-4 min-w-5 h-5 px-1 rounded-full text-white text-[10px] flex items-center justify-center font-bold ${storeType === 'B2C' ? 'bg-orange-600' : 'bg-[#1a8b44]'}`}>
                {cartCount}
              </span>
            )}
          </Link>
        </nav>

        {/* CTA BUTTON */}
        <a
          href="https://wa.me/919149062163"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-2 text-xs font-bold text-white bg-[#1a8b44] hover:bg-[#157236] px-4 py-2.5 rounded-lg transition shadow-md shadow-emerald-600/20"
        >
          <PhoneCall size={14} />
          Direct Inquiry
        </a>
      </div>
    </header>
  );
};

export default Navbar;
