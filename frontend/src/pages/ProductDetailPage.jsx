import React, { useEffect, useMemo, useState } from 'react';

import { Link, useLocation, useParams } from 'react-router-dom';

import api from '../lib/api';

import {

  ArrowLeft,

  CheckCircle2,

  MessageSquareQuote,

  ShoppingCart,

  Package,

  FileText,

  FlaskConical,

  Box,

  Truck,

  ShieldCheck,

  Settings,

  Image as ImageIcon,

  ChevronLeft,

  ChevronRight,

  Minus,

  Plus

} from 'lucide-react';

// =========================================================

// ADVANCED SMART PRICING RESOLVER (Admin Override & Multiplier)

// =========================================================

const resolveProductPrice = (product, selectedVariant, currencyCode, quantity = 1) => {
  if (!product) return 0;

  const currency = String(currencyCode || product.baseCurrency || 'INR').toUpperCase();
  const baseCurrency = String(product.baseCurrency || 'INR').toUpperCase();
  const productBase = Number(product.price) || 0;
  const variantBase = Number(selectedVariant?.price);
  const basePrice = selectedVariant && Number.isFinite(variantBase) && variantBase >= 0
    ? variantBase
    : productBase;
  const backendDisplay = Number(selectedVariant?.displayPrice ?? product.displayPrice);
  const fallbackDisplay = Number.isFinite(backendDisplay) && backendDisplay >= 0
    ? backendDisplay
    : basePrice;

  const asObject = (value) => {
    if (value instanceof Map) return Object.fromEntries(value.entries());
    if (value && typeof value.toObject === 'function') return value.toObject();
    return value && typeof value === 'object' ? value : {};
  };

  const pricing = asObject(product.pricing);
  const tiers = Array.isArray(pricing.quantityTiers) ? pricing.quantityTiers : [];
  if (pricing.allowQuantityPricing === true) {
    const qty = Math.max(1, Number(quantity) || 1);
    const matchingTier = tiers
      .filter((tier) => String(tier.currency || baseCurrency).toUpperCase() === currency)
      .filter((tier) => qty >= Number(tier.minQuantity || 1))
      .filter((tier) => tier.maxQuantity == null || tier.maxQuantity === '' || qty <= Number(tier.maxQuantity))
      .sort((a, b) => Number(b.minQuantity || 1) - Number(a.minQuantity || 1))[0];
    if (matchingTier && Number.isFinite(Number(matchingTier.price)) && Number(matchingTier.price) >= 0) {
      return Number(matchingTier.price);
    }
  }

  const pricingConfig = asObject(product.currencyPricing);
  const configKey = Object.keys(pricingConfig).find((key) => key.toUpperCase() === currency);
  const config = configKey ? pricingConfig[configKey] : null;

  if (config && config.enabled !== false) {
    if (config.mode === 'override') {
      const override = Number(config.overridePrice ?? config.price);
      if (Number.isFinite(override) && override >= 0) {
        return selectedVariant && productBase > 0
          ? override * (basePrice / productBase)
          : override;
      }
    }

    if (config.mode === 'multiplier') {
      const multiplier = Number(config.multiplier);
      if (Number.isFinite(multiplier) && multiplier >= 0) {
        const fxRatio = productBase > 0 ? fallbackDisplay / productBase : 1;
        return basePrice * fxRatio * multiplier;
      }
    }
  }

  const legacyPrices = asObject(product.currencyPrices);
  const legacyKey = Object.keys(legacyPrices).find((key) => key.toUpperCase() === currency);
  const legacyValue = legacyKey ? Number(legacyPrices[legacyKey]) : NaN;
  if (Number.isFinite(legacyValue) && legacyValue >= 0) {
    return selectedVariant && productBase > 0
      ? legacyValue * (basePrice / productBase)
      : legacyValue;
  }

  if (currency === baseCurrency) return basePrice;
  return fallbackDisplay;
};

const ProductDetailPage = () => {

  const { id } = useParams();

  const location = useLocation();

  const storeType = location.pathname.startsWith('/lifestyle') ? 'B2C' : 'B2B';

  const storefrontPath = storeType === 'B2C' ? '/lifestyle' : '/scientific';

  const isScopedStorefront = location.pathname.startsWith('/scientific') || location.pathname.startsWith('/lifestyle');

  const [product, setProduct] = useState(null);

  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);

  const [activeImage, setActiveImage] = useState(0);

  const [selectedVariant, setSelectedVariant] = useState(null);

  const [selectedCurrency, setSelectedCurrency] = useState(

    localStorage.getItem('selectedCurrency') || 'INR'

  );

  useEffect(() => {

    const handleStorage = () => {

      setSelectedCurrency(localStorage.getItem('selectedCurrency') || 'INR');

    };

    window.addEventListener('currencyChanged', handleStorage);

    window.addEventListener('storage', handleStorage);

    return () => {

      window.removeEventListener('currencyChanged', handleStorage);

      window.removeEventListener('storage', handleStorage);

    };

  }, []);

  useEffect(() => {

    const loadProduct = async () => {

      setLoading(true);

      try {

        const res = await api.get(`/products/${id}`, {

          params: { currency: selectedCurrency }

        });

        const productData = res.data?.data || res.data;

        const productStoreType = String(productData?.storeType || 'B2B').toUpperCase();

        if (isScopedStorefront && productStoreType !== storeType) {

          setProduct(null);

          setRelatedProducts([]);

          return;

        }

        setProduct(productData);

        const activeVariants = Array.isArray(productData?.variants)
          ? productData.variants.filter((variant) => variant && variant.isActive !== false)
          : [];
        setSelectedVariant(activeVariants[0] || null);

        try {

          const productsRes = await api.get('/products', { params: { currency: selectedCurrency } });

          const allProducts = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.data || [];

          const currentCategoryId = productData?.categoryId?._id || productData?.categoryId || '';

          const related = allProducts.filter((item) => {

            if (String(item._id) === String(productData._id)) return false;

            if (String(item.storeType || 'B2B').toUpperCase() !== productStoreType) return false;

            const itemCatId = item.categoryId?._id || item.categoryId || '';

            return currentCategoryId && itemCatId && String(currentCategoryId) === String(itemCatId);

          }).slice(0, 4);

          setRelatedProducts(related);

        } catch (err) {

          setRelatedProducts([]);

        }

      } catch (error) {

        console.error('Product loading error:', error);

        setProduct(null);

      } finally {

        setLoading(false);

      }

    };

    loadProduct();

    window.scrollTo({ top: 0, behavior: 'smooth' });

  }, [id, selectedCurrency, isScopedStorefront, storeType]);

  function getReferenceName(value) {

    if (!value) return '';

    if (typeof value === 'string' || typeof value === 'number') return String(value);

    return value.name || value.title || '';

  }

  const productImages = useMemo(() => {
    if (!product) return [];

    const images = [];
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        const url = typeof img === 'string' ? img : img?.url || img?.imageUrl || '';
        if (url && !images.some((image) => image.url === url)) {
          images.push({
            url,
            alt: typeof img === 'string' ? (product.name || 'Product image') : (img?.alt || product.name || 'Product image'),
            isPrimary: Boolean(img?.isPrimary),
            sortOrder: Number(img?.sortOrder) || 0,
          });
        }
      });
    }

    if (product.imageUrl && !images.some((image) => image.url === product.imageUrl)) {
      images.push({
        url: product.imageUrl,
        alt: product.name || 'Product image',
        isPrimary: images.length === 0,
        sortOrder: -1,
      });
    }

    return images.sort(
      (a, b) =>
        Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) ||
        a.sortOrder - b.sortOrder
    );
  }, [product]);

  const dynamicSpecifications = useMemo(() => {

    if (!product || !Array.isArray(product.specifications)) return [];

    return product.specifications.filter(s => s && String(s.name || '').trim() && s.value != null && String(s.value).trim());

  }, [product]);

  const getSpecificationIcon = (name) => {

    const norm = String(name || '').toLowerCase();

    if (norm.includes('material') || norm.includes('purity') || norm.includes('grade')) return FlaskConical;

    if (norm.includes('weight') || norm.includes('capacity')) return Package;

    return Settings;

  };

  // =========================================================

  // RESOLVED PRICE USING SMART ENGINE

  // =========================================================

// =========================================================

  // PRICE RESOLUTION

  // =========================================================

  const resolvedPrice = useMemo(
    () => resolveProductPrice(product, selectedVariant, selectedCurrency, quantity),
    [product, selectedCurrency, selectedVariant, quantity]
  );

  const getCurrencySymbol = (currency) => {

    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', AED: 'د.إ', SAR: '﷼', AUD: 'A$', CAD: 'C$' };

    return symbols[String(currency || 'INR').toUpperCase()] || `${String(currency || 'INR').toUpperCase()} `;

  };

  const formatPrice = (value) => {

    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '';

    return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  };

  const variants = Array.isArray(product?.variants)
    ? product.variants.filter((variant) => variant && variant.isActive !== false)
    : [];

  const variantOptions = selectedVariant?.options || selectedVariant?.attributes || {};

  const variantOptionEntries = Object.entries(variantOptions || {});

  const moq = Math.max(1, Number(selectedVariant?.moq ?? product?.moq) || 1);

  const availableStock = Math.max(0, Number(selectedVariant?.stock ?? product?.stock) || 0);

  const directPurchaseAllowed = selectedVariant?.isDirectPurchaseAllowed !== undefined ? selectedVariant.isDirectPurchaseAllowed : product?.isDirectPurchaseAllowed !== false;

  const canBuy = directPurchaseAllowed && resolvedPrice !== null && Number(resolvedPrice) > 0 && availableStock > 0 && product?.archived !== true && product?.published !== false;

  const handleBuy = () => {

    if (!canBuy) return;

    const safeQty = Math.max(moq, Number(quantity) || moq);

    if (availableStock > 0 && safeQty > availableStock) {

      alert(`Only ${availableStock} unit(s) available.`);

      return;

    }

    let cart = [];

    try {

      cart = JSON.parse(localStorage.getItem('cart') || '[]');

      if (!Array.isArray(cart)) cart = [];

    } catch {

      cart = [];

    }

    const variantId = selectedVariant?._id || selectedVariant?.id || '';

    const existing = cart.find(i => String(i._id) === String(product._id) && String(i.variantId || '') === String(variantId));

    const cartItem = {

      ...product,

      variantId,

      selectedVariant: selectedVariant || null,

      selectedCurrency,

      displayedUnitPrice: resolvedPrice,

      quantity: safeQty

    };

    if (existing) {

      existing.quantity += safeQty;

      existing.selectedCurrency = selectedCurrency;

      existing.displayedUnitPrice = resolvedPrice;

      existing.selectedVariant = selectedVariant || null;

    } else {

      cart.push(cartItem);

    }

    localStorage.setItem('cart', JSON.stringify(cart));

    window.dispatchEvent(new Event('cartUpdated'));

    alert('Product added to cart.');

  };

  if (loading) {

    return <div className="min-h-screen flex items-center justify-center bg-white text-slate-500">Loading product...</div>;

  }

  if (!product) {

    return (

      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">

        <h2 className="text-2xl font-bold text-slate-900">Product not found</h2>

        <Link to={storefrontPath} className="text-blue-600 font-medium">Back to Products</Link>

      </div>

    );

  }

  const categoryName = getReferenceName(product.category);

  const subcategoryName = getReferenceName(product.subcategory);

  return (

    <div className="min-h-screen bg-white text-slate-900">

      <div className="max-w-7xl mx-auto px-6 pt-8">

        <Link to={storefrontPath} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition">

          <ArrowLeft size={16} /> Back to Products

        </Link>

        <div className="mt-6 text-sm text-slate-400">

          Home / Products {categoryName && <> / <span className="text-slate-600">{categoryName}</span></>}

          {subcategoryName && <> / <span className="text-slate-600">{subcategoryName}</span></>}

          <> / <span className="text-slate-900 font-semibold">{product.name}</span></>

        </div>

      </div>

      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">

          <div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative">

              {productImages.length > 0 ? (

                <>

                  <img src={productImages[activeImage]?.url} alt={productImages[activeImage]?.alt || product.name} className="w-full h-full object-contain p-8" />

                  {productImages.length > 1 && (

                    <>

                      <button type="button" onClick={() => setActiveImage((activeImage - 1 + productImages.length) % productImages.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"><ChevronLeft size={20} /></button>

                      <button type="button" onClick={() => setActiveImage((activeImage + 1) % productImages.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"><ChevronRight size={20} /></button>

                    </>

                  )}

                </>

              ) : (

                <div className="flex flex-col items-center gap-3 text-slate-300"><Box size={60} strokeWidth={1.2} /><span>No Image Available</span></div>

              )}

            </div>

            {productImages.length > 1 && (

              <div className="mt-4 flex gap-3 overflow-x-auto">

                {productImages.map((image, index) => (

                  <button type="button" key={index} onClick={() => setActiveImage(index)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 ${activeImage === index ? 'border-blue-600' : 'border-slate-200'}`}>

                    <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />

                  </button>

                ))}

              </div>

            )}

          </div>

          <div className="flex flex-col">

            <div className="flex flex-wrap items-center gap-2 mb-4">

              {categoryName && <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase">{categoryName}</span>}

              {subcategoryName && <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">{subcategoryName}</span>}

              {product.sku && <span className="text-xs text-slate-400">SKU: {product.sku}</span>}

            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">{product.name}</h1>

            {(product.shortDescription || product.description) && (

              <p className="mt-6 text-lg leading-8 text-slate-600">{product.shortDescription || product.description}</p>

            )}

            <div className="mt-8">

              {resolvedPrice !== null && Number(resolvedPrice) > 0 ? (

                <div>

                  <span className="text-3xl font-bold text-slate-900">

                    {getCurrencySymbol(selectedCurrency)}{formatPrice(resolvedPrice)}

                  </span>

                  <span className="ml-2 text-sm text-slate-500">per unit</span>

                </div>

              ) : (

                <div className="text-2xl font-bold text-blue-700">Price on Request</div>

              )}

              {selectedCurrency && <p className="mt-1 text-xs text-slate-400">Currency: {selectedCurrency}</p>}

            </div>

            {variants.length > 0 && (

              <div className="mt-8 border border-slate-200 rounded-2xl p-5">

                <div className="flex items-center gap-2 mb-4"><Settings size={18} className="text-blue-600" /><h3 className="font-bold text-slate-900">Available Variants</h3></div>

                <div className="space-y-3">

                  {variants.map((variant, index) => {

                    const isSelected = selectedVariant === variant;

                    const label = variant.name || variant.title || `Variant ${index + 1}`;

                    return (

                      <button type="button" key={variant._id || index} onClick={() => { setSelectedVariant(variant); setQuantity(Math.max(Number(variant.moq || product.moq || 1), 1)); }} className={`w-full text-left rounded-xl border p-4 transition ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>

                        <div className="flex items-center justify-between gap-3"><span className="font-semibold">{label}</span>{variant.sku && <span className="text-xs text-slate-400">{variant.sku}</span>}</div>

                        {Object.keys(variant.attributes || {}).length > 0 && (

                          <p className="mt-2 text-xs text-slate-600">{Object.entries(variant.attributes).map(([key, value]) => `${key}: ${value}`).join(' · ')}</p>

                        )}

                        <p className="mt-2 text-xs font-medium text-slate-500">{Number(variant.stock) > 0 ? `${variant.stock} available` : 'Made to order / enquiry required'}</p>

                      </button>

                    );

                  })}

                </div>

              </div>

            )}

            <div className="mt-8 border-t border-slate-200 pt-8">

              <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500">

                <span>MOQ: <strong className="text-slate-800">{moq}</strong></span>

                <span>•</span>

                <span>{availableStock > 0 ? <><strong className="text-emerald-700">In stock</strong> ({availableStock})</> : <strong className="text-amber-700">Made to order / subject to confirmation</strong>}</span>

              </div>

              {canBuy ? (

                <div className="flex flex-col sm:flex-row gap-3">

                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">

                    <button type="button" onClick={() => setQuantity(Math.max(moq, quantity - 1))} className="px-4 py-3 hover:bg-slate-100"><Minus size={16} /></button>

                    <span className="px-5 font-semibold min-w-[65px] text-center">{quantity}</span>

                    <button type="button" onClick={() => setQuantity(Math.min(availableStock || quantity + 1, quantity + 1))} className="px-4 py-3 hover:bg-slate-100"><Plus size={16} /></button>

                  </div>

                  <button type="button" onClick={handleBuy} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-3 transition">

                    <ShoppingCart size={18} /> Add to Cart

                  </button>

                </div>

              ) : (

                <Link to={`/contact?product=${encodeURIComponent(product.name)}`} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-4 transition">

                  <MessageSquareQuote size={18} /> Request a Quote

                </Link>

              )}

            </div>

          </div>

        </div>

      </section>

      {(dynamicSpecifications.length > 0 || product.features?.length > 0 || product.applications?.length > 0 || product.documents?.length > 0) && (

        <section className="max-w-7xl mx-auto px-6 pb-8 grid gap-8 lg:grid-cols-2">

          {dynamicSpecifications.length > 0 && (

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">

              <h2 className="text-xl font-bold text-slate-900">Technical specifications</h2>

              <dl className="mt-5 divide-y divide-slate-200">

                {dynamicSpecifications.map((specification, index) => (

                  <div key={`${specification.name}-${index}`} className="flex justify-between gap-6 py-3 text-sm">

                    <dt className="font-medium text-slate-500">{specification.name}</dt>

                    <dd className="text-right font-semibold text-slate-900">{specification.value}{specification.unit ? ` ${specification.unit}` : ''}</dd>

                  </div>

                ))}

              </dl>

            </article>

          )}

          <div className="space-y-8">

            {product.features?.length > 0 && (

              <article className="rounded-2xl border border-slate-200 bg-white p-6">

                <h2 className="text-xl font-bold text-slate-900">Key features</h2>

                <ul className="mt-4 space-y-3 text-sm text-slate-600">

                  {product.features.filter(Boolean).map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />{feature}</li>)}

                </ul>

              </article>

            )}

            {product.applications?.length > 0 && (

              <article className="rounded-2xl border border-slate-200 bg-white p-6">

                <h2 className="text-xl font-bold text-slate-900">Applications</h2>

                <div className="mt-4 flex flex-wrap gap-2">

                  {product.applications.filter(Boolean).map((application) => <span key={application} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">{application}</span>)}

                </div>

              </article>

            )}

            {product.documents?.length > 0 && (

              <article className="rounded-2xl border border-slate-200 bg-white p-6">

                <h2 className="text-xl font-bold text-slate-900">Documents</h2>

                <div className="mt-4 space-y-2">

                  {product.documents.filter((document) => document?.url).map((document, index) => (

                    <a key={`${document.url}-${index}`} href={document.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-50">

                      <span className="flex items-center gap-2 min-w-0"><FileText size={17} className="shrink-0" /><span className="truncate">{document.name || document.type || 'Product document'}</span></span>

                      <span className="text-xs">Open</span>

                    </a>

                  ))}

                </div>

              </article>

            )}

          </div>

        </section>

      )}

      {/* RELATED PRODUCTS */}

      {relatedProducts.length > 0 && (

        <section className="max-w-7xl mx-auto px-6 py-16">

          <h2 className="text-2xl font-bold text-slate-900 mb-8">Related Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {relatedProducts.map((item) => {

              const itemSmartPrice = resolveProductPrice(item, null, selectedCurrency);

              return (

                <Link key={item._id} to={`${storefrontPath}/product/${item._id}`} className="group border border-slate-200 rounded-2xl p-4 bg-white hover:border-blue-400 shadow-xs">

                  <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center">

                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" /> : <Box size={45} className="text-slate-300" />}

                  </div>

                  <h3 className="mt-4 font-bold text-sm text-slate-900 line-clamp-2">{item.name}</h3>

                  <div className="mt-4 pt-3 border-t border-slate-100">

                    <span className="text-sm font-bold text-blue-600">{getCurrencySymbol(selectedCurrency)}{formatPrice(itemSmartPrice)}</span>

                  </div>

                </Link>

              );

            })}

          </div>

        </section>

      )}

    </div>

  );

};

export default ProductDetailPage;
