import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../lib/api';

const getCurrencySymbol = (currency) => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', AED: 'د.إ', SAR: '﷼', AUD: 'A$', CAD: 'C$' };
  return symbols[String(currency || 'INR').toUpperCase()] || `${String(currency || 'INR').toUpperCase()} `;
};

const formatPrice = (value) => {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) return '';
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const getPriceRange = (product, targetCurrency) => {
  const currency = String(targetCurrency || 'INR').toUpperCase();
  const basePrice = Number(product?.price) || 0;
  let displayPrice = Number(product?.displayPrice) || basePrice;

  if (product?.currencyPrices?.[currency]) {
    displayPrice = Number(product.currencyPrices[currency]);
  } else {
    const strategy = product?.currencyPricing?.[currency];
    if (strategy) {
      const overrideVal = Number(strategy.overridePrice) || Number(strategy.price) || 0;
      if (strategy.mode === 'override' && overrideVal > 0) {
        displayPrice = overrideVal;
      } else if (strategy.mode === 'multiplier' && strategy.multiplier > 0) {
        const fxRatio = basePrice > 0 ? displayPrice / basePrice : 1;
        displayPrice = basePrice * fxRatio * strategy.multiplier;
      }
    }
  }

  const fxRatio = basePrice > 0 ? displayPrice / basePrice : 1;

  const activeVariants = Array.isArray(product?.variants)
    ? product.variants.filter((v) => v?.isActive !== false && Number(v?.price) > 0)
    : [];

  if (activeVariants.length === 0) return { min: displayPrice, max: displayPrice };
  const prices = activeVariants.map((v) => Number(v.price) * fxRatio);
  if (displayPrice > 0) prices.push(displayPrice);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

const StarRating = () => (
  <div className="flex text-amber-400 text-[11px] mb-1.5 gap-0.5 tracking-tighter">
    ★★★★★
  </div>
);

const SubcategoryPage = () => {
  const { categoryName, subcategoryName } = useParams();
  const location = useLocation();
  const storeType = location.pathname.startsWith('/lifestyle') ? 'B2C' : 'B2B';
  const storefrontPath = storeType === 'B2C' ? '/lifestyle' : '/scientific';
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem('selectedCurrency') || 'INR'
  );

  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : '';
  const decodedSubcategory = subcategoryName ? decodeURIComponent(subcategoryName) : '';

  useEffect(() => {
    const handleCurrencyChange = () => setSelectedCurrency(localStorage.getItem('selectedCurrency') || 'INR');
    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories', { params: { activeOnly: 'true' } });
        setCategories(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (error) {
        console.error('Category fetch error:', error);
      }
    };
    fetchCategories();
  }, []);

  const storefrontCategories = useMemo(
    () => categories.filter((category) => String(category.storeType || 'B2B').toUpperCase() === storeType),
    [categories, storeType]
  );
  const activeCategory = useMemo(() => 
    storefrontCategories.find((cat) => String(cat.name).toLowerCase() === String(decodedCategory).toLowerCase()) || null,
  [storefrontCategories, decodedCategory]);

  const activeSubcategory = useMemo(() => {
    if (!activeCategory) return null;
    return storefrontCategories.find((cat) => {
      const parentId = cat.parent?._id || cat.parent;
      return parentId && String(parentId) === String(activeCategory._id) && String(cat.name).toLowerCase() === String(decodedSubcategory).toLowerCase();
    }) || null;
  }, [storefrontCategories, activeCategory, decodedSubcategory]);

  const rootCategories = useMemo(() => storefrontCategories.filter(cat => !cat.parent), [storefrontCategories]);
  const getSubcategories = (parentId) => storefrontCategories.filter(cat => String(cat.parent?._id || cat.parent) === String(parentId));

  useEffect(() => {
    if (!activeSubcategory) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', {
          params: { subcategoryId: activeSubcategory._id, currency: selectedCurrency, limit: 100 }
        });
        setProducts(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (error) {
        console.error('Product fetch error:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeSubcategory, selectedCurrency]);

  const storefrontProducts = useMemo(
    () => products.filter((product) => String(product.storeType || 'B2B').toUpperCase() === storeType),
    [products, storeType]
  );
  const sortedProducts = useMemo(() => {
    const arr = [...storefrontProducts];
    if (sortBy === 'price-low') return arr.sort((a, b) => getPriceRange(a).min - getPriceRange(b).min);
    if (sortBy === 'price-high') return arr.sort((a, b) => getPriceRange(b).min - getPriceRange(a).min);
    if (sortBy === 'latest') return arr.reverse();
    return arr;
  }, [storefrontProducts, sortBy]);

  if (categories.length > 0 && !activeCategory) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Subcategory not found</h1>
          <Link to={storefrontPath} className="mt-4 inline-block text-[#1a8b44] font-semibold hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-20">
      
      {/* CLEAN BREADCRUMB */}
      <div className="border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-2 text-[11px] font-medium text-slate-400 tracking-wide uppercase">
          <Link to={storefrontPath} className="hover:text-slate-800 transition">Home</Link>
          <span>/</span>
          <Link to={`${storefrontPath}/category/${encodeURIComponent(decodedCategory)}`} className="hover:text-slate-800 transition">
            {decodedCategory}
          </Link>
          <span>/</span>
          <span className="text-slate-800">{decodedSubcategory}</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10 flex flex-col md:flex-row gap-10">
        
        {/* =========================================================
            ANTSLAB EXACT SIDEBAR
        ========================================================= */}
        <aside className="w-full md:w-64 shrink-0">
          <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 mb-4">
            Product categories
          </h2>
          <ul className="space-y-1 text-[13px]">
            {rootCategories.map((root) => {
              const subs = getSubcategories(root._id);
              const isRootActive = String(root.name).toLowerCase() === String(decodedCategory).toLowerCase();

              return (
                <li key={root._id} className="mb-2">
                  <Link 
                    to={`${storefrontPath}/category/${encodeURIComponent(root.name)}`}
                    className={`block py-1 hover:text-[#1a8b44] transition ${isRootActive ? 'text-[#1a8b44] font-bold' : 'text-slate-600'}`}
                  >
                    {root.name}
                  </Link>
                  
                  {isRootActive && subs.length > 0 && (
                    <ul className="pl-4 mt-1 space-y-1 border-l-2 border-slate-100 ml-1">
                      {subs.map((sub) => {
                        const isSubActive = String(sub.name).toLowerCase() === String(decodedSubcategory).toLowerCase();
                        return (
                          <li key={sub._id}>
                            <Link 
                              to={`${storefrontPath}/category/${encodeURIComponent(root.name)}/${encodeURIComponent(sub.name)}`}
                              className={`block py-1.5 text-xs hover:text-[#1a8b44] transition ${isSubActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>

        {/* =========================================================
            MAIN CONTENT AREA
        ========================================================= */}
        <main className="flex-1">
          
          {/* ANTSLAB PREMIUM BEIGE BOX (NO DUPLICATE H1 OUTSIDE) */}
          <div className="bg-[#f7f6f2] px-8 py-6 mb-8 text-[13px] text-[#4a4a4a] leading-[1.8] rounded-sm border border-[#edebe1]">
            <h1 className="text-[15px] font-bold text-slate-900 mb-2">
              {decodedSubcategory}
            </h1>
            <div className="whitespace-pre-wrap">
              {activeSubcategory?.description || `Explore our specialized ${decodedSubcategory} products.`}
            </div>
          </div>

          {/* TOP TOOLBAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 mb-8 pb-4 border-b border-slate-100 gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-sm px-3 py-2 text-slate-700 outline-none hover:border-slate-300 transition"
            >
              <option value="popularity">Sort by popularity</option>
              <option value="rating">Sort by average rating</option>
              <option value="latest">Sort by latest</option>
              <option value="price-low">Sort by price: low to high</option>
              <option value="price-high">Sort by price: high to low</option>
            </select>
            <span>Showing all {sortedProducts.length} results</span>
          </div>

          {/* PRODUCT GRID */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Loading products...</div>
          ) : sortedProducts.length === 0 ? (
            <div className="py-20 text-center text-slate-500">No products found in this subcategory.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {sortedProducts.map((product) => {
                const range = getPriceRange(product, selectedCurrency);
                const symbol = getCurrencySymbol(product.displayCurrency || selectedCurrency);
                const hasRange = range.min > 0 && range.max > 0 && Math.abs(range.min - range.max) > 0.01;
                const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || product.imageUrl || '';

                return (
                  <Link key={product._id} to={`${storefrontPath}/product/${product._id}`} className="group flex flex-col h-full">
                    {/* SQUARE IMAGE WITH LIGHT BG */}
                    <div className="relative aspect-square bg-white mb-3 overflow-hidden border border-slate-100 p-2">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Image</div>
                      )}
                    </div>

                    {/* CONTENT & PRICE */}
                    <div className="flex-1 flex flex-col">
                      <div className="text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1 truncate">
                        {decodedCategory}
                      </div>
                      
                      <h3 className="text-[13px] font-bold text-[#333] leading-snug mb-1.5 group-hover:text-[#1a8b44] transition">
                        {product.name}
                      </h3>
                      
                      <StarRating />

                      <div className="mt-1 text-[13px] font-bold text-[#222]">
                        {hasRange ? (
                          <p>{symbol}{formatPrice(range.min)} – {symbol}{formatPrice(range.max)}</p>
                        ) : range.min > 0 ? (
                          <p>{symbol}{formatPrice(range.min)}</p>
                        ) : (
                          <p className="text-[#1a8b44] text-xs">Request Quote</p>
                        )}
                      </div>

                      {/* HOVER GREEN BUTTON */}
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-auto">
                        <span className="block w-full text-center bg-[#1a8b44] text-white text-[11px] font-bold uppercase tracking-wider py-2 rounded-sm shadow-sm">
                          Select options
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* BOTTOM SEO DESCRIPTION BOX */}
          {activeSubcategory?.seo?.description && (
            <div className="mt-16 border border-slate-200 p-8 rounded-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Applications of {decodedSubcategory}
              </h3>
              <div className="text-[13px] text-slate-600 leading-loose whitespace-pre-wrap">
                {activeSubcategory.seo.description}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default SubcategoryPage;
