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

const CategoryPage = () => {
  const { categoryName } = useParams();
  const location = useLocation();
  const storeType = location.pathname.startsWith('/lifestyle') ? 'B2C' : 'B2B';
  const storefrontPath = storeType === 'B2C' ? '/lifestyle' : '/scientific';
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popularity');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [purchaseFilter, setPurchaseFilter] = useState('all');
  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem('selectedCurrency') || 'INR'
  );

  const decodedName = categoryName ? decodeURIComponent(categoryName) : '';

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
    storefrontCategories.find((cat) => String(cat.name).toLowerCase() === String(decodedName).toLowerCase()) || null,
  [storefrontCategories, decodedName]);

  const rootCategories = useMemo(() => storefrontCategories.filter(cat => !cat.parent), [storefrontCategories]);
  const getSubcategories = (parentId) => storefrontCategories.filter(cat => String(cat.parent?._id || cat.parent) === String(parentId));

  useEffect(() => {
    if (!activeCategory) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch ALL products belonging to this category[cite: 1]
        const res = await api.get('/products', {
          params: { categoryId: activeCategory._id, currency: selectedCurrency, limit: 100 }
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
  }, [activeCategory, selectedCurrency]);

  const storefrontProducts = useMemo(
    () => products.filter((product) => String(product.storeType || 'B2B').toUpperCase() === storeType),
    [products, storeType]
  );

  const filterGroups = useMemo(() => {
    const groups = new Map();

    storefrontProducts.forEach((product) => {
      (product.specifications || []).forEach((specification) => {
        const name = String(specification?.name || '').trim();
        const value = `${String(specification?.value || '').trim()}${specification?.unit ? ` ${specification.unit}` : ''}`.trim();
        if (!name || !value) return;
        if (!groups.has(name)) groups.set(name, new Set());
        groups.get(name).add(value);
      });
    });

    return [...groups.entries()]
      .map(([name, values]) => ({ name, values: [...values].sort() }))
      .filter((group) => group.values.length > 1 && group.values.length <= 12)
      .slice(0, 6);
  }, [storefrontProducts]);

  const toggleSpecificationFilter = (name, value) => {
    setSelectedFilters((current) => {
      const selectedValues = new Set(current[name] || []);
      if (selectedValues.has(value)) selectedValues.delete(value);
      else selectedValues.add(value);
      const next = { ...current, [name]: [...selectedValues] };
      if (next[name].length === 0) delete next[name];
      return next;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilters({});
    setAvailabilityFilter('all');
    setPurchaseFilter('all');
  };

  const filteredProducts = useMemo(() => storefrontProducts.filter((product) => {
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      const searchableText = [
        product.name,
        product.sku,
        product.shortDescription,
        product.description,
        ...(product.specifications || []).flatMap((specification) => [specification?.name, specification?.value, specification?.unit])
      ].join(' ').toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    const availableStock = Math.max(
      Number(product.stock) || 0,
      ...(product.variants || []).filter((variant) => variant?.isActive !== false).map((variant) => Number(variant.stock) || 0)
    );
    const isDirectPurchase = product.isDirectPurchaseAllowed !== false;
    if (availabilityFilter === 'in-stock' && availableStock <= 0) return false;
    if (availabilityFilter === 'inquiry' && availableStock > 0) return false;
    if (purchaseFilter === 'direct' && !isDirectPurchase) return false;
    if (purchaseFilter === 'rfq' && isDirectPurchase) return false;

    return Object.entries(selectedFilters).every(([name, values]) => {
      const productValues = (product.specifications || [])
        .filter((specification) => specification?.name === name)
        .map((specification) => `${String(specification?.value || '').trim()}${specification?.unit ? ` ${specification.unit}` : ''}`.trim());
      return values.some((value) => productValues.includes(value));
    });
  }), [storefrontProducts, searchTerm, selectedFilters, availabilityFilter, purchaseFilter]);

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    if (sortBy === 'price-low') return arr.sort((a, b) => getPriceRange(a).min - getPriceRange(b).min);
    if (sortBy === 'price-high') return arr.sort((a, b) => getPriceRange(b).min - getPriceRange(a).min);
    if (sortBy === 'latest') return arr.reverse();
    return arr;
  }, [filteredProducts, sortBy]);

  if (categories.length > 0 && !activeCategory) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Category not found</h1>
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
          <span className="text-slate-800">{decodedName}</span>
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
              const isRootActive = String(root.name).toLowerCase() === String(decodedName).toLowerCase();

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
                      {subs.map((sub) => (
                        <li key={sub._id}>
                          <Link 
                            to={`${storefrontPath}/category/${encodeURIComponent(root.name)}/${encodeURIComponent(sub.name)}`}
                            className="block py-1.5 text-xs text-slate-500 hover:text-[#1a8b44] transition"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Filters</h2>
              {(Object.keys(selectedFilters).length > 0 || availabilityFilter !== 'all' || purchaseFilter !== 'all' || searchTerm) && (
                <button type="button" onClick={clearFilters} className="text-[11px] font-bold text-[#1a8b44] hover:underline">Clear all</button>
              )}
            </div>

            <div className="mt-4 space-y-5 text-xs">
              <fieldset>
                <legend className="font-bold text-slate-700 mb-2">Availability</legend>
                <label className="flex items-center gap-2 py-1 cursor-pointer"><input type="radio" name="availability" checked={availabilityFilter === 'all'} onChange={() => setAvailabilityFilter('all')} /> All products</label>
                <label className="flex items-center gap-2 py-1 cursor-pointer"><input type="radio" name="availability" checked={availabilityFilter === 'in-stock'} onChange={() => setAvailabilityFilter('in-stock')} /> In stock</label>
                <label className="flex items-center gap-2 py-1 cursor-pointer"><input type="radio" name="availability" checked={availabilityFilter === 'inquiry'} onChange={() => setAvailabilityFilter('inquiry')} /> Enquiry required</label>
              </fieldset>

              <fieldset>
                <legend className="font-bold text-slate-700 mb-2">Purchase option</legend>
                <label className="flex items-center gap-2 py-1 cursor-pointer"><input type="radio" name="purchase" checked={purchaseFilter === 'all'} onChange={() => setPurchaseFilter('all')} /> All options</label>
                <label className="flex items-center gap-2 py-1 cursor-pointer"><input type="radio" name="purchase" checked={purchaseFilter === 'direct'} onChange={() => setPurchaseFilter('direct')} /> Buy online</label>
                <label className="flex items-center gap-2 py-1 cursor-pointer"><input type="radio" name="purchase" checked={purchaseFilter === 'rfq'} onChange={() => setPurchaseFilter('rfq')} /> Request a quote</label>
              </fieldset>

              {filterGroups.map((group) => (
                <fieldset key={group.name} className="border-t border-slate-100 pt-4">
                  <legend className="font-bold text-slate-700 mb-2">{group.name}</legend>
                  {group.values.map((value) => (
                    <label key={value} className="flex items-center gap-2 py-1 cursor-pointer text-slate-600">
                      <input type="checkbox" checked={(selectedFilters[group.name] || []).includes(value)} onChange={() => toggleSpecificationFilter(group.name, value)} />
                      <span className="truncate">{value}</span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          </div>
        </aside>

        {/* =========================================================
            MAIN CONTENT AREA
        ========================================================= */}
        <main className="flex-1">
          
          {/* ANTSLAB PREMIUM BEIGE BOX (NO DUPLICATE H1 OUTSIDE) */}
          <div className="bg-[#f7f6f2] px-8 py-6 mb-8 text-[13px] text-[#4a4a4a] leading-[1.8] rounded-sm border border-[#edebe1]">
            <h1 className="text-[15px] font-bold text-slate-900 mb-2">
              {decodedName}
            </h1>
            <div className="whitespace-pre-wrap">
              {activeCategory?.description || `Explore our high-performance range of ${decodedName} for industrial and scientific applications.`}
            </div>
          </div>

          {/* TOP TOOLBAR */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-xs text-slate-500 mb-8 pb-4 border-b border-slate-100 gap-4">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search this category"
              className="w-full lg:w-64 bg-white border border-slate-200 rounded-sm px-3 py-2 text-slate-700 outline-none focus:border-[#1a8b44]"
            />
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
            <span>Showing {sortedProducts.length} of {storefrontProducts.length} products</span>
          </div>

          {/* PRODUCT GRID */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Loading products...</div>
          ) : sortedProducts.length === 0 ? (
            <div className="py-20 text-center text-slate-500">No products found in this category.</div>
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
                        {decodedName}
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
          {activeCategory?.seo?.description && (
            <div className="mt-16 border border-slate-200 p-8 rounded-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Applications of {decodedName}
              </h3>
              <div className="text-[13px] text-slate-600 leading-loose whitespace-pre-wrap">
                {activeCategory.seo.description}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default CategoryPage;
