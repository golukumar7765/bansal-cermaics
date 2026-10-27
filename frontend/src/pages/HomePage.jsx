import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { Coffee, FlaskConical, ShieldCheck, Eye, ArrowRight, Package, Search } from 'lucide-react';

const fallbackSlides = [
  {
    image: "https://bansalscientificceramic.com/wp-content/uploads/2025/12/1.webp",
    title: "High Alumina & Agate Labware",
    subtitle: "Engineered for extreme thermal environments up to 1750°C. Pure, durable, and precise.",
    ctaLabel: 'Explore scientific products',
    ctaUrl: '/scientific'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(localStorage.getItem('selectedCurrency') || 'INR');
  const [sortBy, setSortBy] = useState('default');
  const [slides, setSlides] = useState(fallbackSlides);
  const [activeSlide, setActiveSlide] = useState(0);

  
  const getCleanStoreType = () => {
    const val = localStorage.getItem('storeType') || 'B2B';
    return String(val).replace(/['"]/g, '').trim().toUpperCase();
  };

  const [storeType, setStoreType] = useState(getCleanStoreType());

  useEffect(() => {
    const pathStoreType = location.pathname.startsWith('/lifestyle') ? 'B2C' : 'B2B';
    localStorage.setItem('storeType', pathStoreType);
    setStoreType(pathStoreType);
    window.dispatchEvent(new Event('storeTypeChanged'));
  }, [location.pathname]);

  useEffect(() => {
    const handleStoreChange = () => setStoreType(getCleanStoreType());
    window.addEventListener('storeTypeChanged', handleStoreChange);
    return () => window.removeEventListener('storeTypeChanged', handleStoreChange);
  }, []);

  useEffect(() => {
    const updateCurrency = () => setSelectedCurrency(localStorage.getItem('selectedCurrency') || 'INR');
    window.addEventListener('currencyChanged', updateCurrency);
    window.addEventListener('storage', updateCurrency);
    return () => {
      window.removeEventListener('currencyChanged', updateCurrency);
      window.removeEventListener('storage', updateCurrency);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse, siteContentResponse] = await Promise.all([
          api.get('/products', { params: { currency: selectedCurrency } }),
          api.get('/categories'),
          api.get('/site-content').catch(() => ({ data: {} }))
        ]);
        setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data?.data || []);
        setDbCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data?.data || []);
        const configuredSlides = (siteContentResponse.data?.data?.homeSlideshow || [])
          .filter((slide) => slide?.isActive !== false && slide?.imageUrl)
          .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
        if (configuredSlides.length) setSlides(configuredSlides);
      } catch (error) {
        console.error('Error loading catalog:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCurrency]);

  useEffect(() => {
    setActiveSlide(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const getReferenceName = (value) => {
    if (!value) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    return value.name || value.title || '';
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', AED: 'د.إ', SAR: '﷼', AUD: 'A$', CAD: 'C$' };
    return symbols[String(currency || 'INR').toUpperCase()] || `${String(currency || 'INR').toUpperCase()} `;
  };

  const formatPrice = (value) => {
    if (value === undefined || value === null || !Number.isFinite(Number(value))) return '';
    return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const categoryObjects = useMemo(() => dbCategories.filter((cat) => cat && cat.archived !== true && cat.isActive !== false), [dbCategories]);
  const rootCategories = useMemo(() => categoryObjects.filter((cat) => !cat.parent && !cat.parentId && !cat.parentCategory), [categoryObjects]);

  const getProductPrice = (product) => {
    const currency = String(selectedCurrency || 'INR').toUpperCase();
    const basePrice = Number(product?.price) || 0;
    const backendDisplayPrice = Number(product?.displayPrice) || basePrice;

    if (product?.currencyPrices && product.currencyPrices[currency]) {
      return Number(product.currencyPrices[currency]);
    }

    const strategy = product?.currencyPricing?.[currency];
    if (strategy) {
      if (strategy.mode === 'override' && strategy.price > 0) {
        return Number(strategy.price);
      }
      if (strategy.mode === 'multiplier' && strategy.multiplier > 0) {
        const fxRatio = basePrice > 0 ? backendDisplayPrice / basePrice : 1;
        return basePrice * fxRatio * strategy.multiplier; 
      }
    }

    if (product?.displayPrice !== undefined && product?.displayPrice !== null && String(product?.displayCurrency || '').toUpperCase() === currency) {
      return Number(product.displayPrice);
    }
    
    const baseCurrency = String(product?.baseCurrency || 'INR').toUpperCase();
    if (baseCurrency === currency) return basePrice;
    
    return backendDisplayPrice;
  };

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      if (product.archived === true) return false;
      if (!searchQuery) return true;

      const searchableText = [
        product.name, product.sku, product.description, product.shortDescription, getReferenceName(product.category), getReferenceName(product.subcategory),
        ...(Array.isArray(product.specifications) ? product.specifications.flatMap((spec) => [spec?.name || '', String(spec?.value || '')]) : [])
      ].join(' ').toLowerCase();

      return searchableText.includes(searchQuery.trim().toLowerCase());
    });

    if (sortBy === 'name-asc') return [...result].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (sortBy === 'name-desc') return [...result].sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
    if (sortBy === 'price-low') return [...result].sort((a, b) => Number(getProductPrice(a) ?? 0) - Number(getProductPrice(b) ?? 0));
    if (sortBy === 'price-high') return [...result].sort((a, b) => Number(getProductPrice(b) ?? 0) - Number(getProductPrice(a) ?? 0));
    return result;
  }, [products, searchQuery, sortBy, getProductPrice]);

  const displayCategories = rootCategories.filter(c => {
    const type = String(c.storeType || 'B2B').trim().toUpperCase();
    return storeType === 'B2C' ? type === 'B2C' : type !== 'B2C';
  });

  const displayProducts = filteredProducts.filter(p => {
    const type = String(p.storeType || 'B2B').trim().toUpperCase();
    return storeType === 'B2C' ? type === 'B2C' : type !== 'B2C';
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-24 selection:bg-rose-100 selection:text-rose-900">

      {/* =========================================================
          HERO BANNER (Full Image Visibility - No Overlaps)
      ========================================================= */}
      <div className="relative w-full h-[280px] sm:h-[400px] lg:h-[480px] bg-slate-900 overflow-hidden">
        {/* Single Static Background Image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${slides[activeSlide]?.imageUrl || slides[activeSlide]?.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Soft gradient at the bottom to blend with the page background */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/60 to-transparent" />
        <div className="absolute inset-0 bg-slate-950/25" />
        <div className="absolute inset-x-0 bottom-16 sm:bottom-20 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 text-white">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80">Bansal Scientific</p>
          <h1 className="mt-2 max-w-2xl text-3xl sm:text-5xl font-black tracking-tight">{slides[activeSlide]?.title}</h1>
          {slides[activeSlide]?.subtitle && <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-white/90">{slides[activeSlide].subtitle}</p>}
          <Link to={slides[activeSlide]?.ctaUrl || (storeType === 'B2C' ? '/lifestyle' : '/scientific')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900 shadow-lg hover:bg-slate-100">
            {slides[activeSlide]?.ctaLabel || 'Explore products'} <ArrowRight size={16} />
          </Link>
        </div>
        {slides.length > 1 && <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">{slides.map((slide, index) => <button key={`${slide.title}-${index}`} type="button" aria-label={`Show slide ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-7 bg-white' : 'w-2.5 bg-white/60 hover:bg-white'}`} />)}</div>}
      </div>

      {/* =========================================================
          HORIZONTAL STORE SELECTOR CARDS (Placed below the banner)
      ========================================================= */}
      <div className="relative z-20 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 -mt-12 sm:-mt-20 lg:-mt-24 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          
          {/* Scientific Option */}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('storeType', 'B2B');
              setStoreType('B2B');
              window.dispatchEvent(new Event('storeTypeChanged'));
              navigate('/scientific');
            }}
            className={`group text-left cursor-pointer p-5 sm:p-6 rounded-[28px] transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/95 backdrop-blur-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl border ${
              storeType === 'B2B'
                ? 'border-rose-200 shadow-rose-500/20 ring-2 ring-rose-100'
                : 'border-white/50 hover:border-rose-200'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
              storeType === 'B2B'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
            }`}>
              <FlaskConical size={26} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-[18px] font-extrabold transition-colors ${
                storeType === 'B2B' ? 'text-rose-900' : 'text-slate-800 group-hover:text-rose-900'
              }`}>
                Scientific Store
              </h3>
              <p className={`text-[12px] mt-0.5 font-semibold ${
                storeType === 'B2B' ? 'text-rose-700/80' : 'text-slate-500 group-hover:text-rose-600/80'
              }`}>
                Alumina & Agate Labware
              </p>
            </div>
            <ArrowRight
              size={22}
              className={`hidden sm:block transition-all duration-300 ${
                storeType === 'B2B'
                  ? 'text-rose-600 translate-x-1'
                  : 'text-slate-300 group-hover:text-rose-500 group-hover:translate-x-1'
              }`}
            />
          </button>

          {/* Lifestyle Option */}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('storeType', 'B2C');
              setStoreType('B2C');
              window.dispatchEvent(new Event('storeTypeChanged'));
              navigate('/lifestyle');
            }}
            className={`group text-left cursor-pointer p-5 sm:p-6 rounded-[28px] transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/95 backdrop-blur-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl border ${
              storeType === 'B2C'
                ? 'border-orange-200 shadow-orange-500/20 ring-2 ring-orange-100'
                : 'border-white/50 hover:border-orange-200'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
              storeType === 'B2C'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'
            }`}>
              <Coffee size={26} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-[18px] font-extrabold transition-colors ${
                storeType === 'B2C' ? 'text-orange-900' : 'text-slate-800 group-hover:text-orange-900'
              }`}>
                Lifestyle Store
              </h3>
              <p className={`text-[12px] mt-0.5 font-semibold ${
                storeType === 'B2C' ? 'text-orange-700/80' : 'text-slate-500 group-hover:text-orange-600/80'
              }`}>
                Premium ceramic collections
              </p>
            </div>
            <ArrowRight
              size={22}
              className={`hidden sm:block transition-all duration-300 ${
                storeType === 'B2C'
                  ? 'text-orange-600 translate-x-1'
                  : 'text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1'
              }`}
            />
          </button>

          {/* Bulk RFQ Option */}
          <Link
            to="/contact"
            className="group cursor-pointer p-5 sm:p-6 rounded-[28px] transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/95 backdrop-blur-xl shadow-xl border border-white/50 hover:border-blue-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <Package size={26} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-extrabold text-slate-800 group-hover:text-blue-900 transition-colors">
                Porcelain & Bulk
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5 font-semibold group-hover:text-blue-600/80">
                Institutional orders & export
              </p>
            </div>
            <ArrowRight size={22} className="hidden sm:block text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
          </Link>

        </div>

        <div className="mt-5 max-w-2xl mx-auto relative">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Search ${storeType === 'B2B' ? 'labware, materials or SKUs' : 'products and collections'}`}
            className={`w-full rounded-2xl bg-white border px-12 py-4 text-sm text-slate-800 shadow-lg outline-none transition ${storeType === 'B2B' ? 'focus:border-rose-400 focus:ring-4 focus:ring-rose-100' : 'focus:border-orange-400 focus:ring-4 focus:ring-orange-100'}`}
          />
        </div>
      </div>

      {/* CATEGORIES GRID */}
      {!searchQuery ? (
        <section id="catalog-section" className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-12 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                <span className={`w-6 h-px ${storeType === 'B2B' ? 'bg-rose-500' : 'bg-orange-500'}`} />
                Curated for you
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Featured Collections
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
                Select a category to browse specialized products for {storeType === 'B2B' ? 'scientific applications' : 'home & lifestyle'}.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3.5 py-2 text-[11px] font-bold text-slate-500 shadow-sm">
              <ShieldCheck size={14} className="text-emerald-500" />
              Quality-focused selection
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-[220px] rounded-3xl bg-white border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : displayCategories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-600 font-semibold text-sm">
                No categories mapped to {storeType} yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {displayCategories.map((category) => {
                const name = getReferenceName(category);
                return (
                  <Link
                    key={category._id || name}
                    to={`${storeType === 'B2C' ? '/lifestyle' : '/scientific'}/category/${encodeURIComponent(name)}`}
                    className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-200/70 transition-all duration-500 min-h-[230px] flex flex-col justify-between border border-slate-200/80 text-left w-full hover:-translate-y-1.5"
                  >
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={name}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-slate-950/5" />
                    </div>

                    <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end h-full w-full mt-auto">
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white">
                          Collection
                        </span>
                      </div>

                      <div className="mt-20">
                        <h3 className="text-lg font-extrabold text-white tracking-tight">
                          {name}
                        </h3>
                        <p className="text-xs text-slate-200 mt-1.5 line-clamp-2 leading-relaxed">
                          {category.description || 'Explore our high-performance solutions.'}
                        </p>

                        <div className="mt-4 inline-flex items-center gap-1.5 text-white font-extrabold text-xs">
                          Explore collection
                          <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && displayProducts.length > 0 && (
            <div className="mt-14">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Ready to order</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950 tracking-tight">Popular products</h2>
                </div>
                <a href="#catalog-section" className={`text-xs font-extrabold ${storeType === 'B2B' ? 'text-rose-700' : 'text-orange-700'}`}>Explore catalog ↓</a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {displayProducts.filter((product) => product.featured).concat(displayProducts.filter((product) => !product.featured)).slice(0, 8).map((product) => {
                  const price = getProductPrice(product);
                  return (
                    <Link key={product._id} to={`${storeType === 'B2C' ? '/lifestyle' : '/scientific'}/product/${product._id}`} className="group bg-white rounded-2xl border border-slate-200 p-4 hover:-translate-y-1 hover:shadow-xl transition-all">
                      <div className="aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden p-3 flex items-center justify-center">
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" className="w-full h-full object-contain group-hover:scale-105 transition" /> : <Package size={28} className="text-slate-300" />}
                      </div>
                      <h3 className="mt-4 text-sm font-extrabold text-slate-900 line-clamp-2">{product.name}</h3>
                      <p className={`mt-2 text-sm font-black ${storeType === 'B2B' ? 'text-rose-700' : 'text-orange-700'}`}>{Number(price) > 0 ? `${getCurrencySymbol(selectedCurrency)}${formatPrice(price)}` : 'Request a quote'}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      ) : (
        /* SEARCH RESULTS */
        <main className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-8">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Search results
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Found <strong className="text-slate-950 font-extrabold">{displayProducts.length}</strong> results for
                <span className="text-slate-950 font-bold"> "{searchQuery}"</span>
              </div>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              className={`w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 shadow-sm transition-all ${
                storeType === 'B2B' ? 'focus:border-rose-500 focus:ring-rose-50' : 'focus:border-orange-500 focus:ring-orange-50'
              }`}
            >
              <option value="default">Sort: Default</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-low">Price Low-High</option>
              <option value="price-high">Price High-Low</option>
            </select>
          </div>

          {displayProducts.length === 0 ? (
            <div className="text-center py-20 px-6 bg-white rounded-3xl border border-slate-200 shadow-sm mt-6 space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Eye size={22} className="text-slate-400" />
              </div>
              <div>
                <p className="text-slate-800 font-extrabold text-base">
                  No products found
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Try a different search or contact us for a custom requirement.
                </p>
              </div>
              <Link
                to="/contact"
                className={`text-sm font-extrabold inline-flex items-center gap-1.5 ${
                  storeType === 'B2B' ? 'text-rose-600 hover:text-rose-700' : 'text-orange-600 hover:text-orange-700'
                }`}
              >
                Contact us for custom requirements
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayProducts.map((product) => {
                const price = getProductPrice(product);
                const category = getReferenceName(product.category);

                return (
                  <div
                    key={product._id}
                    className="group bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/70 hover:border-slate-300 relative"
                  >
                    <div>
                      <div className="relative aspect-square rounded-2xl bg-slate-50 overflow-hidden mb-5 flex items-center justify-center p-4 border border-slate-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="text-slate-300 text-xs font-semibold">
                            No Image
                          </div>
                        )}

                        {category && (
                          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold text-slate-600 shadow-sm tracking-wider uppercase border border-slate-100">
                            {category}
                          </span>
                        )}
                      </div>

                      <Link to={`${storeType === 'B2C' ? '/lifestyle' : '/scientific'}/product/${product._id}`}>
                        <h3 className={`font-extrabold text-slate-950 text-sm leading-5 transition line-clamp-2 ${
                          storeType === 'B2B'
                            ? 'hover:text-rose-600'
                            : 'hover:text-orange-600'
                        }`}>
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        {product.shortDescription || product.description || 'Premium quality product.'}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-[0.14em] mb-1">
                          Price
                        </span>
                        <span className={`text-sm font-black ${
                          storeType === 'B2B' ? 'text-rose-700' : 'text-orange-700'
                        }`}>
                          {price !== null && Number(price) > 0
                            ? `${getCurrencySymbol(selectedCurrency)}${formatPrice(price)}`
                            : 'RFQ Required'}
                        </span>
                      </div>

                      <Link
                        to={`${storeType === 'B2C' ? '/lifestyle' : '/scientific'}/product/${product._id}`}
                        className={`shrink-0 flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all border ${
                          storeType === 'B2B'
                            ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-600 hover:text-white hover:border-rose-600'
                            : 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-600 hover:text-white hover:border-orange-600'
                        }`}
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* TRUST STRIP */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mt-10">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={19} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Quality-focused</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Clear product information for confident purchasing decisions.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package size={19} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Built for bulk needs</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Support for institutional, export, and custom requirements.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <FlaskConical size={19} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Specialized ranges</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Scientific and lifestyle collections in one simple storefront.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
