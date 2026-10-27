import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  Package,
  PlusCircle,
  FolderPlus,
  Trash2,
  Pencil,
  MessageSquareQuote,
  LogOut,
  Image as ImageIcon,
  Loader2,
  X,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings2,
   Archive, ArchiveRestore,
  FileText,
  Upload
} from 'lucide-react';

const API_BASE_URL = '';

const EMPTY_SPEC = {
  name: '',
  value: ''
};


const EMPTY_VARIANT = {
  name: '',
  sku: '',
  price: '',
  stock: 0,
  imageUrl: '',
  isActive: true,
  attributes: {}
};

const EMPTY_TIER = {
  minQuantity: 1,
  maxQuantity: '',
  price: '',
  currency: 'INR'
};

const EMPTY_CURRENCY_PRICING = {
  mode: 'auto',
  multiplier: 1,
  overridePrice: ''
};

const EMPTY_IMAGE = {
  url: '',
  alt: '',
  sortOrder: 0,
  isPrimary: false
};

const EMPTY_CATEGORY_FIELD = {
  name: '',
  type: 'text',
  options: [],
  required: false,
  unit: ''
};

const EMPTY_CATEGORY = {
  name: '',
  storeType: 'B2B',
  description: '',
  imageUrl: '',
  parent: '',
  isActive: true,
  sortOrder: 0,
  specificationFields: []
};

const EMPTY_PRODUCT = {
  sku: '',
  name: '',
  storeType: 'B2B',

  categoryId: '',
  subcategoryId: '',

  category: '',
  subcategory: '',

  price: '',
  baseCurrency: 'INR',

  currencyPrices: {},
  currencyPricing: {},

  pricing: {
    pricingMode: 'base',
    allowCurrencyConversion: true,
    allowQuantityPricing: false,
    quantityTiers: []
  },

  moq: 1,
  stock: 0,

  isDirectPurchaseAllowed: true,
  archived: false,

  featured: false,
  published: true,

  imageUrl: '',
  images: [],

  shortDescription: '',
  description: '',

  specifications: [],
  variants: [],

  features: [],
  applications: [],
  documents: [],

  seo: {
    title: '',
    description: '',
    keywords: '',
    slug: ''
  },

  relatedProducts: [],

  metadata: {}
};

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const clone = (value) =>
  JSON.parse(JSON.stringify(value));

const numberOrZero = (value) => {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
};

const integerOr = (value, fallback = 0) => {
  const n = Number(value);

  return Number.isInteger(n) ? n : fallback;
};


const inputClass =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500';

const textareaClass =
  `${inputClass} min-h-[100px] resize-y`;

/*
 * IMPORTANT:
 * Keep these components outside AdminPage.
 * Defining them inside AdminPage creates a new component identity
 * on every state update and makes form inputs lose focus.
 */
const Section = ({
  id,
  title,
  children,
  right,
  open,
  onToggle
}) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/60 transition"
    >
      <div className="flex items-center gap-3">
        {open ? (
          <ChevronDown size={18} />
        ) : (
          <ChevronRight size={18} />
        )}
        <span className="font-semibold text-white">
          {title}
        </span>
      </div>
      {right}
    </button>

    {open && (
      <div className="p-5 border-t border-slate-800">
        {children}
      </div>
    )}
  </div>
);

const Field = ({
  label,
  children,
  className = ''
}) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
      {label}
    </label>
    {children}
  </div>
);

const ProductSection = ({
  id,
  title,
  description,
  children,
  right,
  open,
  onToggle,
}) => (
  <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/60 transition"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
          {open ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
        </span>

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {right}
    </button>

    {open && (
      <div className="p-5 border-t border-slate-800">{children}</div>
    )}
  </section>
);

const ProductField = ({
  label,
  hint,
  required,
  children,
  className = '',
}) => (
  <div className={className}>
    <label className="block mb-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </span>
      {hint && (
        <span className="block text-[11px] text-slate-600 mt-1">{hint}</span>
      )}
    </label>
    {children}
  </div>
);

const ProductAddButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
  >
    <Plus size={14} />
    {children}
  </button>
);

const ProductRemoveButton = ({ onClick, title = 'Remove' }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
  >
    <Trash2 size={16} />
  </button>
);

const ProductAdminForm = ({
  editingProduct,
  productForm,
  products = [],
  rootCategories = [],
  selectedSubcategories = [],
  activeCurrencies = [],
  saving = false,
  uploading = false,
  expandedSections = {},

  metadataText = '{}',
  setMetadataText,

  onSubmit,
  onCancel,

  updateProduct,
  updateNestedProduct,
  handleProductCategoryChange,
  handleProductSubcategoryChange,

  syncCurrencyRates,
  addCurrencyPricing,
  updateCurrencyPricing,
  removeCurrencyPricing,
  updateCurrencyPrice,
  removeCurrencyPrice,

  addQuantityTier,
  updateQuantityTier,
  removeQuantityTier,

  handleMainImageUpload,
  addImage,
  updateImage,
  removeImage,

  addSpecification,
  updateSpecification,
  removeSpecification,

  addVariant,
  updateVariant,
  removeVariant,
  addVariantAttribute,
  updateVariantAttribute,
  removeVariantAttribute,

  addFeature,
  updateFeature,
  removeFeature,
  addApplication,
  updateApplication,
  removeApplication,

  addDocument,
  updateDocument,
  removeDocument,

  addRelatedProduct,
  removeRelatedProduct,

  toggleSection,
}) => {
  const safeArray = (value) => (Array.isArray(value) ? value : []);

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10';

  const textareaClass =
    `${inputClass} min-h-[110px] resize-y`;

  const supportedCurrencyCodes = ['INR', 'USD', 'EUR', 'GBP'];

  const activeCurrencyList = supportedCurrencyCodes.map((code) => {
    const apiCurrency = activeCurrencies.find(
      (item) =>
        String(item?.code || '').trim().toUpperCase() === code
    );

    const fallback = {
      INR: { symbol: '₹', rateFromBase: 1 },
      USD: { symbol: '$', rateFromBase: null },
      EUR: { symbol: '€', rateFromBase: null },
      GBP: { symbol: '£', rateFromBase: null },
    }[code];

    return {
      code,
      symbol: apiCurrency?.symbol || fallback.symbol,
      rateFromBase:
        code === 'INR'
          ? 1
          : apiCurrency?.rateFromBase ?? fallback.rateFromBase,
      isActive: apiCurrency?.isActive !== false,
    };
  }).filter((item) => item.isActive);

  const getCurrency = (code) =>
    activeCurrencyList.find(
      (item) =>
        String(item?.code || '').toUpperCase() ===
        String(code || '').toUpperCase()
    );

  const formatMoney = (value, code = productForm.baseCurrency || 'INR') => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';

    const currency = getCurrency(code);
    return `${currency?.symbol || ''}${n.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })} ${code}`;
  };

  /**
   * Price range preview.
   *
   * It is deliberately derived from the prices already present in the form.
   * Nothing new is written to Mongo just for the preview.
   */
  const priceRange = useMemo(() => {
    const prices = [];

    const basePrice = Number(productForm.price);
    if (
      productForm.price !== '' &&
      productForm.price !== null &&
      productForm.price !== undefined &&
      Number.isFinite(basePrice) &&
      basePrice >= 0
    ) {
      prices.push(basePrice);
    }

    safeArray(productForm.variants).forEach((variant) => {
      const price = Number(variant?.price);
      if (
        variant?.price !== '' &&
        variant?.price !== null &&
        variant?.price !== undefined &&
        Number.isFinite(price) &&
        price >= 0
      ) {
        prices.push(price);
      }
    });

    safeArray(productForm.pricing?.quantityTiers).forEach((tier) => {
      const price = Number(tier?.price);
      if (Number.isFinite(price) && price >= 0) {
        prices.push(price);
      }
    });

    if (!prices.length) {
      return { min: null, max: null };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [
    productForm.price,
    productForm.variants,
    productForm.pricing?.quantityTiers,
  ]);

  const currencyPreview = useMemo(() => {
    const base = Number(productForm.price);
    if (!Number.isFinite(base) || base < 0) return [];

    return Object.entries(productForm.currencyPricing || {}).map(
      ([rawCode, config]) => {
        const code = String(rawCode).toUpperCase();
        const currency = getCurrency(code);
        const rate = Number(currency?.rateFromBase);
        const multiplier = Number(config?.multiplier ?? 1);

        const autoAmount =
          Number.isFinite(rate) && rate > 0 ? base * rate : null;

        const multiplierAmount =
          autoAmount !== null
            ? autoAmount *
              (Number.isFinite(multiplier) ? multiplier : 1)
            : null;

        let preview = null;

        if (config?.mode === 'override') {
          const override = Number(
            config?.overridePrice ?? config?.price
          );
          preview = Number.isFinite(override) ? override : null;
        } else if (config?.mode === 'multiplier') {
          preview = multiplierAmount;
        } else {
          preview = autoAmount;
        }

        return {
          code,
          symbol: currency?.symbol || '',
          rate,
          preview,
        };
      }
    );
  }, [
    productForm.price,
    productForm.currencyPricing,
    activeCurrencyList,
  ]);

  const sectionOpen = (id) => expandedSections[id] ?? true;

  return (
    <form onSubmit={onSubmit} className="max-w-7xl space-y-5 pb-28">
      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase tracking-wider">
              Product Catalog
            </span>

            {editingProduct && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                Editing
              </span>
            )}
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            {editingProduct ? 'Edit Product' : 'Create Product'}
          </h1>

          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Manage product information, pricing, specifications, variants,
            media, SEO and all dynamic catalog data from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium"
        >
          <X size={16} />
          Cancel
        </button>
      </div>

      {/* QUICK PRICE SUMMARY */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-400">
            Base Price
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {formatMoney(productForm.price)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Base currency: {productForm.baseCurrency || 'INR'}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
            Product Price Range
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {priceRange.min !== null
              ? `${formatMoney(priceRange.min)}`
              : '—'}
            {priceRange.min !== null &&
              priceRange.max !== null &&
              priceRange.min !== priceRange.max && (
                <>
                  <span className="text-slate-500 mx-1">–</span>
                  {formatMoney(priceRange.max)}
                </>
              )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Auto-derived from base, variant and quantity-tier prices.
          </div>
        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-400">
            Dynamic Factors
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {safeArray(productForm.variants).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Variants / capacity / purity / size / grade combinations.
          </div>
        </div>
      </div>

      {/* BASIC INFORMATION */}
      <ProductSection
        id="basic"
        title="Basic Product Information"
        description="Core identity, category, inventory and publishing controls."
        right={<Settings2 size={17} className="text-blue-400" />}
        open={sectionOpen('basic')}
        onToggle={toggleSection}
      >
        <div className="grid lg:grid-cols-2 gap-5">
          <ProductField label="SKU" required hint="Unique product code used internally.">
            <input
              className={inputClass}
              value={productForm.sku || ''}
              onChange={(e) => updateProduct('sku', e.target.value)}
              placeholder="Example: BSC-ALUMINA-001"
              required
            />
          </ProductField>

          <ProductField
            label="Product Name"
            required
            hint="Customer-facing product name."
          >
            <input
              className={inputClass}
              value={productForm.name || ''}
              onChange={(e) => updateProduct('name', e.target.value)}
              placeholder="Example: High Purity Alumina Crucible"
              required
            />
          </ProductField>

          <ProductField label="Storefront" required hint="Choose where customers will see this product.">
            <select
              className={inputClass}
              value={productForm.storeType || 'B2B'}
              onChange={(e) => {
                updateProduct('storeType', e.target.value);
                handleProductCategoryChange('');
              }}
            >
              <option value="B2B">Scientific Store (B2B)</option>
              <option value="B2C">Lifestyle Store (B2C)</option>
            </select>
          </ProductField>

          <ProductField label="Category">
            <select
              className={inputClass}
              value={productForm.categoryId || ''}
              onChange={(e) =>
                handleProductCategoryChange(e.target.value)
              }
            >
              <option value="">Select category</option>
              {rootCategories.filter((category) => String(category.storeType || 'B2B').toUpperCase() === String(productForm.storeType || 'B2B').toUpperCase()).map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </ProductField>

          <ProductField label="Subcategory">
            <select
              className={inputClass}
              value={productForm.subcategoryId || ''}
              onChange={(e) =>
                handleProductSubcategoryChange(e.target.value)
              }
              disabled={!productForm.categoryId}
            >
              <option value="">No subcategory</option>
              {selectedSubcategories.map((subcategory) => (
                <option
                  key={subcategory._id}
                  value={subcategory._id}
                >
                  {subcategory.name}
                </option>
              ))}
            </select>
          </ProductField>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-5">
          <ProductField
            label="Base Price"
            hint="Keep the master/base selling price in INR."
          >
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={productForm.price ?? ''}
              onChange={(e) => updateProduct('price', e.target.value)}
              placeholder="0.00"
            />
          </ProductField>

          <ProductField
            label="Base Currency"
            hint="Fixed master currency. All dynamic currency prices originate from INR."
          >
            <div className={`${inputClass} flex items-center justify-between`}>
              <span className="font-semibold text-white">INR ₹</span>
              <span className="text-[11px] text-emerald-400">MASTER</span>
            </div>
          </ProductField>

          <ProductField label="MOQ" hint="Minimum order quantity.">
            <input
              type="number"
              min="1"
              className={inputClass}
              value={productForm.moq ?? 1}
              onChange={(e) => updateProduct('moq', e.target.value)}
            />
          </ProductField>

          <ProductField label="Stock" hint="Current available quantity.">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={productForm.stock ?? 0}
              onChange={(e) => updateProduct('stock', e.target.value)}
            />
          </ProductField>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {[
            ['isDirectPurchaseAllowed', 'Direct Purchase'],
            ['published', 'Published'],
            ['featured', 'Featured'],
            ['archived', 'Archived'],
          ].map(([field, label]) => (
            <label
              key={field}
              className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Boolean(productForm[field])}
                onChange={(e) =>
                  updateProduct(field, e.target.checked)
                }
              />
              <span className="text-slate-200">{label}</span>
            </label>
          ))}
        </div>
      </ProductSection>

      {/* PRICING */}
      <ProductSection
        id="pricing"
        title="Pricing & Currency Rules"
        description="INR is the base. Other currencies can use live FX, multiplier or exact override."
        open={sectionOpen('pricing')}
        onToggle={toggleSection}
      >
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 mb-5">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              ₹
            </div>
            <div>
              <div className="font-semibold text-blue-100">
                Base currency pricing logic
              </div>
              <p className="text-xs text-blue-300/70 mt-1 leading-5">
                Base price stays in INR. For USD / EUR / GBP you can use
                Auto FX, FX × Multiplier, or Exact Override independently.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <ProductField label="Pricing Mode">
            <select
              className={inputClass}
              value={productForm.pricing?.pricingMode || 'base'}
              onChange={(e) =>
                updateNestedProduct(
                  'pricing',
                  'pricingMode',
                  e.target.value
                )
              }
            >
              <option value="base">Base Price</option>
              <option value="currency">Currency Overrides</option>
              <option value="rule">Pricing Rules</option>
            </select>
          </ProductField>

          <label className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm self-end">
            <input
              type="checkbox"
              checked={
                productForm.pricing?.allowCurrencyConversion !== false
              }
              onChange={(e) =>
                updateNestedProduct(
                  'pricing',
                  'allowCurrencyConversion',
                  e.target.checked
                )
              }
            />
            Allow Currency Conversion
          </label>

          <label className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm self-end">
            <input
              type="checkbox"
              checked={
                productForm.pricing?.allowQuantityPricing || false
              }
              onChange={(e) =>
                updateNestedProduct(
                  'pricing',
                  'allowQuantityPricing',
                  e.target.checked
                )
              }
            />
            Quantity Pricing
          </label>
        </div>

        <div className="mt-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">
                Currency Pricing Strategy
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Only the four supported currencies are shown: INR, USD, EUR and GBP.
              </p>
            </div>

            <button
              type="button"
              onClick={syncCurrencyRates}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Refresh FX Rates
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {Object.entries(productForm.currencyPricing || {})
              .filter(([code]) => String(code).trim())
              .map(([rawCode, config]) => {
                const code = String(rawCode).toUpperCase();
                const currency = getCurrency(code);
                const rate = Number(currency?.rateFromBase);
                const base = Number(productForm.price);
                const multiplier = Number(config?.multiplier ?? 1);

                const autoAmount =
                  Number.isFinite(rate) && rate > 0 && Number.isFinite(base)
                    ? base * rate
                    : null;

                const multiplierAmount =
                  autoAmount !== null
                    ? autoAmount *
                      (Number.isFinite(multiplier) ? multiplier : 1)
                    : null;

                let preview = null;

                if (config?.mode === 'override') {
                  const override = Number(
                    config?.overridePrice ?? config?.price
                  );
                  preview = Number.isFinite(override) ? override : null;
                } else if (config?.mode === 'multiplier') {
                  preview = multiplierAmount;
                } else {
                  preview = autoAmount;
                }

                return (
                  <div
                    key={code}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="font-bold text-white">
                          {code} {currency?.symbol || ''}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          1 {productForm.baseCurrency || 'INR'} ={' '}
                          {Number.isFinite(rate) ? rate : '—'} {code}
                        </div>
                      </div>

                      <ProductRemoveButton
                        title={`Remove ${code}`}
                        onClick={() => removeCurrencyPricing(code)}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <ProductField label="Pricing Mode">
                        <select
                          className={inputClass}
                          value={config?.mode || 'auto'}
                          onChange={(e) =>
                            updateCurrencyPricing(
                              code,
                              'mode',
                              e.target.value
                            )
                          }
                        >
                          <option value="auto">Auto FX Rate</option>
                          <option value="multiplier">
                            FX × Multiplier
                          </option>
                          <option value="override">
                            Exact Override
                          </option>
                        </select>
                      </ProductField>

                      {config?.mode === 'override' ? (
                        <ProductField label="Exact Selling Price">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={inputClass}
                            value={
                              config?.overridePrice ??
                              config?.price ??
                              ''
                            }
                            onChange={(e) =>
                              updateCurrencyPricing(
                                code,
                                'overridePrice',
                                e.target.value
                              )
                            }
                            placeholder={`Price in ${code}`}
                          />
                        </ProductField>
                      ) : (
                        <ProductField
                          label="Multiplier"
                          hint={
                            config?.mode === 'multiplier'
                              ? 'Example: 1.08 = 8% above FX result.'
                              : 'Used only in multiplier mode.'
                          }
                        >
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={inputClass}
                            value={config?.multiplier ?? 1}
                            disabled={config?.mode !== 'multiplier'}
                            onChange={(e) =>
                              updateCurrencyPricing(
                                code,
                                'multiplier',
                                e.target.value
                              )
                            }
                          />
                        </ProductField>
                      )}
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                        Live Preview
                      </div>
                      <div className="text-lg font-bold text-white mt-1">
                        {preview !== null
                          ? formatMoney(preview, code)
                          : 'Rate unavailable'}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {activeCurrencyList
              .filter(
                (currency) =>
                  !productForm.currencyPricing?.[currency.code]
              )
              .map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() =>
                    addCurrencyPricing(currency.code)
                  }
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  + {currency.code}
                </button>
              ))}
          </div>

          {currencyPreview.length > 0 && (
            <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currencyPreview.map((item) => (
                <div
                  key={item.code}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <div className="text-[10px] uppercase text-slate-600 font-semibold">
                    {item.code}
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {item.preview !== null
                      ? formatMoney(item.preview, item.code)
                      : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legacy compatibility */}
        {Object.keys(productForm.currencyPrices || {}).length > 0 && (
          <div className="mt-7 pt-5 border-t border-slate-800">
            <h3 className="font-semibold text-white">
              Legacy Exact Currency Overrides
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Existing currencyPrices are kept for compatibility with older products.
            </p>

            <div className="space-y-2 mt-4">
              {Object.entries(productForm.currencyPrices || {}).map(
                ([code, value]) => (
                  <div
                    key={code}
                    className="grid grid-cols-[100px_1fr_auto] gap-2"
                  >
                    <div className="flex items-center px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold">
                      {code}
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="0.000001"
                      className={inputClass}
                      value={value}
                      onChange={(e) =>
                        updateCurrencyPrice(
                          code,
                          e.target.value
                        )
                      }
                    />

                    <ProductRemoveButton
                      onClick={() =>
                        removeCurrencyPrice(code)
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </ProductSection>

      {/* QUANTITY PRICING */}
      <ProductSection
        id="quantityPricing"
        title="Quantity Tier Pricing"
        description="Create as many quantity breaks as you need."
        right={<ProductAddButton onClick={addQuantityTier}>Add Tier</ProductAddButton>}
        open={sectionOpen('quantityPricing')}
        onToggle={toggleSection}
      >
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_1fr_1.2fr_1fr_auto] gap-3 bg-slate-950 px-4 py-3 text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
            <div>Min Quantity</div>
            <div>Max Quantity</div>
            <div>Unit Price</div>
            <div>Currency</div>
            <div />
          </div>

          <div className="p-3 space-y-3">
            {safeArray(productForm.pricing?.quantityTiers).map(
              (tier, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-[1fr_1fr_1.2fr_1fr_auto] gap-3 items-end"
                >
                  <ProductField label="Min Quantity">
                    <input
                      type="number"
                      min="1"
                      className={inputClass}
                      value={tier.minQuantity ?? 1}
                      onChange={(e) =>
                        updateQuantityTier(
                          index,
                          'minQuantity',
                          e.target.value
                        )
                      }
                    />
                  </ProductField>

                  <ProductField
                    label="Max Quantity"
                    hint="Leave empty for no upper limit."
                  >
                    <input
                      type="number"
                      min="1"
                      className={inputClass}
                      value={tier.maxQuantity ?? ''}
                      onChange={(e) =>
                        updateQuantityTier(
                          index,
                          'maxQuantity',
                          e.target.value
                        )
                      }
                      placeholder="∞"
                    />
                  </ProductField>

                  <ProductField label="Unit Price">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={tier.price ?? ''}
                      onChange={(e) =>
                        updateQuantityTier(
                          index,
                          'price',
                          e.target.value
                        )
                      }
                    />
                  </ProductField>

                  <ProductField label="Currency">
                    <select
                      className={inputClass}
                      value={
                        tier.currency ||
                        productForm.baseCurrency ||
                        'INR'
                      }
                      onChange={(e) =>
                        updateQuantityTier(
                          index,
                          'currency',
                          e.target.value
                        )
                      }
                    >
                      {activeCurrencyList.map((currency) => (
                        <option
                          key={currency.code}
                          value={currency.code}
                        >
                          {currency.code}
                        </option>
                      ))}
                    </select>
                  </ProductField>

                  <ProductRemoveButton
                    onClick={() => removeQuantityTier(index)}
                  />
                </div>
              )
            )}

            {safeArray(productForm.pricing?.quantityTiers).length ===
              0 && (
              <div className="py-8 text-center text-sm text-slate-600">
                No quantity tiers. Click “Add Tier” to create wholesale pricing.
              </div>
            )}
          </div>
        </div>
      </ProductSection>

      {/* MEDIA */}
      <ProductSection
        id="media"
        title="Product Images & Documents"
        description="Main image, gallery, alt text, ordering and product documents."
        open={sectionOpen('media')}
        onToggle={toggleSection}
      >
        <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-5">
          <ProductField
            label="Main Image URL"
            hint="The main product image shown on listing/detail pages."
          >
            <input
              className={inputClass}
              value={productForm.imageUrl || ''}
              onChange={(e) =>
                updateProduct('imageUrl', e.target.value)
              }
              placeholder="https://..."
            />
          </ProductField>

          <ProductField label="Upload Main Image">
            <label className="flex items-center gap-3 w-full min-h-[48px] px-4 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-blue-500 cursor-pointer transition">
              <Upload size={17} className="text-blue-400" />
              <span className="text-sm text-slate-400">
                {uploading ? 'Uploading...' : 'Choose image'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </ProductField>
        </div>

        {productForm.imageUrl && (
          <div className="mt-5 flex items-start gap-4 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <img
              src={productForm.imageUrl}
              alt={productForm.name || 'Product'}
              className="w-28 h-28 object-cover rounded-xl border border-slate-800"
            />
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">
                Current Main Image
              </div>
              <div className="text-sm text-slate-300 mt-1 break-all">
                {productForm.imageUrl}
              </div>
            </div>
          </div>
        )}

        <div className="mt-7">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-white">Product Gallery</h3>
              <p className="text-xs text-slate-500 mt-1">
                Add unlimited images. One image can be marked Primary.
              </p>
            </div>

            <ProductAddButton onClick={addImage}>Add Image</ProductAddButton>
          </div>

          <div className="space-y-3">
            {safeArray(productForm.images).map((image, index) => (
              <div
                key={index}
                className="grid lg:grid-cols-[90px_1.5fr_1fr_100px_auto_auto] gap-3 items-center p-3 rounded-xl bg-slate-950 border border-slate-800"
              >
                <div className="w-[90px] h-[70px] rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.alt || productForm.name || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon
                      size={20}
                      className="text-slate-700"
                    />
                  )}
                </div>

                <ProductField label="Image URL">
                  <input
                    className={inputClass}
                    value={image.url || ''}
                    onChange={(e) =>
                      updateImage(index, 'url', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </ProductField>

                <ProductField label="Alt Text">
                  <input
                    className={inputClass}
                    value={image.alt || ''}
                    onChange={(e) =>
                      updateImage(index, 'alt', e.target.value)
                    }
                    placeholder="Product image description"
                  />
                </ProductField>

                <ProductField label="Sort Order">
                  <input
                    type="number"
                    className={inputClass}
                    value={image.sortOrder ?? index}
                    onChange={(e) =>
                      updateImage(
                        index,
                        'sortOrder',
                        e.target.value
                      )
                    }
                  />
                </ProductField>

                <label className="flex items-center gap-2 text-xs text-slate-400 px-2">
                  <input
                    type="checkbox"
                    checked={Boolean(image.isPrimary)}
                    onChange={(e) =>
                      updateImage(
                        index,
                        'isPrimary',
                        e.target.checked
                      )
                    }
                  />
                  Primary
                </label>

                <ProductRemoveButton
                  onClick={() => removeImage(index)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-white">Documents</h3>
              <p className="text-xs text-slate-500 mt-1">
                Datasheets, manuals, certificates and PDFs.
              </p>
            </div>

            <ProductAddButton onClick={addDocument}>
              Add Document
            </ProductAddButton>
          </div>

          <div className="space-y-3">
            {safeArray(productForm.documents).map(
              (document, index) => (
                <div
                  key={index}
                  className="grid lg:grid-cols-[1fr_2fr_1fr_auto] gap-3 items-end p-3 rounded-xl bg-slate-950 border border-slate-800"
                >
                  <ProductField label="Document Name">
                    <input
                      className={inputClass}
                      value={document.name || ''}
                      onChange={(e) =>
                        updateDocument(
                          index,
                          'name',
                          e.target.value
                        )
                      }
                      placeholder="Technical Datasheet"
                    />
                  </ProductField>

                  <ProductField label="Document URL">
                    <input
                      className={inputClass}
                      value={document.url || ''}
                      onChange={(e) =>
                        updateDocument(
                          index,
                          'url',
                          e.target.value
                        )
                      }
                      placeholder="https://..."
                    />
                  </ProductField>

                  <ProductField label="Type">
                    <input
                      className={inputClass}
                      value={document.type || ''}
                      onChange={(e) =>
                        updateDocument(
                          index,
                          'type',
                          e.target.value
                        )
                      }
                      placeholder="PDF / Datasheet / Manual"
                    />
                  </ProductField>

                  <ProductRemoveButton
                    onClick={() => removeDocument(index)}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </ProductSection>

      {/* SPECIFICATIONS */}
      <ProductSection
        id="specifications"
        title="Dynamic Specifications"
        description="No hardcoded fields. Add Material, Purity, Capacity, Size, Temperature or any other specification."
        right={<ProductAddButton onClick={addSpecification}>Add Specification</ProductAddButton>}
        open={sectionOpen('specifications')}
        onToggle={toggleSection}
      >
        <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 mb-4">
          <div className="text-xs font-semibold text-blue-300">
            How to use this
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-5">
            Example: Material → High Alumina, Purity → 99.8%, Capacity →
            250 ml, Maximum Temperature → 1750°C. You can add as many rows as
            required for each product.
          </p>
        </div>

        <div className="space-y-3">
          {safeArray(productForm.specifications).map(
            (spec, index) => (
              <div
                key={index}
                className="grid lg:grid-cols-[1fr_2fr_auto] gap-3 items-end p-3 rounded-xl bg-slate-950 border border-slate-800"
              >
                <ProductField label="Specification Name">
                  <input
                    className={inputClass}
                    placeholder="Purity / Capacity / Material"
                    value={spec.name || ''}
                    onChange={(e) =>
                      updateSpecification(
                        index,
                        'name',
                        e.target.value
                      )
                    }
                  />
                </ProductField>

                <ProductField label="Specification Value">
                  <input
                    className={inputClass}
                    placeholder="99.8% / 250 ml / High Alumina"
                    value={spec.value || ''}
                    onChange={(e) =>
                      updateSpecification(
                        index,
                        'value',
                        e.target.value
                      )
                    }
                  />
                </ProductField>

                <ProductRemoveButton
                  onClick={() => removeSpecification(index)}
                />
              </div>
            )
          )}

          {safeArray(productForm.specifications).length === 0 && (
            <div className="py-8 text-center text-sm text-slate-600">
              No specifications yet. Add your first dynamic specification.
            </div>
          )}
        </div>
      </ProductSection>

      {/* VARIANTS / PRICING FACTORS */}
      <ProductSection
        id="variants"
        title="Variants & Dynamic Pricing Factors"
        description="Use variants for capacity, purity, size, grade or any combination that changes price."
        right={<ProductAddButton onClick={addVariant}>Add Variant</ProductAddButton>}
        open={sectionOpen('variants')}
        onToggle={toggleSection}
      >
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-5">
          <div className="text-xs font-semibold text-amber-300">
            Example for your ceramic products
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-5">
            Variant #1 → Capacity: 5 ml, Purity: AC998, Price: ₹250.
            Variant #2 → Capacity: 1000 ml, Purity: AC998, Price: ₹16,005.
            Add another variant for any new capacity, purity, diameter, size,
            grade or other price-changing factor.
          </p>
        </div>

        <div className="space-y-5">
          {safeArray(productForm.variants).map(
            (variant, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-white">
                        Variant #{index + 1}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Each variant can carry its own price, stock and attributes.
                    </p>
                  </div>

                  <ProductRemoveButton
                    onClick={() => removeVariant(index)}
                  />
                </div>

                <div className="grid lg:grid-cols-4 gap-3">
                  <ProductField label="Variant Name">
                    <input
                      className={inputClass}
                      placeholder="250 ml / AC998 / 50 mm"
                      value={variant.name || ''}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          'name',
                          e.target.value
                        )
                      }
                    />
                  </ProductField>

                  <ProductField label="Variant SKU">
                    <input
                      className={inputClass}
                      placeholder="BSC-AL-250-AC998"
                      value={variant.sku || ''}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          'sku',
                          e.target.value
                        )
                      }
                    />
                  </ProductField>

                  <ProductField label="Variant Price">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      placeholder="250.00"
                      value={variant.price ?? ''}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          'price',
                          e.target.value
                        )
                      }
                    />
                  </ProductField>

                  <ProductField label="Variant Stock">
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      placeholder="0"
                      value={variant.stock ?? 0}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          'stock',
                          e.target.value
                        )
                      }
                    />
                  </ProductField>
                </div>

                <div className="mt-4">
                  <ProductField label="Variant Image URL">
                    <input
                      className={inputClass}
                      placeholder="https://..."
                      value={variant.imageUrl || ''}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          'imageUrl',
                          e.target.value
                        )
                      }
                    />
                  </ProductField>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-800">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Pricing Factors / Variant Attributes
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Add unlimited key/value factors such as Capacity, Purity,
                        Grade, Size, Diameter, Material, Finish, etc.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addVariantAttribute(index)
                      }
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                    >
                      + Add Factor
                    </button>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(
                      variant.attributes || {}
                    ).map(([key, value]) => (
                      <div
                        key={`${index}-${key}`}
                        className="grid sm:grid-cols-[1fr_1fr_auto] gap-2"
                      >
                        <input
                          className={inputClass}
                          placeholder="Factor name — Capacity / Purity"
                          value={key}
                          onChange={(e) =>
                            updateVariantAttribute(
                              index,
                              key,
                              e.target.value,
                              value
                            )
                          }
                        />

                        <input
                          className={inputClass}
                          placeholder="Factor value — 250 ml / 99.8%"
                          value={value}
                          onChange={(e) =>
                            updateVariantAttribute(
                              index,
                              key,
                              key,
                              e.target.value
                            )
                          }
                        />

                        <ProductRemoveButton
                          onClick={() =>
                            removeVariantAttribute(
                              index,
                              key
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 mt-5 text-sm text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variant.isActive !== false}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        'isActive',
                        e.target.checked
                      )
                    }
                  />
                  Variant Active
                </label>
              </div>
            )
          )}

          {safeArray(productForm.variants).length === 0 && (
            <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl">
              <div className="text-sm text-slate-500">
                No variants configured.
              </div>
              <div className="text-xs text-slate-700 mt-1">
                Add variants when capacity, purity, size or another factor changes price.
              </div>
            </div>
          )}
        </div>
      </ProductSection>

      {/* CONTENT */}
      <ProductSection
        id="content"
        title="Product Content"
        description="Customer-facing copy, features and applications."
        open={sectionOpen('content')}
        onToggle={toggleSection}
      >
        <div className="space-y-5">
          <ProductField
            label="Short Description"
            hint="Use this for the short product summary shown near the product title."
          >
            <textarea
              className={textareaClass}
              value={productForm.shortDescription || ''}
              onChange={(e) =>
                updateProduct(
                  'shortDescription',
                  e.target.value
                )
              }
              placeholder="High-purity alumina crucibles designed for high-temperature laboratory applications..."
            />
          </ProductField>

          <ProductField
            label="Full Description"
            hint="Detailed product description for the product detail page."
          >
            <textarea
              className={`${textareaClass} min-h-[200px]`}
              value={productForm.description || ''}
              onChange={(e) =>
                updateProduct(
                  'description',
                  e.target.value
                )
              }
              placeholder="Describe construction, performance, applications, compatibility, temperature range, etc."
            />
          </ProductField>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-white">
                  Product Features
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Add unlimited bullet-style benefits.
                </p>
              </div>

              <ProductAddButton onClick={addFeature}>
                Add Feature
              </ProductAddButton>
            </div>

            <div className="space-y-2">
              {safeArray(productForm.features).map(
                (feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      className={inputClass}
                      value={feature || ''}
                      onChange={(e) =>
                        updateFeature(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="Excellent thermal and chemical resistance"
                    />
                    <ProductRemoveButton
                      onClick={() => removeFeature(index)}
                    />
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-white">
                  Applications
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Add unlimited use cases / industries.
                </p>
              </div>

              <ProductAddButton onClick={addApplication}>
                Add Application
              </ProductAddButton>
            </div>

            <div className="space-y-2">
              {safeArray(productForm.applications).map(
                (application, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      className={inputClass}
                      value={application || ''}
                      onChange={(e) =>
                        updateApplication(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="Chemical analysis / Metallurgy / Research"
                    />
                    <ProductRemoveButton
                      onClick={() =>
                        removeApplication(index)
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </ProductSection>

      {/* SEO */}
      <ProductSection
        id="seo"
        title="SEO Settings"
        description="Search-engine title, slug, description and keywords."
        open={sectionOpen('seo')}
        onToggle={toggleSection}
      >
        <div className="grid lg:grid-cols-2 gap-5">
          <ProductField
            label="SEO Title"
            hint="Recommended: clear product name + important keyword."
          >
            <input
              className={inputClass}
              value={productForm.seo?.title || ''}
              onChange={(e) =>
                updateNestedProduct(
                  'seo',
                  'title',
                  e.target.value
                )
              }
              placeholder="High Alumina Crucible | 99.8% Alumina | Bansal Scientific"
            />
          </ProductField>

          <ProductField label="SEO Slug" hint="URL-friendly product slug.">
            <input
              className={inputClass}
              value={productForm.seo?.slug || ''}
              onChange={(e) =>
                updateNestedProduct(
                  'seo',
                  'slug',
                  e.target.value
                )
              }
              placeholder="high-alumina-crucible"
            />
          </ProductField>
        </div>

        <div className="mt-5">
          <ProductField
            label="SEO Description"
            hint="Short search-result description focused on the product."
          >
            <textarea
              className={textareaClass}
              value={productForm.seo?.description || ''}
              onChange={(e) =>
                updateNestedProduct(
                  'seo',
                  'description',
                  e.target.value
                )
              }
              placeholder="Buy high purity alumina crucibles for high-temperature laboratory and industrial applications..."
            />
          </ProductField>
        </div>

        <div className="mt-5">
          <ProductField
            label="SEO Keywords"
            hint="Comma-separated keywords."
          >
            <input
              className={inputClass}
              value={productForm.seo?.keywords || ''}
              onChange={(e) =>
                updateNestedProduct(
                  'seo',
                  'keywords',
                  e.target.value
                )
              }
              placeholder="alumina crucible, high alumina crucible, ceramic crucible, 99.8 alumina"
            />
          </ProductField>
        </div>
      </ProductSection>

      {/* RELATED */}
      <ProductSection
        id="related"
        title="Related Products"
        description="Connect complementary products for cross-selling."
        open={sectionOpen('related')}
        onToggle={toggleSection}
      >
        <select
          className={inputClass}
          value=""
          onChange={(e) =>
            addRelatedProduct(e.target.value)
          }
        >
          <option value="">Add related product...</option>
          {products
            .filter(
              (product) =>
                String(product._id) !==
                  String(editingProduct?._id) &&
                !safeArray(
                  productForm.relatedProducts
                ).some(
                  (id) =>
                    String(id) ===
                    String(product._id)
                )
            )
            .map((product) => (
              <option
                key={product._id}
                value={product._id}
              >
                {product.name} — {product.sku}
              </option>
            ))}
        </select>

        <div className="flex flex-wrap gap-2 mt-4">
          {safeArray(productForm.relatedProducts).map(
            (id) => {
              const related = products.find(
                (product) =>
                  String(product._id) ===
                  String(id)
              );

              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800"
                >
                  <span className="text-xs text-slate-300">
                    {related?.name || id}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removeRelatedProduct(id)
                    }
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            }
          )}
        </div>
      </ProductSection>

      {/* METADATA */}
      <ProductSection
        id="metadata"
        title="Advanced Metadata"
        description="Optional JSON storage for future fields without changing this component."
        open={sectionOpen('metadata')}
        onToggle={toggleSection}
      >
        <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 mb-4">
          <div className="text-xs font-semibold text-amber-300">
            Advanced / developer field
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Use valid JSON only. Normal product data should be entered in the
            sections above.
          </p>
        </div>

        <textarea
          className={`${textareaClass} min-h-[240px] font-mono text-xs`}
          value={metadataText}
          onChange={(e) => setMetadataText(e.target.value)}
          placeholder='{"brand":"","countryOfOrigin":"","customField":""}'
        />
      </ProductSection>

      {/* SAVE BAR */}
      <div className="sticky bottom-4 z-20 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xl">
        <div>
          <div className="font-semibold text-white">
            {editingProduct ? 'Update Product' : 'Create Product'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            All configured product data will be sent through the existing
            AdminPage API flow.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-sm font-semibold transition"
          >
            {saving ? (
              <>
                <Loader2
                  size={16}
                  className="mr-2 animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {editingProduct
                  ? 'Update Product'
                  : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

const AdminPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState('products');

  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [currencies, setCurrencies] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [productForm, setProductForm] =
    useState(clone(EMPTY_PRODUCT));

  const [categoryForm, setCategoryForm] =
    useState(clone(EMPTY_CATEGORY));

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [productSearch, setProductSearch] =
    useState('');
    const [siteContent, setSiteContent] = useState({});

  const [expandedSections, setExpandedSections] =
    useState({
      basic: true,
      pricing: true,
      quantityPricing: false,
      media: true,
      specifications: true,
      variants: true,
      content: true,
      seo: true,
      metadata: false,
      related: false,
      'cms-about': true,
      'cms-contact': false,
      'cms-faqs': false
    });
    

  const [metadataText, setMetadataText] =
    useState('{}');

  /*
   * =========================================================
   * AUTH
   * =========================================================
   */

  const getAuthConfig = () => {
    const token =
      localStorage.getItem('adminToken');

    return {
      headers: {
        Authorization: token
          ? `Bearer ${token}`
          : ''
      }
    };
  };

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {
    loadEverything();
  }, []);

  const loadEverything = async () => {
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchCurrencies(),
      fetchSiteContent()
    ]);
  };

  const fetchSiteContent = async () => {
    try {
      const res = await api.get('/site-content');
      setSiteContent(res.data?.data || {});
    } catch (error) {
      console.error('Fetch site content error:', error);
    }
  };

  const updateSiteContent = (section, field, value) => {
    setSiteContent((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  const addFaq = () => {
    setSiteContent((prev) => ({
      ...prev,
      faqs: [
        ...(prev.faqs || []),
        { question: '', answer: '' }
      ]
    }));
  };

  const updateFaq = (index, field, value) => {
    setSiteContent((prev) => {
      const newFaqs = [...(prev.faqs || [])];
      newFaqs[index] = { ...newFaqs[index], [field]: value };
      return { ...prev, faqs: newFaqs };
    });
  };

  const removeFaq = (index) => {
    setSiteContent((prev) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== index)
    }));
  };

  const addTechnical = () => {
    setSiteContent((prev) => ({
      ...prev,
      technicals: [...(prev.technicals || []), { title: '', description: '', pdfUrl: '', category: '' }]
    }));
  };

  const updateTechnical = (index, field, value) => {
    setSiteContent((prev) => {
      const technicals = [...(prev.technicals || [])];
      technicals[index] = { ...technicals[index], [field]: value };
      return { ...prev, technicals };
    });
  };

  const removeTechnical = (index) => {
    setSiteContent((prev) => ({
      ...prev,
      technicals: (prev.technicals || []).filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const addSlide = () => {
    setSiteContent((prev) => ({
      ...prev,
      homeSlideshow: [...(prev.homeSlideshow || []), { title: '', subtitle: '', imageUrl: '', ctaLabel: 'Explore products', ctaUrl: '/scientific', isActive: true, sortOrder: (prev.homeSlideshow || []).length }]
    }));
  };

  const updateSlide = (index, field, value) => {
    setSiteContent((prev) => {
      const homeSlideshow = [...(prev.homeSlideshow || [])];
      homeSlideshow[index] = { ...homeSlideshow[index], [field]: value };
      return { ...prev, homeSlideshow };
    });
  };

  const removeSlide = (index) => {
    setSiteContent((prev) => ({ ...prev, homeSlideshow: (prev.homeSlideshow || []).filter((_, itemIndex) => itemIndex !== index) }));
  };

  const handleSaveSiteContent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/site-content', siteContent, getAuthConfig());
      alert('Site content successfully updated and published!');
    } catch (err) {
      console.error('Save site content error:', err);
      alert('Failed to update site content.');
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * PRODUCTS
   * =========================================================
   */

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        `${API_BASE_URL}/products/admin/all?limit=100`,
        getAuthConfig()
      );

      setProducts(
        Array.isArray(res.data)
          ? res.data
          : res.data?.data || []
      );
    } catch (error) {
      console.error(
        'Fetch products error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * CATEGORIES
   * =========================================================
   */

  const fetchCategories = async () => {
    try {
      const res = await api.get(
        `${API_BASE_URL}/categories`
      );

      setCategories(
        Array.isArray(res.data)
          ? res.data
          : res.data?.data || []
      );
    } catch (error) {
      console.error(
        'Fetch categories error:',
        error
      );
    }
  };

  /*
   * =========================================================
   * CURRENCIES
   * =========================================================
   */

  const syncCurrencyRates = async () => {
    try {
      setLoading(true);
      const res = await api.post(
        `${API_BASE_URL}/currencies/sync-rates`,
        {},
        getAuthConfig()
      );
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.currencies || res.data?.data || [];
      if (data.length) {
        setCurrencies(data);
      } else {
        await fetchCurrencies();
      }
      alert(res.data?.message || 'Currency rates synced successfully.');
    } catch (error) {
      console.error('Currency sync error:', error);
      alert(
        error.response?.data?.message ||
          error.message ||
          'Unable to sync currency rates.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await api.get(
        `${API_BASE_URL}/currencies`
      );

      const data =
        Array.isArray(res.data)
          ? res.data
          : res.data?.currencies || res.data?.data || [];

      setCurrencies(data);

      // New product: show every active currency immediately.
      // Existing/editing products keep their saved strategy untouched.
      setProductForm((prev) => {
        const existing = prev.currencyPricing || {};
        if (Object.keys(existing).length > 0) {
          return prev;
        }

        const currencyPricing = {};
        data
          .filter((item) => item && item.isActive !== false && item.code)
          .forEach((item) => {
            const code = String(item.code).trim().toUpperCase();
            currencyPricing[code] = clone(EMPTY_CURRENCY_PRICING);
          });

        return { ...prev, currencyPricing };
      });
    } catch (error) {
      /*
       * Currency route may not be mounted
       * in an older installation.
       *
       * Do not break AdminPage.
       */
      console.warn(
        'Currency API unavailable:',
        error?.response?.data ||
          error?.message
      );

      setCurrencies([
        {
          code: 'INR',
          name: 'Indian Rupee',
          symbol: '₹',
          rateFromBase: 1
        }
      ]);
    }
  };

  /*
   * =========================================================
   * CATEGORY HELPERS
   * =========================================================
   */

  const rootCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          !category.parent
      ),
    [categories]
  );

  const getSubcategories = (
    categoryId
  ) =>
    categories.filter(
      (category) =>
        String(category.parent || '') ===
        String(categoryId || '')
    );

  /*
   * =========================================================
   * CATEGORY CRUD
   * =========================================================
   */

  const resetCategory = () => {
    setEditingCategory(null);
    setCategoryForm(
      clone(EMPTY_CATEGORY)
    );
  };

  const handleCategoryChange = (
    field,
    value
  ) => {
    setCategoryForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const addCategoryField = () => {
    setCategoryForm((prev) => ({
      ...prev,
      specificationFields: [
        ...safeArray(
          prev.specificationFields
        ),
        clone(EMPTY_CATEGORY_FIELD)
      ]
    }));
  };

  const updateCategoryField = (
    index,
    field,
    value
  ) => {
    setCategoryForm((prev) => {
      const fields = [
        ...safeArray(
          prev.specificationFields
        )
      ];

      fields[index] = {
        ...fields[index],
        [field]: value
      };

      return {
        ...prev,
        specificationFields: fields
      };
    });
  };

  const removeCategoryField = (
    index
  ) => {
    setCategoryForm((prev) => ({
      ...prev,
      specificationFields:
        safeArray(
          prev.specificationFields
        ).filter(
          (_, i) => i !== index
        )
    }));
  };

  const handleSaveCategory = async (
    event
  ) => {
    event.preventDefault();

    if (
      !String(
        categoryForm.name || ''
      ).trim()
    ) {
      alert(
        'Category name is required.'
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...categoryForm,

        name:
          String(
            categoryForm.name
          ).trim(),

        description:
          String(
            categoryForm.description ||
              ''
          ).trim(),

        imageUrl:
          String(
            categoryForm.imageUrl ||
              ''
          ).trim(),

        parent:
          categoryForm.parent || null,

        isActive:
          Boolean(
            categoryForm.isActive
          ),

        sortOrder:
          integerOr(
            categoryForm.sortOrder,
            0
          ),

        specificationFields:
          safeArray(
            categoryForm.specificationFields
          )
            .map((field) => ({
              name:
                String(
                  field.name || ''
                ).trim(),

              type:
                field.type || 'text',

              options:
                safeArray(
                  field.options
                )
                  .map((option) =>
                    String(
                      option || ''
                    ).trim()
                  )
                  .filter(Boolean),

              required:
                Boolean(
                  field.required
                ),

              unit:
                String(
                  field.unit || ''
                ).trim()
            }))
            .filter(
              (field) =>
                field.name
            )
      };

      if (editingCategory?._id) {
        await api.patch(
          `${API_BASE_URL}/categories/${editingCategory._id}`,
          payload,
          getAuthConfig()
        );
      } else {
        await api.post(
          `${API_BASE_URL}/categories`,
          payload,
          getAuthConfig()
        );
      }

      await fetchCategories();

      resetCategory();

      alert(
        editingCategory
          ? 'Category updated successfully.'
          : 'Category created successfully.'
      );
    } catch (error) {
      console.error(
        'Save category error:',
        error
      );

      alert(
        error.response?.data?.message ||
          error.message ||
          'Unable to save category.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (
    category
  ) => {
    setEditingCategory(category);

    setCategoryForm({
      name:
        category.name || '',

      storeType:
        category.storeType || 'B2B',

      description:
        category.description || '',

      imageUrl:
        category.imageUrl || '',

      parent:
        category.parent
          ? String(category.parent)
          : '',

      isActive:
        category.isActive !== false,

      sortOrder:
        category.sortOrder || 0,

      specificationFields:
        safeArray(
          category.specificationFields
        ).map((field) => ({
          name:
            field.name || '',

          type:
            field.type || 'text',

          options:
            safeArray(
              field.options
            ),

          required:
            Boolean(
              field.required
            ),

          unit:
            field.unit || ''
        }))
    });

    setActiveTab('categories');
  };

  const handleDeleteCategory = async (
    id
  ) => {
    if (
      !window.confirm(
        'Delete this category/subcategory?'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `${API_BASE_URL}/categories/${id}`,
        getAuthConfig()
      );

      await fetchCategories();

      /*
       * Existing products should not
       * be silently destroyed.
       */
      await fetchProducts();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          'Unable to delete category.'
      );
    }
  };

  /*
   * =========================================================
   * PRODUCT HELPERS
   * =========================================================
   */

  const updateProduct = (
    field,
    value
  ) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedProduct = (
    parent,
    field,
    value
  ) => {
    setProductForm((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  /*
   * =========================================================
   * CATEGORY / SUBCATEGORY SELECTION
   * =========================================================
   */

  const selectedSubcategories =
    useMemo(
      () =>
        getSubcategories(
          productForm.categoryId
        ),
      [
        categories,
        productForm.categoryId
      ]
    );

  const handleProductCategoryChange = (
    categoryId
  ) => {
    const category =
      categories.find(
        (item) =>
          String(item._id) ===
          String(categoryId)
      );

    setProductForm((prev) => ({
      ...prev,

      categoryId,

      category:
        category?.name || '',

      subcategoryId: '',

      subcategory: ''
    }));
  };

  const handleProductSubcategoryChange = (
    subcategoryId
  ) => {
    const subcategory =
      categories.find(
        (item) =>
          String(item._id) ===
          String(subcategoryId)
      );

    setProductForm((prev) => ({
      ...prev,

      subcategoryId,

      subcategory:
        subcategory?.name || ''
    }));
  };

  /*
   * =========================================================
   * SPECIFICATIONS
   * =========================================================
   */

  const addSpecification = () => {
    setProductForm((prev) => ({
      ...prev,

      specifications: [
        ...safeArray(
          prev.specifications
        ),
        clone(EMPTY_SPEC)
      ]
    }));
  };

  const updateSpecification = (
    index,
    field,
    value
  ) => {
    setProductForm((prev) => {
      const specifications = [
        ...safeArray(
          prev.specifications
        )
      ];

      specifications[index] = {
        ...specifications[index],
        [field]: value
      };

      return {
        ...prev,
        specifications
      };
    });
  };

  const removeSpecification = (
    index
  ) => {
    setProductForm((prev) => ({
      ...prev,

      specifications:
        safeArray(
          prev.specifications
        ).filter(
          (_, i) => i !== index
        )
    }));
  };

  /*
   * =========================================================
   * FEATURES
   * =========================================================
   */

  const addFeature = () => {
    setProductForm((prev) => ({
      ...prev,
      features: [
        ...safeArray(prev.features),
        ''
      ]
    }));
  };

  const updateFeature = (
    index,
    value
  ) => {
    setProductForm((prev) => {
      const features = [
        ...safeArray(prev.features)
      ];

      features[index] = value;

      return {
        ...prev,
        features
      };
    });
  };

  const removeFeature = (
    index
  ) => {
    setProductForm((prev) => ({
      ...prev,
      features:
        safeArray(prev.features)
          .filter(
            (_, i) =>
              i !== index
          )
    }));
  };

  /*
   * =========================================================
   * APPLICATIONS
   * =========================================================
   */

  const addApplication = () => {
    setProductForm((prev) => ({
      ...prev,
      applications: [
        ...safeArray(
          prev.applications
        ),
        ''
      ]
    }));
  };

  const updateApplication = (
    index,
    value
  ) => {
    setProductForm((prev) => {
      const applications = [
        ...safeArray(
          prev.applications
        )
      ];

      applications[index] =
        value;

      return {
        ...prev,
        applications
      };
    });
  };

  const removeApplication = (
    index
  ) => {
    setProductForm((prev) => ({
      ...prev,
      applications:
        safeArray(
          prev.applications
        ).filter(
          (_, i) =>
            i !== index
        )
    }));
  };

  /*
   * =========================================================
   * DOCUMENTS
   * =========================================================
   */

  const addDocument = () => {
    setProductForm((prev) => ({
      ...prev,
      documents: [
        ...safeArray(
          prev.documents
        ),
        {
          name: '',
          url: '',
          type: ''
        }
      ]
    }));
  };

  const updateDocument = (
    index,
    field,
    value
  ) => {
    setProductForm((prev) => {
      const documents = [
        ...safeArray(
          prev.documents
        )
      ];

      documents[index] = {
        ...documents[index],
        [field]: value
      };

      return {
        ...prev,
        documents
      };
    });
  };

  const removeDocument = (
    index
  ) => {
    setProductForm((prev) => ({
      ...prev,
      documents:
        safeArray(
          prev.documents
        ).filter(
          (_, i) =>
            i !== index
        )
    }));
  };

  /*
   * =========================================================
   * IMAGES
   * =========================================================
   */

  const addImage = () => {
    setProductForm((prev) => ({
      ...prev,
      images: [
        ...safeArray(prev.images),
        {
          ...clone(EMPTY_IMAGE),
          sortOrder:
            safeArray(
              prev.images
            ).length
        }
      ]
    }));
  };

  const updateImage = (
    index,
    field,
    value
  ) => {
    setProductForm((prev) => {
      const images = [
        ...safeArray(prev.images)
      ];

      images[index] = {
        ...images[index],
        [field]: value
      };

      if (
        field ===
          'isPrimary' &&
        value === true
      ) {
        images.forEach(
          (image, imageIndex) => {
            image.isPrimary =
              imageIndex ===
              index;
          }
        );
      }

      return {
        ...prev,
        images
      };
    });
  };

  const removeImage = (
    index
  ) => {
    setProductForm((prev) => ({
      ...prev,
      images:
        safeArray(
          prev.images
        ).filter(
          (_, i) =>
            i !== index
        )
    }));
  };

  /*
   * =========================================================
   * VARIANTS
   * =========================================================
   */

  const addVariant = () => {
    setProductForm((prev) => ({
      ...prev,
      variants: [
        ...safeArray(
          prev.variants
        ),
        clone(EMPTY_VARIANT)
      ]
    }));
  };

  const updateVariant = (
    index,
    field,
    value
  ) => {
    setProductForm((prev) => {
      const variants = [
        ...safeArray(
          prev.variants
        )
      ];

      variants[index] = {
        ...variants[index],
        [field]: value
      };

      return {
        ...prev,
        variants
      };
    });
  };

  const removeVariant = (
    index
  ) => {
    setProductForm((prev) => ({
      ...prev,
      variants:
        safeArray(
          prev.variants
        ).filter(
          (_, i) =>
            i !== index
        )
    }));
  };

  const addVariantAttribute = (
    variantIndex
  ) => {
    setProductForm((prev) => {
      const variants = [
        ...safeArray(
          prev.variants
        )
      ];

      const attributes = {
        ...(variants[
          variantIndex
        ]?.attributes || {}),
        '': ''
      };

      variants[variantIndex] = {
        ...variants[variantIndex],
        attributes
      };

      return {
        ...prev,
        variants
      };
    });
  };

  const updateVariantAttribute = (
    variantIndex,
    oldKey,
    newKey,
    value
  ) => {
    setProductForm((prev) => {
      const variants = [
        ...safeArray(
          prev.variants
        )
      ];

      const oldAttributes = {
        ...(variants[
          variantIndex
        ]?.attributes || {})
      };

      delete oldAttributes[
        oldKey
      ];

      oldAttributes[
        newKey
      ] = value;

      variants[variantIndex] = {
        ...variants[variantIndex],
        attributes:
          oldAttributes
      };

      return {
        ...prev,
        variants
      };
    });
  };

  const removeVariantAttribute = (
    variantIndex,
    key
  ) => {
    setProductForm((prev) => {
      const variants = [
        ...safeArray(
          prev.variants
        )
      ];

      const attributes = {
        ...(variants[
          variantIndex
        ]?.attributes || {})
      };

      delete attributes[key];

      variants[variantIndex] = {
        ...variants[variantIndex],
        attributes
      };

      return {
        ...prev,
        variants
      };
    });
  };

  /*
   * =========================================================
   * CURRENCY PRICING
   * =========================================================
   */

  const activeCurrencies =
    currencies.length > 0
      ? currencies
      : [
          {
            code: 'INR',
            symbol: '₹',
            rateFromBase: 1
          }
        ];

  const updateCurrencyPrice = (
    code,
    value
  ) => {
    setProductForm((prev) => ({
      ...prev,

      currencyPrices: {
        ...(prev.currencyPrices || {}),

        [code]: value
      }
    }));
  };

  const removeCurrencyPrice = (
    code
  ) => {
    setProductForm((prev) => {
      const currencyPrices = {
        ...(prev.currencyPrices || {})
      };

      delete currencyPrices[
        code
      ];

      return {
        ...prev,
        currencyPrices
      };
    });
  };


  const addCurrencyPricing = (code) => {
    setProductForm((prev) => ({
      ...prev,
      currencyPricing: {
        ...(prev.currencyPricing || {}),
        [code]: {
          ...clone(EMPTY_CURRENCY_PRICING),
          ...(prev.currencyPricing?.[code] || {})
        }
      }
    }));
  };

  const updateCurrencyPricing = (code, field, value) => {
    setProductForm((prev) => ({
      ...prev,
      currencyPricing: {
        ...(prev.currencyPricing || {}),
        [code]: {
          ...clone(EMPTY_CURRENCY_PRICING),
          ...(prev.currencyPricing?.[code] || {}),
          [field]: value
        }
      }
    }));
  };

  const removeCurrencyPricing = (code) => {
    setProductForm((prev) => {
      const currencyPricing = { ...(prev.currencyPricing || {}) };
      delete currencyPricing[code];
      return { ...prev, currencyPricing };
    });
  };

  /*
   * =========================================================
   * QUANTITY TIERS
   * =========================================================
   */

  const addQuantityTier = () => {
    setProductForm((prev) => ({
      ...prev,

      pricing: {
        ...prev.pricing,

        quantityTiers: [
          ...safeArray(
            prev.pricing
              ?.quantityTiers
          ),
          clone(EMPTY_TIER)
        ]
      }
    }));
  };

  const updateQuantityTier = (
    index,
    field,
    value
  ) => {
    setProductForm((prev) => {
      const tiers = [
        ...safeArray(
          prev.pricing
            ?.quantityTiers
        )
      ];

      tiers[index] = {
        ...tiers[index],
        [field]: value
      };

      return {
        ...prev,

        pricing: {
          ...prev.pricing,
          quantityTiers:
            tiers
        }
      };
    });
  };

  const removeQuantityTier = (
    index
  ) => {
    setProductForm((prev) => ({
      ...prev,

      pricing: {
        ...prev.pricing,

        quantityTiers:
          safeArray(
            prev.pricing
              ?.quantityTiers
          ).filter(
            (_, i) =>
              i !== index
          )
      }
    }));
  };

  /*
   * =========================================================
   * RELATED PRODUCTS
   * =========================================================
   */

  const addRelatedProduct = (
    id
  ) => {
    if (!id) return;

    setProductForm((prev) => {
      const current =
        safeArray(
          prev.relatedProducts
        );

      if (
        current.some(
          (item) =>
            String(item) ===
            String(id)
        )
      ) {
        return prev;
      }

      return {
        ...prev,
        relatedProducts: [
          ...current,
          id
        ]
      };
    });
  };

  const removeRelatedProduct = (
    id
  ) => {
    setProductForm((prev) => ({
      ...prev,

      relatedProducts:
        safeArray(
          prev.relatedProducts
        ).filter(
          (item) =>
            String(item) !==
            String(id)
        )
    }));
  };

  /*
   * =========================================================
   * IMAGE UPLOAD
   * =========================================================
   */

  const uploadImage = async (
    file
  ) => {
    if (!file) {
      return null;
    }

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      alert(
        'Please select an image.'
      );

      return null;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      alert(
        'Image must be smaller than 10 MB.'
      );

      return null;
    }

    try {
      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        'image',
        file
      );

      const res =
        await api.post(
          `${API_BASE_URL}/products/upload`,
          formData,
          {
            headers: {
              ...getAuthConfig()
                .headers,

              'Content-Type':
                'multipart/form-data'
            }
          }
        );

      return (
        res.data?.imageUrl ||
        null
      );
    } catch (error) {
      console.error(
        'Upload error:',
        error
      );

      alert(
        error.response?.data
          ?.message ||
          'Image upload failed.'
      );

      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleMainImageUpload = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const url =
      await uploadImage(file);

    if (!url) return;

    setProductForm((prev) => ({
      ...prev,
      imageUrl: url,

      images: [
        ...safeArray(
          prev.images
        ),

        {
          url,
          alt:
            prev.name || '',
          sortOrder:
            safeArray(
              prev.images
            ).length,
          isPrimary:
            safeArray(
              prev.images
            ).length === 0
        }
      ]
    }));

    event.target.value = '';
  };
const handleToggleArchive = async (id) => {
  try {
    // यहाँ {} खाली डेटा है और getAuthConfig() टोकन भेज रहा है
    await api.patch(`${API_BASE_URL}/products/${id}/archive`, {}, getAuthConfig());
    await fetchProducts(); 
  } catch (error) {
    console.error("Archive status update failed:", error);
    alert(error.response?.data?.message || "Failed to update archive status");
  }
};

const handlePermanentDelete = async (id) => {
  if (!window.confirm("Warning: This will permanently delete the product. Are you sure?")) return;
  
  try {
    // यहाँ getAuthConfig() टोकन भेज रहा है
    await api.delete(`${API_BASE_URL}/products/${id}`, getAuthConfig());
    await fetchProducts(); 
  } catch (error) {
    console.error("Permanent delete failed:", error);
    alert(error.response?.data?.message || "Failed to permanently delete product");
  }
};

  /*
   * =========================================================
   * PRODUCT NORMALIZATION
   * =========================================================
   */

  const normalizeProductPayload =
    () => {
      let metadata = {};

      try {
        metadata =
          metadataText.trim()
            ? JSON.parse(
                metadataText
              )
            : {};
      } catch {
        throw new Error(
          'Metadata must contain valid JSON.'
        );
      }

      const currencyPrices =
        Object.entries(
          productForm.currencyPrices ||
            {}
        ).reduce(
          (
            result,
            [code, value]
          ) => {
            if (
              value !== '' &&
              value !== null &&
              value !== undefined
            ) {
              const number =
                Number(value);

              if (
                Number.isFinite(
                  number
                )
              ) {
                result[
                  code
                    .toUpperCase()
                ] = number;
              }
            }

            return result;
          },
          {}
        );

 const currencyPricing =
        Object.entries(productForm.currencyPricing || {}).reduce(
          (result, [code, config]) => {
            const normalizedCode = String(code).trim().toUpperCase();
            const mode = ['auto', 'multiplier', 'override'].includes(config?.mode)
              ? config.mode
              : 'auto';
            const multiplier = Number(config?.multiplier);
            const overridePrice = Number(
              config?.overridePrice ??
              config?.price
            );
            const validOverride = Number.isFinite(overridePrice) && overridePrice >= 0 ? overridePrice : null;

            result[normalizedCode] = {
              mode,
              multiplier:
                Number.isFinite(multiplier) && multiplier >= 0
                  ? multiplier
                  : 1,
              price: validOverride,          // <--- Backend schema field
              overridePrice: validOverride,  // <--- Frontend UI field
              enabled:
                config?.enabled !== false
            };
            return result;
          },
          {}
        );

const payload = {
        ...productForm,

        sku: String(productForm.sku || '').trim().toUpperCase(),
        name: String(productForm.name || '').trim(),
        categoryId: productForm.categoryId || null,
        subcategoryId: productForm.subcategoryId || null,
        category: productForm.category || '',
        subcategory: productForm.subcategory || '',
        price: numberOrZero(productForm.price),
        baseCurrency: String(productForm.baseCurrency || 'INR').trim().toUpperCase(),

        currencyPrices,
        
        // 👇 1. Top-Level Save
        currencyPricing,

        pricing: {
          pricingMode: productForm.pricing?.pricingMode || 'base',
          allowCurrencyConversion: productForm.pricing?.allowCurrencyConversion !== false,
          allowQuantityPricing: Boolean(productForm.pricing?.allowQuantityPricing),
          
          // 👇 2. Nested Redundancy Save (Double Safety)
          currencyPricing: currencyPricing,

          quantityTiers: safeArray(productForm.pricing?.quantityTiers).map((tier) => ({
            minQuantity: integerOr(tier.minQuantity, 1),
            maxQuantity: tier.maxQuantity === '' || tier.maxQuantity === null || tier.maxQuantity === undefined ? null : integerOr(tier.maxQuantity, null),
            price: numberOrZero(tier.price),
            currency: String(tier.currency || productForm.baseCurrency || 'INR').trim().toUpperCase()
          })).filter((tier) => tier.minQuantity > 0 && tier.price >= 0)
        },

        moq: Math.max(1, integerOr(productForm.moq, 1)),
        stock: Math.max(0, numberOrZero(productForm.stock)),
        // ... (बाकी का कोड सेम रहेगा: specifications, variants, images etc.)

        specifications:
          safeArray(
            productForm.specifications
          )
            .map(
              (spec) => ({
                name:
                  String(
                    spec.name || ''
                  ).trim(),

                value:
                  String(
                    spec.value || ''
                  ).trim()
              })
            )
            .filter(
              (spec) =>
                spec.name &&
                spec.value
            ),

        variants:
          safeArray(
            productForm.variants
          ).map(
            (variant) => ({
              ...(variant._id ? { _id: variant._id } : {}),
              name:
                String(
                  variant.name || ''
                ).trim(),

              sku:
                String(
                  variant.sku || ''
                )
                  .trim()
                  .toUpperCase(),

              price:
                numberOrZero(
                  variant.price
                ),

              stock:
                Math.max(
                  0,
                  numberOrZero(
                    variant.stock
                  )
                ),

              attributes:
                variant.attributes ||
                {},

              imageUrl:
                String(
                  variant.imageUrl ||
                    ''
                ).trim(),

              isActive:
                variant.isActive !==
                false
            })
          ),

        images:
          safeArray(
            productForm.images
          )
            .map(
              (image, index) => ({
                url:
                  String(
                    image.url || ''
                  ).trim(),

                alt:
                  String(
                    image.alt || ''
                  ).trim(),

                sortOrder:
                  integerOr(
                    image.sortOrder,
                    index
                  ),

                isPrimary:
                  Boolean(
                    image.isPrimary
                  )
              })
            )
            .filter(
              (image) =>
                image.url
            ),

        features:
          safeArray(
            productForm.features
          )
            .map((item) =>
              String(
                item || ''
              ).trim()
            )
            .filter(Boolean),

        applications:
          safeArray(
            productForm.applications
          )
            .map((item) =>
              String(
                item || ''
              ).trim()
            )
            .filter(Boolean),

        documents:
          safeArray(
            productForm.documents
          )
            .map((document) => ({
              name:
                String(
                  document.name ||
                    ''
                ).trim(),

              url:
                String(
                  document.url ||
                    ''
                ).trim(),

              type:
                String(
                  document.type ||
                    ''
                ).trim()
            }))
            .filter(
              (document) =>
                document.url
            ),

        seo: {
          title:
            String(
              productForm.seo
                ?.title || ''
            ).trim(),

          description:
            String(
              productForm.seo
                ?.description ||
                ''
            ).trim(),

          keywords:
            String(
              productForm.seo
                ?.keywords || ''
            ).trim(),

          slug:
            String(
              productForm.seo
                ?.slug || ''
            )
              .trim()
              .toLowerCase()
        },

        relatedProducts:
          safeArray(
            productForm.relatedProducts
          ),

        metadata
      };

      return payload;
    };

  /*
   * =========================================================
   * ADD PRODUCT
   * =========================================================
   */

  const handleAddProduct = async (
    event
  ) => {
    event.preventDefault();

    if (
      !productForm.sku.trim()
    ) {
      alert(
        'SKU is required.'
      );

      return;
    }

    if (
      !productForm.name.trim()
    ) {
      alert(
        'Product name is required.'
      );

      return;
    }

    try {
      setSaving(true);

      const payload =
        normalizeProductPayload();

      await api.post(
        `${API_BASE_URL}/products`,
        payload,
        getAuthConfig()
      );

      alert(
        'Product created successfully.'
      );

      resetProduct();

      await fetchProducts();

      setActiveTab('products');
    } catch (error) {
      console.error(
        'Create product error:',
        error
      );

      alert(
        error.response?.data?.message ||
          error.message ||
          'Unable to create product.'
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * EDIT PRODUCT
   * =========================================================
   */

  const handleEditProduct = (
    product
  ) => {
    setEditingProduct(product);

    const normalized = {
      ...clone(EMPTY_PRODUCT),
      ...product,

      categoryId:
        product.categoryId?._id ||
        product.categoryId ||
        '',

      subcategoryId:
        product.subcategoryId?._id ||
        product.subcategoryId ||
        '',

      currencyPrices:
        product.currencyPrices
          ? {
              ...(typeof product
                .currencyPrices
                .toObject ===
              'function'
                ? product.currencyPrices.toObject()
                : product.currencyPrices)
            }
          : {},

      currencyPricing:
        product.currencyPricing
          ? Object.fromEntries(
              Object.entries(
                typeof product.currencyPricing.toObject === 'function'
                  ? product.currencyPricing.toObject()
                  : product.currencyPricing
              ).map(([code, config]) => [
                String(code).toUpperCase(),
                {
                  ...clone(EMPTY_CURRENCY_PRICING),
                  ...(config || {}),
                  overridePrice:
                    config?.overridePrice ??
                    config?.price ??
                    ''
                }
              ])
            )
          : {},

      pricing: {
        ...clone(
          EMPTY_PRODUCT.pricing
        ),
        ...(product.pricing || {}),

        quantityTiers:
          safeArray(
            product.pricing
              ?.quantityTiers
          ).map(
            (tier) => ({
              ...clone(
                EMPTY_TIER
              ),
              ...tier
            })
          )
      },

      specifications:
        safeArray(
          product.specifications
        ).map(
          (spec) => ({
            name:
              spec.name || '',
            value:
              spec.value || ''
          })
        ),

      variants:
        safeArray(
          product.variants
        ).map(
          (variant) => ({
            ...clone(
              EMPTY_VARIANT
            ),
            ...variant,
            attributes:
              variant.attributes ||
              {}
          })
        ),

      images:
        safeArray(
          product.images
        ).map(
          (image) => ({
            ...clone(
              EMPTY_IMAGE
            ),
            ...image
          })
        ),

      features:
        safeArray(
          product.features
        ),

      applications:
        safeArray(
          product.applications
        ),

      documents:
        safeArray(
          product.documents
        ),

      seo: {
        ...clone(
          EMPTY_PRODUCT.seo
        ),
        ...(product.seo || {})
      },

      relatedProducts:
        safeArray(
          product.relatedProducts
        ).map(
          (item) =>
            item?._id ||
            item
        ),

      metadata:
        product.metadata ||
        {}
    };

    setProductForm(
      normalized
    );

    setMetadataText(
      JSON.stringify(
        product.metadata ||
          {},
        null,
        2
      )
    );

    setActiveTab(
      'add-product'
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  /*
   * =========================================================
   * UPDATE PRODUCT
   * =========================================================
   */

  const handleUpdateProduct =
    async (event) => {
      event.preventDefault();

      if (
        !editingProduct?._id
      ) {
        alert(
          'No product selected.'
        );

        return;
      }

      try {
        setSaving(true);

        const payload =
          normalizeProductPayload();

        await api.put(
          `${API_BASE_URL}/products/${editingProduct._id}`,
          payload,
          getAuthConfig()
        );

        alert(
          'Product updated successfully.'
        );

        resetProduct();

        await fetchProducts();

        setActiveTab('products');
      } catch (error) {
        console.error(
          'Update product error:',
          error
        );

        alert(
          error.response?.data
            ?.message ||
            error.message ||
            'Unable to update product.'
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * =========================================================
   * DELETE PRODUCT
   * =========================================================
   */

  /*
   * =========================================================
   * RESET
   * =========================================================
   */

  const resetProduct = () => {
    setEditingProduct(null);

    const currencyPricing = {};
    currencies
      .filter((item) => item && item.isActive !== false && item.code)
      .forEach((item) => {
        const code = String(item.code).trim().toUpperCase();
        currencyPricing[code] = clone(EMPTY_CURRENCY_PRICING);
      });

    setProductForm({
      ...clone(EMPTY_PRODUCT),
      currencyPricing
    });

    setMetadataText('{}');
  };

  /*
   * =========================================================
   * SECTION TOGGLE
   * =========================================================
   */

  const toggleSection = (
    section
  ) => {
    setExpandedSections(
      (prev) => ({
        ...prev,
        [section]:
          !prev[section]
      })
    );
  };

  /*
   * =========================================================
   * FILTERED PRODUCTS
   * =========================================================
   */

  const filteredProducts =
    products.filter(
      (product) => {
        const term =
          productSearch
            .trim()
            .toLowerCase();

        if (!term) {
          return true;
        }

        return (
          String(
            product.name || ''
          )
            .toLowerCase()
            .includes(term) ||
          String(
            product.sku || ''
          )
            .toLowerCase()
            .includes(term) ||
          String(
            product.category || ''
          )
            .toLowerCase()
            .includes(term) ||
          String(
            product.subcategory ||
              ''
          )
            .toLowerCase()
            .includes(term)
        );
      }
    );

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  const handleLogout = () => {
    localStorage.removeItem(
      'adminToken'
    );

    localStorage.removeItem(
      'adminEmail'
    );

    navigate(
      '/admin/login'
    );
  };
  /*
   * =========================================================
   * RENDER
   * =========================================================
   */


  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
              BS
            </div>

            <div>
              <div className="font-bold text-white">
                Bansal Admin
              </div>

              <div className="text-xs text-slate-500">
                Dynamic Catalog
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                resetProduct();
                setActiveTab(
                  'products'
                );
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                activeTab ===
                'products'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Package size={18} />
              Products
            </button>

            <button
              onClick={() => {
                setActiveTab(
                  'add-product'
                );

                if (
                  !editingProduct
                ) {
                  resetProduct();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                activeTab ===
                'add-product'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {editingProduct ? (
                <Pencil size={18} />
              ) : (
                <PlusCircle
                  size={18}
                />
              )}

              {editingProduct
                ? 'Edit Product'
                : 'Add Product'}
            </button>

            <button
              onClick={() =>
                setActiveTab(
                  'categories'
                )
              }
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                activeTab ===
                'categories'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <FolderPlus
                size={18}
              />

              Categories
            </button>

            <button
              onClick={() =>
                setActiveTab(
                  'cms'
                )
              }
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                activeTab ===
                'cms'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <FileText
                size={18}
              />

              Page Content
            </button>

            <Link
              to="/admin/inquiries"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-emerald-400 hover:bg-slate-800 mt-4"
            >
              <MessageSquareQuote
                size={18}
              />
              RFQ Inquiries
            </Link>
          </nav>
        </div>

        <button
          onClick={
            handleLogout
          }
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="flex-1 p-8 overflow-y-auto">

        {/* ===================================================
            CMS (PAGE CONTENT)
        ==================================================== */}

        {activeTab === 'cms' && (
          <div className="space-y-6 max-w-6xl">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Page Content (CMS)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage dynamic text and data for all public pages.
              </p>
            </div>

            <form onSubmit={handleSaveSiteContent} className="space-y-6">
              
              {/* About Us Page CMS */}
              <Section id="cms-about" open={expandedSections["cms-about"] ?? true} onToggle={toggleSection} title="About Us Page">
                <div className="space-y-4">
                  <Field label="Hero heading (leave empty for default)">
                    <input
                      className={inputClass}
                      value={siteContent?.aboutUs?.heading || ''}
                      onChange={(e) => updateSiteContent('aboutUs', 'heading', e.target.value)}
                      placeholder="Precision Ceramics for Global Innovators"
                    />
                  </Field>
                  <Field label="Intro Text (Leave empty to use default premium text)">
                    <textarea
                      className={textareaClass}
                      value={siteContent?.aboutUs?.introText || ''}
                      onChange={(e) => updateSiteContent('aboutUs', 'introText', e.target.value)}
                      placeholder="Bansal Scientific & Ceramic Industry is a leading Indian manufacturer..."
                    />
                  </Field>
                  <Field label="Manufacturing video embed URL (optional)">
                    <input
                      className={inputClass}
                      value={siteContent?.aboutUs?.videoUrl || ''}
                      onChange={(e) => updateSiteContent('aboutUs', 'videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </Field>
                </div>
              </Section>

              {/* Contact Information CMS */}
              <Section id="cms-contact" open={expandedSections["cms-contact"] ?? true} onToggle={toggleSection} title="Contact Information">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Sales Email">
                    <input 
                      className={inputClass} 
                      value={siteContent?.contact?.salesEmail || ''} 
                      onChange={(e) => updateSiteContent('contact', 'salesEmail', e.target.value)} 
                      placeholder="sales@bansalscientific.com"
                    />
                  </Field>
                  <Field label="Phone / WhatsApp">
                    <input 
                      className={inputClass} 
                      value={siteContent?.contact?.phone || ''} 
                      onChange={(e) => updateSiteContent('contact', 'phone', e.target.value)} 
                      placeholder="+91-9149062163"
                    />
                  </Field>
                  <Field label="Address">
                    <input 
                      className={inputClass} 
                      value={siteContent?.contact?.address || ''} 
                      onChange={(e) => updateSiteContent('contact', 'address', e.target.value)} 
                      placeholder="712, City Station Road, Khurja..."
                    />
                  </Field>
                  <Field label="Opening Hours">
                    <input 
                      className={inputClass} 
                      value={siteContent?.contact?.openingHours || ''} 
                      onChange={(e) => updateSiteContent('contact', 'openingHours', e.target.value)} 
                      placeholder="Mon-Sat 10:00-18:00"
                    />
                  </Field>
                  <Field label="Google Maps Embed URL" className="md:col-span-2">
                    <input
                      className={inputClass}
                      value={siteContent?.contact?.mapEmbedUrl || ''}
                      onChange={(e) => updateSiteContent('contact', 'mapEmbedUrl', e.target.value)}
                      placeholder="Paste the Google Maps embed URL (not the public share URL)"
                    />
                  </Field>
                </div>
              </Section>

              {/* FAQs CMS */}
              <Section id="cms-faqs" open={expandedSections["cms-faqs"] ?? true} onToggle={toggleSection} title="Frequently Asked Questions (FAQs)">
                <div className="flex justify-end mb-4">
                  <button type="button" onClick={addFaq} className="px-3 py-2 rounded-lg bg-blue-600 text-sm font-semibold">
                    <Plus size={14} className="inline mr-1" /> Add FAQ
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(siteContent?.faqs || []).map((faq, index) => (
                    <div key={index} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex gap-4">
                      <div className="flex-1 space-y-3">
                        <input 
                          className={inputClass} 
                          placeholder="Question?" 
                          value={faq.question} 
                          onChange={(e) => updateFaq(index, 'question', e.target.value)} 
                        />
                        <textarea 
                          className={textareaClass} 
                          placeholder="Answer..." 
                          value={faq.answer} 
                          onChange={(e) => updateFaq(index, 'answer', e.target.value)} 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFaq(index)} 
                        className="text-rose-400 p-2 h-fit hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {(siteContent?.faqs || []).length === 0 && (
                    <p className="text-sm text-slate-500">No custom FAQs defined. Default FAQs will be shown.</p>
                  )}
                </div>
              </Section>

              <Section id="cms-technicals" open={expandedSections["cms-technicals"] ?? true} onToggle={toggleSection} title="Technical documents">
                <div className="flex justify-between items-center gap-4 mb-4">
                  <p className="text-xs text-slate-500">Publish downloadable general datasheets and manuals. Product documents are managed with each product.</p>
                  <button type="button" onClick={addTechnical} className="shrink-0 px-3 py-2 rounded-lg bg-blue-600 text-sm font-semibold"><Plus size={14} className="inline mr-1" /> Add document</button>
                </div>
                <div className="space-y-4">
                  {(siteContent?.technicals || []).map((document, index) => (
                    <div key={index} className="bg-slate-950 border border-slate-800 p-4 rounded-xl grid gap-3 md:grid-cols-2">
                      <input className={inputClass} placeholder="Document title" value={document.title || ''} onChange={(e) => updateTechnical(index, 'title', e.target.value)} />
                      <input className={inputClass} placeholder="Category (optional)" value={document.category || ''} onChange={(e) => updateTechnical(index, 'category', e.target.value)} />
                      <input className={`${inputClass} md:col-span-2`} placeholder="PDF URL" value={document.pdfUrl || ''} onChange={(e) => updateTechnical(index, 'pdfUrl', e.target.value)} />
                      <textarea className={`${textareaClass} md:col-span-2`} placeholder="Short description (optional)" value={document.description || ''} onChange={(e) => updateTechnical(index, 'description', e.target.value)} />
                      <button type="button" onClick={() => removeTechnical(index)} className="justify-self-start text-rose-400 hover:text-rose-300 text-sm font-semibold"><Trash2 size={15} className="inline mr-1" /> Remove document</button>
                    </div>
                  ))}
                  {(siteContent?.technicals || []).length === 0 && <p className="text-sm text-slate-500">No general documents published.</p>}
                </div>
              </Section>

              <Section id="cms-slideshow" open={expandedSections["cms-slideshow"] ?? true} onToggle={toggleSection} title="Homepage offers slideshow">
                <div className="flex justify-between items-center gap-4 mb-4">
                  <p className="text-xs text-slate-500">These slides rotate automatically on the homepage. Use a direct image URL from Cloudinary or your image host.</p>
                  <button type="button" onClick={addSlide} className="shrink-0 px-3 py-2 rounded-lg bg-blue-600 text-sm font-semibold"><Plus size={14} className="inline mr-1" /> Add slide</button>
                </div>
                <div className="space-y-4">
                  {(siteContent?.homeSlideshow || []).map((slide, index) => (
                    <div key={index} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className={inputClass} placeholder="Offer title" value={slide.title || ''} onChange={(e) => updateSlide(index, 'title', e.target.value)} />
                        <input className={inputClass} placeholder="Image URL" value={slide.imageUrl || ''} onChange={(e) => updateSlide(index, 'imageUrl', e.target.value)} />
                      </div>
                      <textarea className={textareaClass} placeholder="Offer subtitle" value={slide.subtitle || ''} onChange={(e) => updateSlide(index, 'subtitle', e.target.value)} />
                      <div className="grid gap-3 md:grid-cols-3">
                        <input className={inputClass} placeholder="Button label" value={slide.ctaLabel || ''} onChange={(e) => updateSlide(index, 'ctaLabel', e.target.value)} />
                        <input className={inputClass} placeholder="Button path, e.g. /lifestyle" value={slide.ctaUrl || ''} onChange={(e) => updateSlide(index, 'ctaUrl', e.target.value)} />
                        <input type="number" className={inputClass} placeholder="Sort order" value={slide.sortOrder ?? index} onChange={(e) => updateSlide(index, 'sortOrder', e.target.value)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={slide.isActive !== false} onChange={(e) => updateSlide(index, 'isActive', e.target.checked)} /> Published</label>
                        <button type="button" onClick={() => removeSlide(index)} className="text-rose-400 hover:text-rose-300 text-sm font-semibold"><Trash2 size={15} className="inline mr-1" /> Remove slide</button>
                      </div>
                    </div>
                  ))}
                  {(siteContent?.homeSlideshow || []).length === 0 && <p className="text-sm text-slate-500">No custom slides yet. The homepage uses its fallback banner until you publish one.</p>}
                </div>
              </Section>

              {/* Sticky Save Button for CMS */}
              <div className="sticky bottom-4 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-2xl z-50">
                <div>
                  <div className="font-semibold text-white">Save Site Content</div>
                  <div className="text-xs text-slate-500">Publish your site content updates instantly.</div>
                </div>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 font-semibold text-white transition"
                >
                  {saving ? (
                    <><Loader2 size={16} className="inline animate-spin mr-2" /> Saving...</>
                  ) : (
                    <><Save size={16} className="inline mr-2" /> Publish Content</>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ===================================================
            PRODUCTS LIST
        ==================================================== */}

        {activeTab ===
          'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Products
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Fully dynamic catalog management.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={
                    loadEverything
                  }
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
                >
                  <RefreshCw
                    size={16}
                    className="inline mr-2"
                  />
                  Refresh
                </button>

                <button
                  onClick={() => {
                    resetProduct();
                    setActiveTab(
                      'add-product'
                    );
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold"
                >
                  <Plus
                    size={16}
                    className="inline mr-2"
                  />
                  Add Product
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <input
                value={
                  productSearch
                }
                onChange={(e) =>
                  setProductSearch(
                    e.target.value
                  )
                }
                placeholder="Search name, SKU, category, subcategory..."
                className={inputClass}
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-500">
                  <Loader2
                    className="animate-spin inline mr-2"
                  />
                  Loading products...
                </div>
              ) : filteredProducts.length ===
                0 ? (
                <div className="p-12 text-center text-slate-500">
                  No products found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="text-left px-5 py-4">
                          Product
                        </th>

                        <th className="text-left px-5 py-4">
                          Category
                        </th>

                        <th className="text-left px-5 py-4">
                          Price
                        </th>

                        <th className="text-left px-5 py-4">
                          Stock
                        </th>

                        <th className="text-left px-5 py-4">
                          Status
                        </th>

                        <th className="text-right px-5 py-4">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.map(
                        (product) => (
                          <tr
                            key={
                              product._id
                            }
                            className="border-t border-slate-800"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {product.imageUrl ? (
                                  <img
                                    src={
                                      product.imageUrl
                                    }
                                    alt={
                                      product.name
                                    }
                                    className="w-12 h-12 rounded-lg object-cover bg-slate-950"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center">
                                    <Package
                                      size={
                                        18
                                      }
                                    />
                                  </div>
                                )}

                                <div>
                                  <div className="font-semibold text-white">
                                    {
                                      product.name
                                    }
                                  </div>

                                  <div className="text-xs text-slate-500">
                                    {
                                      product.sku
                                    }
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-slate-300">
                              <div>
                                {
                                  product.category ||
                                    '—'
                                }
                              </div>

                              {product.subcategory && (
                                <div className="text-xs text-slate-500">
                                  {
                                    product.subcategory
                                  }
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-semibold">
                                {product.displayCurrency ||
                                  product.baseCurrency ||
                                  'INR'}{' '}
                                {product.displayPrice ??
                                  product.price ??
                                  0}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {product.stock ??
                                0}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1">
                                {!product.archived && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                                    Active
                                  </span>
                                )}

                                {product.featured && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">
                                    Featured
                                  </span>
                                )}

                                {product.isDirectPurchaseAllowed ? (
                                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                                    Buy
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
                                    RFQ
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() =>
                                    handleEditProduct(
                                      product
                                    )
                                  }
                                  className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white"
                                >
                                  <Pencil
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <div className="flex items-center gap-2">
  {/* Archive / Unarchive Button */}
  <button
    onClick={() => handleToggleArchive(product._id)}
    title={product.archived ? "Unarchive Product" : "Archive Product"}
    className={`p-2 rounded-lg transition-colors ${
      product.archived 
        ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
        : "bg-orange-50 text-orange-600 hover:bg-orange-100"
    }`}
  >
    {product.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
  </button>

  {/* Permanent Delete Button */}
  <button
    onClick={() => handlePermanentDelete(product._id)}
    title="Permanently Delete"
    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
  >
    <Trash2 size={18} />
  </button>
</div>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            CATEGORY MANAGER
        ==================================================== */}

        {activeTab ===
          'categories' && (
          <div className="space-y-6 max-w-6xl">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Category & Subcategory Manager
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Admin controls hierarchy and dynamic product specification templates.
              </p>
            </div>

            <form
              onSubmit={
                handleSaveCategory
              }
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {editingCategory
                    ? 'Edit Category'
                    : 'Create Category / Subcategory'}
                </h2>

                {editingCategory && (
                  <button
                    type="button"
                    onClick={
                      resetCategory
                    }
                    className="text-slate-400 hover:text-white"
                  >
                    <X />
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Name *">
                  <input
                    className={
                      inputClass
                    }
                    value={
                      categoryForm.name
                    }
                    onChange={(e) =>
                      handleCategoryChange(
                        'name',
                        e.target.value
                      )
                    }
                    required
                  />
                </Field>

                <Field label="Parent">
                  <select
                    className={
                      inputClass
                    }
                    value={
                      categoryForm.parent
                    }
                    onChange={(e) => {
                      const parentId = e.target.value;
                      const parentCategory = rootCategories.find((category) => String(category._id) === parentId);
                      handleCategoryChange('parent', parentId);
                      if (parentCategory) handleCategoryChange('storeType', parentCategory.storeType || 'B2B');
                    }}
                  >
                    <option value="">
                      Main Category
                    </option>

                    {rootCategories.map(
                      (category) => (
                        <option
                          key={
                            category._id
                          }
                          value={
                            category._id
                          }
                        >
                          {
                            `${category.name} — ${category.storeType || 'B2B'}`
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Storefront *">
                  <select
                    className={inputClass}
                    value={categoryForm.storeType || 'B2B'}
                    onChange={(e) => handleCategoryChange('storeType', e.target.value)}
                    disabled={Boolean(categoryForm.parent)}
                  >
                    <option value="B2B">Scientific Store (B2B)</option>
                    <option value="B2C">Lifestyle Store (B2C)</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Subcategories automatically use their parent storefront.</p>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  className={
                    textareaClass
                  }
                  value={
                    categoryForm.description
                  }
                  onChange={(e) =>
                    handleCategoryChange(
                      'description',
                      e.target.value
                    )
                  }
                />
              </Field>

              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Image URL">
                  <input
                    className={
                      inputClass
                    }
                    value={
                      categoryForm.imageUrl
                    }
                    onChange={(e) =>
                      handleCategoryChange(
                        'imageUrl',
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Sort Order">
                  <input
                    type="number"
                    className={
                      inputClass
                    }
                    value={
                      categoryForm.sortOrder
                    }
                    onChange={(e) =>
                      handleCategoryChange(
                        'sortOrder',
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Active">
                  <label className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        categoryForm.isActive
                      }
                      onChange={(e) =>
                        handleCategoryChange(
                          'isActive',
                          e.target.checked
                        )
                      }
                    />

                    <span className="text-sm">
                      Published
                    </span>
                  </label>
                </Field>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-950 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Dynamic Specification Templates
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      No hardcoded Material / Size / Capacity etc.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addCategoryField
                    }
                    className="px-3 py-2 rounded-lg bg-blue-600 text-sm"
                  >
                    <Plus
                      size={14}
                      className="inline mr-1"
                    />
                    Add Field
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {safeArray(
                    categoryForm.specificationFields
                  ).length === 0 && (
                    <p className="text-sm text-slate-500">
                      No template fields configured.
                    </p>
                  )}

                  {safeArray(
                    categoryForm.specificationFields
                  ).map(
                    (
                      field,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="grid md:grid-cols-[1.4fr_1fr_1.5fr_auto_auto] gap-2 items-center"
                      >
                        <input
                          className={
                            inputClass
                          }
                          placeholder="Field name"
                          value={
                            field.name
                          }
                          onChange={(
                            e
                          ) =>
                            updateCategoryField(
                              index,
                              'name',
                              e
                                .target
                                .value
                            )
                          }
                        />

                        <select
                          className={
                            inputClass
                          }
                          value={
                            field.type
                          }
                          onChange={(
                            e
                          ) =>
                            updateCategoryField(
                              index,
                              'type',
                              e
                                .target
                                .value
                            )
                          }
                        >
                          <option value="text">
                            Text
                          </option>

                          <option value="number">
                            Number
                          </option>

                          <option value="select">
                            Select
                          </option>

                          <option value="boolean">
                            Boolean
                          </option>
                        </select>

                        <input
                          className={
                            inputClass
                          }
                          placeholder={
                            field.type ===
                            'select'
                              ? 'Option1, Option2'
                              : 'Unit / optional'
                          }
                          value={
                            field.type ===
                            'select'
                              ? safeArray(
                                  field.options
                                ).join(
                                  ', '
                                )
                              : field.unit ||
                                ''
                          }
                          onChange={(
                            e
                          ) => {
                            if (
                              field.type ===
                              'select'
                            ) {
                              updateCategoryField(
                                index,
                                'options',
                                e.target.value
                                  .split(
                                    ','
                                  )
                                  .map(
                                    (
                                      value
                                    ) =>
                                      value.trim()
                                  )
                                  .filter(
                                    Boolean
                                  )
                              );
                            } else {
                              updateCategoryField(
                                index,
                                'unit',
                                e.target.value
                              );
                            }
                          }}
                        />

                        <label className="flex items-center gap-2 text-xs text-slate-400">
                          <input
                            type="checkbox"
                            checked={
                              field.required
                            }
                            onChange={(
                              e
                            ) =>
                              updateCategoryField(
                                index,
                                'required',
                                e
                                  .target
                                  .checked
                              )
                            }
                          />
                          Required
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            removeCategoryField(
                              index
                            )
                          }
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2
                            size={
                              16
                            }
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="inline animate-spin mr-2"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save
                      size={16}
                      className="inline mr-2"
                    />
                    {editingCategory
                      ? 'Update'
                      : 'Create'}
                  </>
                )}
              </button>
            </form>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-5">
                Existing Catalog Structure
              </h2>

              <div className="space-y-3">
                {rootCategories.map(
                  (category) => {
                    const children =
                      getSubcategories(
                        category._id
                      );

                    return (
                      <div
                        key={
                          category._id
                        }
                        className="border border-slate-800 rounded-xl overflow-hidden"
                      >
                        <div className="p-4 bg-slate-950 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">
                              {
                                category.name
                              }
                            </div>

                            <div className="text-xs text-slate-500">
                              {children.length}{' '}
                              subcategories
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleEditCategory(
                                  category
                                )
                              }
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400"
                            >
                              <Pencil
                                size={
                                  16
                                }
                              />
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteCategory(
                                  category._id
                                )
                              }
                              className="p-2 rounded-lg bg-rose-500/10 text-rose-400"
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />
                            </button>
                          </div>
                        </div>

                        {children.length >
                          0 && (
                          <div className="p-3 space-y-2">
                            {children.map(
                              (
                                child
                              ) => (
                                <div
                                  key={
                                    child._id
                                  }
                                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-950"
                                >
                                  <div>
                                    <span className="text-slate-300">
                                      {
                                        child.name
                                      }
                                    </span>

                                    <span className="text-xs text-slate-600 ml-2">
                                      Subcategory
                                    </span>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleEditCategory(
                                          child
                                        )
                                      }
                                      className="p-2 text-blue-400"
                                    >
                                      <Pencil
                                        size={
                                          14
                                        }
                                      />
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleDeleteCategory(
                                          child._id
                                        )
                                      }
                                      className="p-2 text-rose-400"
                                    >
                                      <Trash2
                                        size={
                                          14
                                        }
                                      />
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            ADD / EDIT PRODUCT
        ==================================================== */}

        {activeTab === 'add-product' && (
          <ProductAdminForm
            editingProduct={editingProduct}
            productForm={productForm}
            products={products}
            rootCategories={rootCategories}
            selectedSubcategories={selectedSubcategories}
            activeCurrencies={activeCurrencies}
            saving={saving}
            uploading={uploading}
            expandedSections={expandedSections}

            metadataText={metadataText}
            setMetadataText={setMetadataText}

            onSubmit={
              editingProduct
                ? handleUpdateProduct
                : handleAddProduct
            }

            onCancel={() => {
              resetProduct();
              setActiveTab('products');
            }}

            updateProduct={updateProduct}
            updateNestedProduct={updateNestedProduct}
            handleProductCategoryChange={handleProductCategoryChange}
            handleProductSubcategoryChange={handleProductSubcategoryChange}

            syncCurrencyRates={syncCurrencyRates}
            addCurrencyPricing={addCurrencyPricing}
            updateCurrencyPricing={updateCurrencyPricing}
            removeCurrencyPricing={removeCurrencyPricing}
            updateCurrencyPrice={updateCurrencyPrice}
            removeCurrencyPrice={removeCurrencyPrice}

            addQuantityTier={addQuantityTier}
            updateQuantityTier={updateQuantityTier}
            removeQuantityTier={removeQuantityTier}

            handleMainImageUpload={handleMainImageUpload}
            addImage={addImage}
            updateImage={updateImage}
            removeImage={removeImage}

            addSpecification={addSpecification}
            updateSpecification={updateSpecification}
            removeSpecification={removeSpecification}

            addVariant={addVariant}
            updateVariant={updateVariant}
            removeVariant={removeVariant}
            addVariantAttribute={addVariantAttribute}
            updateVariantAttribute={updateVariantAttribute}
            removeVariantAttribute={removeVariantAttribute}

            addFeature={addFeature}
            updateFeature={updateFeature}
            removeFeature={removeFeature}

            addApplication={addApplication}
            updateApplication={updateApplication}
            removeApplication={removeApplication}

            addDocument={addDocument}
            updateDocument={updateDocument}
            removeDocument={removeDocument}

            addRelatedProduct={addRelatedProduct}
            removeRelatedProduct={removeRelatedProduct}

            toggleSection={toggleSection}
          />
        )}

      </main>
    </div>
  );
};

export default AdminPage;
