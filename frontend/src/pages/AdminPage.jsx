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
  Settings2
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
      related: false
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
      fetchCurrencies()
    ]);
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
        `${API_BASE_URL}/products?includeArchived=true&limit=100`
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
        await api.put(
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

  const addCurrencyPrice = (
    code
  ) => {
    setProductForm((prev) => ({
      ...prev,

      currencyPrices: {
        ...(prev.currencyPrices || {}),

        [code]:
          prev.currencyPrices?.[
            code
          ] ?? ''
      }
    }));
  };

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
            result[normalizedCode] = {
              mode,
              multiplier:
                Number.isFinite(multiplier) && multiplier >= 0
                  ? multiplier
                  : 1,
              overridePrice:
                Number.isFinite(overridePrice) && overridePrice >= 0
                  ? overridePrice
                  : null,
              enabled:
                config?.enabled !== false
            };
            return result;
          },
          {}
        );

      const payload = {
        ...productForm,

        sku:
          String(
            productForm.sku ||
              ''
          )
            .trim()
            .toUpperCase(),

        name:
          String(
            productForm.name ||
              ''
          ).trim(),

        categoryId:
          productForm.categoryId ||
          null,

        subcategoryId:
          productForm.subcategoryId ||
          null,

        category:
          productForm.category ||
          '',

        subcategory:
          productForm.subcategory ||
          '',

        price:
          numberOrZero(
            productForm.price
          ),

        baseCurrency:
          String(
            productForm.baseCurrency ||
              'INR'
          )
            .trim()
            .toUpperCase(),

        currencyPrices,

        currencyPricing,

        pricing: {
          pricingMode:
            productForm.pricing
              ?.pricingMode ||
            'base',

          allowCurrencyConversion:
            productForm.pricing
              ?.allowCurrencyConversion !==
            false,

          allowQuantityPricing:
            Boolean(
              productForm.pricing
                ?.allowQuantityPricing
            ),

          quantityTiers:
            safeArray(
              productForm.pricing
                ?.quantityTiers
            )
              .map(
                (tier) => ({
                  minQuantity:
                    integerOr(
                      tier.minQuantity,
                      1
                    ),

                  maxQuantity:
                    tier.maxQuantity ===
                      '' ||
                    tier.maxQuantity ===
                      null ||
                    tier.maxQuantity ===
                      undefined
                      ? null
                      : integerOr(
                          tier.maxQuantity,
                          null
                        ),

                  price:
                    numberOrZero(
                      tier.price
                    ),

                  currency:
                    String(
                      tier.currency ||
                        productForm.baseCurrency ||
                        'INR'
                    )
                      .trim()
                      .toUpperCase()
                })
              )
              .filter(
                (tier) =>
                  tier.minQuantity >
                    0 &&
                  tier.price >= 0
              )
        },

        moq:
          Math.max(
            1,
            integerOr(
              productForm.moq,
              1
            )
          ),

        stock:
          Math.max(
            0,
            numberOrZero(
              productForm.stock
            )
          ),

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

  const handleDeleteProduct = async (
    id
  ) => {
    if (
      !window.confirm(
        'Delete/archive this product?'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `${API_BASE_URL}/products/${id}`,
        getAuthConfig()
      );

      await fetchProducts();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          'Unable to delete product.'
      );
    }
  };

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

                                <button
                                  onClick={() =>
                                    handleDeleteProduct(
                                      product._id
                                    )
                                  }
                                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white"
                                >
                                  <Trash2
                                    size={
                                      16
                                    }
                                  />
                                </button>
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
                    onChange={(e) =>
                      handleCategoryChange(
                        'parent',
                        e.target.value
                      )
                    }
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
                            category.name
                          }
                        </option>
                      )
                    )}
                  </select>
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

        {activeTab ===
          'add-product' && (
          <form
            onSubmit={
              editingProduct
                ? handleUpdateProduct
                : handleAddProduct
            }
            className="max-w-6xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {editingProduct
                    ? 'Edit Product'
                    : 'Create Product'}
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Every product attribute remains admin-configurable.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetProduct();
                  setActiveTab(
                    'products'
                  );
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>

            {/* BASIC */}

            <Section id="basic" open={expandedSections["basic"]} onToggle={toggleSection}
              title="Basic Product Information"
              right={
                <Settings2
                  size={17}
                  className="text-blue-400"
                />
              }
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="SKU *">
                  <input
                    className={
                      inputClass
                    }
                    value={
                      productForm.sku
                    }
                    onChange={(e) =>
                      updateProduct(
                        'sku',
                        e.target.value
                      )
                    }
                    required
                  />
                </Field>

                <Field label="Product Name *">
                  <input
                    className={
                      inputClass
                    }
                    value={
                      productForm.name
                    }
                    onChange={(e) =>
                      updateProduct(
                        'name',
                        e.target.value
                      )
                    }
                    required
                  />
                </Field>

                <Field label="Category">
                  <select
                    className={
                      inputClass
                    }
                    value={
                      productForm.categoryId
                    }
                    onChange={(e) =>
                      handleProductCategoryChange(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select category
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
                            category.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Subcategory">
                  <select
                    className={
                      inputClass
                    }
                    value={
                      productForm.subcategoryId
                    }
                    onChange={(e) =>
                      handleProductSubcategoryChange(
                        e.target.value
                      )
                    }
                    disabled={
                      !productForm.categoryId
                    }
                  >
                    <option value="">
                      No subcategory
                    </option>

                    {selectedSubcategories.map(
                      (subcategory) => (
                        <option
                          key={
                            subcategory._id
                          }
                          value={
                            subcategory._id
                          }
                        >
                          {
                            subcategory.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mt-4">
                <Field label="Base Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={
                      inputClass
                    }
                    value={
                      productForm.price
                    }
                    onChange={(e) =>
                      updateProduct(
                        'price',
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Base Currency">
                  <select
                    className={
                      inputClass
                    }
                    value={
                      productForm.baseCurrency
                    }
                    onChange={(e) =>
                      updateProduct(
                        'baseCurrency',
                        e.target.value
                      )
                    }
                  >
                    {activeCurrencies.map(
                      (currency) => (
                        <option
                          key={
                            currency.code
                          }
                          value={
                            currency.code
                          }
                        >
                          {
                            currency.code
                          }{' '}
                          {currency.symbol
                            ? `(${currency.symbol})`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="MOQ">
                  <input
                    type="number"
                    min="1"
                    className={
                      inputClass
                    }
                    value={
                      productForm.moq
                    }
                    onChange={(e) =>
                      updateProduct(
                        'moq',
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Stock">
                  <input
                    type="number"
                    min="0"
                    className={
                      inputClass
                    }
                    value={
                      productForm.stock
                    }
                    onChange={(e) =>
                      updateProduct(
                        'stock',
                        e.target.value
                      )
                    }
                  />
                </Field>
              </div>

              <div className="grid md:grid-cols-4 gap-3 mt-5">
                <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      productForm.isDirectPurchaseAllowed
                    }
                    onChange={(e) =>
                      updateProduct(
                        'isDirectPurchaseAllowed',
                        e.target.checked
                      )
                    }
                  />
                  Direct Purchase
                </label>

                <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      productForm.archived
                    }
                    onChange={(e) =>
                      updateProduct(
                        'archived',
                        e.target.checked
                      )
                    }
                  />
                  Archived
                </label>

                <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      productForm.featured
                    }
                    onChange={(e) =>
                      updateProduct(
                        'featured',
                        e.target.checked
                      )
                    }
                  />
                  Featured
                </label>

                <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      productForm.published
                    }
                    onChange={(e) =>
                      updateProduct(
                        'published',
                        e.target.checked
                      )
                    }
                  />
                  Published
                </label>
              </div>
            </Section>

            {/* PRICING */}

            <Section id="pricing" open={expandedSections["pricing"]} onToggle={toggleSection} title="Dynamic Pricing & Currency">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 mb-5">
                <div className="font-semibold text-blue-950">Currency pricing formula</div>
                <p className="text-sm text-blue-800 mt-1 leading-6">
                  Auto = Base Price × configured FX rate. Multiplier = Base Price × FX rate × your multiplier. Override = exact selling price.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Pricing Mode">
                  <select className={inputClass} value={productForm.pricing?.pricingMode || 'base'} onChange={(e) => updateNestedProduct('pricing','pricingMode',e.target.value)}>
                    <option value="base">Base Price</option>
                    <option value="currency">Currency Overrides</option>
                    <option value="rule">Pricing Rules</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm self-end">
                  <input type="checkbox" checked={productForm.pricing?.allowCurrencyConversion !== false} onChange={(e) => updateNestedProduct('pricing','allowCurrencyConversion',e.target.checked)} />
                  Allow Currency Conversion
                </label>
                <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm self-end">
                  <input type="checkbox" checked={productForm.pricing?.allowQuantityPricing || false} onChange={(e) => updateNestedProduct('pricing','allowQuantityPricing',e.target.checked)} />
                  Quantity Pricing
                </label>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-slate-900">Currency Pricing Strategy</h3>
                <p className="text-xs text-slate-500 mt-1">Configure each currency independently. No hardcoded USD/EUR pricing is required.</p>
                <button type="button" onClick={syncCurrencyRates} className="mt-3 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Refresh FX Rates</button>

                <div className="space-y-3 mt-4">
                  {Object.entries(productForm.currencyPricing || {})
                    .filter(([code]) => String(code || '').trim())
                    .map(([rawCode, config]) => {
                    const code = String(rawCode).trim().toUpperCase();
                    const currency = activeCurrencies.find((item) => String(item.code || '').trim().toUpperCase() === code);
                    const rate = Number(currency?.rateFromBase);
                    const base = numberOrZero(productForm.price);
                    const multiplier = Number(config?.multiplier ?? 1);
                    const autoAmount = Number.isFinite(rate) && rate > 0 ? base * rate : null;
                    const multiplierAmount = autoAmount !== null ? autoAmount * (Number.isFinite(multiplier) ? multiplier : 1) : null;
                    return (
                      <div key={code} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="grid lg:grid-cols-[120px_180px_1fr_1fr_auto] gap-3 items-end">
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase">Currency</div>
                            <div className="mt-1 h-11 flex items-center px-3 rounded-xl bg-slate-100 text-slate-900 font-bold">{code} {currency?.symbol || ''}</div>
                          </div>
                          <Field label="Mode">
                            <select className={inputClass} value={config?.mode || 'auto'} onChange={(e) => updateCurrencyPricing(code,'mode',e.target.value)}>
                              <option value="auto">Auto FX Rate</option>
                              <option value="multiplier">FX × Multiplier</option>
                              <option value="override">Exact Override</option>
                            </select>
                          </Field>
                          {config?.mode === 'override' ? (
                            <Field label="Exact Selling Price">
                              <input type="number" min="0" step="0.01" className={inputClass} value={config?.overridePrice ?? config?.price ?? ''} onChange={(e) => updateCurrencyPricing(code,'overridePrice',e.target.value)} placeholder={`Price in ${code}`} />
                            </Field>
                          ) : (
                            <Field label="Multiplier">
                              <input type="number" min="0" step="0.01" className={inputClass} value={config?.multiplier ?? 1} disabled={config?.mode !== 'multiplier'} onChange={(e) => updateCurrencyPricing(code,'multiplier',e.target.value)} placeholder="1.00" />
                            </Field>
                          )}
                          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 min-h-11">
                            <div className="text-[11px] uppercase font-semibold text-slate-500">Preview</div>
                            <div className="font-bold text-slate-900">
                              {config?.mode === 'override' ? ((config?.overridePrice ?? config?.price) !== '' && (config?.overridePrice ?? config?.price) !== null && (config?.overridePrice ?? config?.price) !== undefined ? `${code} ${Number(config?.overridePrice ?? config?.price).toFixed(2)}` : '—') : config?.mode === 'multiplier' ? (multiplierAmount !== null ? `${code} ${multiplierAmount.toFixed(2)}` : 'Rate unavailable') : autoAmount !== null ? `${code} ${autoAmount.toFixed(2)}` : 'Rate unavailable'}
                            </div>
                            {Number.isFinite(rate) && rate > 0 && <div className="text-[11px] text-slate-500 mt-1">1 {productForm.baseCurrency || 'INR'} = {rate} {code}</div>}
                          </div>
                          <button type="button" onClick={() => removeCurrencyPricing(code)} className="h-11 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {activeCurrencies.filter((currency) => !productForm.currencyPricing?.[currency.code]).map((currency) => (
                    <button key={currency.code} type="button" onClick={() => addCurrencyPricing(currency.code)} className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">+ {currency.code}</button>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="font-semibold">Legacy Exact Currency Overrides</h3>
                <p className="text-xs text-slate-500 mt-1">Existing currencyPrices remain supported for old products.</p>
                <div className="space-y-2 mt-3">
                  {Object.entries(productForm.currencyPrices || {}).map(([code,value]) => (
                    <div key={code} className="grid grid-cols-[120px_1fr_auto] gap-2">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">{code}</div>
                      <input type="number" min="0" step="0.000001" className={inputClass} value={value} onChange={(e) => updateCurrencyPrice(code,e.target.value)} />
                      <button type="button" onClick={() => removeCurrencyPrice(code)} className="p-2 text-rose-400"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* QUANTITY */}

            <Section id="quantityPricing" open={expandedSections["quantityPricing"]} onToggle={toggleSection}
              title="Quantity Tier Pricing"
            >
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={
                    addQuantityTier
                  }
                  className="px-3 py-2 rounded-lg bg-blue-600 text-sm"
                >
                  <Plus
                    size={14}
                    className="inline mr-1"
                  />
                  Add Tier
                </button>
              </div>

              <div className="space-y-3">
                {safeArray(
                  productForm.pricing
                    ?.quantityTiers
                ).map(
                  (
                    tier,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="grid md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2"
                    >
                      <input
                        type="number"
                        min="1"
                        placeholder="Min qty"
                        className={
                          inputClass
                        }
                        value={
                          tier.minQuantity
                        }
                        onChange={(
                          e
                        ) =>
                          updateQuantityTier(
                            index,
                            'minQuantity',
                            e
                              .target
                              .value
                          )
                        }
                      />

                      <input
                        type="number"
                        min="1"
                        placeholder="Max qty"
                        className={
                          inputClass
                        }
                        value={
                          tier.maxQuantity
                        }
                        onChange={(
                          e
                        ) =>
                          updateQuantityTier(
                            index,
                            'maxQuantity',
                            e
                              .target
                              .value
                          )
                        }
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        className={
                          inputClass
                        }
                        value={
                          tier.price
                        }
                        onChange={(
                          e
                        ) =>
                          updateQuantityTier(
                            index,
                            'price',
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
                          tier.currency
                        }
                        onChange={(
                          e
                        ) =>
                          updateQuantityTier(
                            index,
                            'currency',
                            e
                              .target
                              .value
                          )
                        }
                      >
                        {activeCurrencies.map(
                          (
                            currency
                          ) => (
                            <option
                              key={
                                currency.code
                              }
                              value={
                                currency.code
                              }
                            >
                              {
                                currency.code
                              }
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          removeQuantityTier(
                            index
                          )
                        }
                        className="p-2 text-rose-400"
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
            </Section>

            {/* MEDIA */}

            <Section id="media" open={expandedSections["media"]} onToggle={toggleSection}
              title="Images & Documents"
            >
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Main Image URL">
                    <input
                      className={
                        inputClass
                      }
                      value={
                        productForm.imageUrl
                      }
                      onChange={(e) =>
                        updateProduct(
                          'imageUrl',
                          e.target.value
                        )
                      }
                    />
                  </Field>

                  <Field label="Upload Main Image">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleMainImageUpload
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>
                </div>

                {productForm.imageUrl && (
                  <img
                    src={
                      productForm.imageUrl
                    }
                    alt={
                      productForm.name
                    }
                    className="w-32 h-32 object-cover rounded-xl border border-slate-800"
                  />
                )}

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">
                      Product Gallery
                    </h3>

                    <button
                      type="button"
                      onClick={
                        addImage
                      }
                      className="px-3 py-2 rounded-lg bg-blue-600 text-sm"
                    >
                      <Plus
                        size={14}
                        className="inline mr-1"
                      />
                      Add Image
                    </button>
                  </div>

                  <div className="space-y-3">
                    {safeArray(
                      productForm.images
                    ).map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="grid md:grid-cols-[1fr_1fr_100px_auto_auto] gap-2 items-center"
                        >
                          <input
                            className={
                              inputClass
                            }
                            placeholder="Image URL"
                            value={
                              image.url
                            }
                            onChange={(
                              e
                            ) =>
                              updateImage(
                                index,
                                'url',
                                e
                                  .target
                                  .value
                              )
                            }
                          />

                          <input
                            className={
                              inputClass
                            }
                            placeholder="Alt text"
                            value={
                              image.alt
                            }
                            onChange={(
                              e
                            ) =>
                              updateImage(
                                index,
                                'alt',
                                e
                                  .target
                                  .value
                              )
                            }
                          />

                          <input
                            type="number"
                            className={
                              inputClass
                            }
                            value={
                              image.sortOrder
                            }
                            onChange={(
                              e
                            ) =>
                              updateImage(
                                index,
                                'sortOrder',
                                e
                                  .target
                                  .value
                              )
                            }
                          />

                          <label className="text-xs flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={
                                image.isPrimary
                              }
                              onChange={(
                                e
                              ) =>
                                updateImage(
                                  index,
                                  'isPrimary',
                                  e
                                    .target
                                    .checked
                                )
                              }
                            />
                            Primary
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index
                              )
                            }
                            className="p-2 text-rose-400"
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

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">
                      Documents
                    </h3>

                    <button
                      type="button"
                      onClick={
                        addDocument
                      }
                      className="px-3 py-2 rounded-lg bg-blue-600 text-sm"
                    >
                      <Plus
                        size={14}
                        className="inline mr-1"
                      />
                      Add Document
                    </button>
                  </div>

                  <div className="space-y-3">
                    {safeArray(
                      productForm.documents
                    ).map(
                      (
                        document,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="grid md:grid-cols-[1fr_2fr_1fr_auto] gap-2"
                        >
                          <input
                            className={
                              inputClass
                            }
                            placeholder="Document name"
                            value={
                              document.name
                            }
                            onChange={(
                              e
                            ) =>
                              updateDocument(
                                index,
                                'name',
                                e
                                  .target
                                  .value
                              )
                            }
                          />

                          <input
                            className={
                              inputClass
                            }
                            placeholder="Document URL"
                            value={
                              document.url
                            }
                            onChange={(
                              e
                            ) =>
                              updateDocument(
                                index,
                                'url',
                                e
                                  .target
                                  .value
                              )
                            }
                          />

                          <input
                            className={
                              inputClass
                            }
                            placeholder="PDF / Datasheet / Manual"
                            value={
                              document.type
                            }
                            onChange={(
                              e
                            ) =>
                              updateDocument(
                                index,
                                'type',
                                e
                                  .target
                                  .value
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeDocument(
                                index
                              )
                            }
                            className="p-2 text-rose-400"
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
              </div>
            </Section>

            {/* SPECS */}

            <Section id="specifications" open={expandedSections["specifications"]} onToggle={toggleSection}
              title="Dynamic Specifications"
            >
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={
                    addSpecification
                  }
                  className="px-3 py-2 rounded-lg bg-blue-600 text-sm"
                >
                  <Plus
                    size={14}
                    className="inline mr-1"
                  />
                  Add Specification
                </button>
              </div>

              <div className="space-y-3">
                {safeArray(
                  productForm.specifications
                ).map(
                  (
                    spec,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="grid md:grid-cols-[1fr_2fr_auto] gap-2"
                    >
                      <input
                        className={
                          inputClass
                        }
                        placeholder="Specification name"
                        value={
                          spec.name
                        }
                        onChange={(
                          e
                        ) =>
                          updateSpecification(
                            index,
                            'name',
                            e
                              .target
                              .value
                          )
                        }
                      />

                      <input
                        className={
                          inputClass
                        }
                        placeholder="Specification value"
                        value={
                          spec.value
                        }
                        onChange={(
                          e
                        ) =>
                          updateSpecification(
                            index,
                            'value',
                            e
                              .target
                              .value
                          )
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeSpecification(
                            index
                          )
                        }
                        className="p-2 text-rose-400"
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

                {safeArray(
                  productForm.specifications
                ).length ===
                  0 && (
                  <p className="text-sm text-slate-500">
                    No specifications. Add any fields required for this product.
                  </p>
                )}
              </div>
            </Section>

            {/* VARIANTS */}

            <Section id="variants" open={expandedSections["variants"]} onToggle={toggleSection}
              title="Dynamic Variants & Options"
            >
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={
                    addVariant
                  }
                  className="px-3 py-2 rounded-lg bg-blue-600 text-sm"
                >
                  <Plus
                    size={14}
                    className="inline mr-1"
                  />
                  Add Variant
                </button>
              </div>

              <div className="space-y-5">
                {safeArray(
                  productForm.variants
                ).map(
                  (
                    variant,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="border border-slate-800 rounded-xl p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          Variant #
                          {index +
                            1}
                        </h3>

                        <button
                          type="button"
                          onClick={() =>
                            removeVariant(
                              index
                            )
                          }
                          className="text-rose-400"
                        >
                          <Trash2
                            size={
                              16
                            }
                          />
                        </button>
                      </div>

                      <div className="grid md:grid-cols-4 gap-3">
                        <input
                          className={
                            inputClass
                          }
                          placeholder="Variant name"
                          value={
                            variant.name
                          }
                          onChange={(
                            e
                          ) =>
                            updateVariant(
                              index,
                              'name',
                              e
                                .target
                                .value
                            )
                          }
                        />

                        <input
                          className={
                            inputClass
                          }
                          placeholder="Variant SKU"
                          value={
                            variant.sku
                          }
                          onChange={(
                            e
                          ) =>
                            updateVariant(
                              index,
                              'sku',
                              e
                                .target
                                .value
                            )
                          }
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={
                            inputClass
                          }
                          placeholder="Variant price"
                          value={
                            variant.price
                          }
                          onChange={(
                            e
                          ) =>
                            updateVariant(
                              index,
                              'price',
                              e
                                .target
                                .value
                            )
                          }
                        />

                        <input
                          type="number"
                          min="0"
                          className={
                            inputClass
                          }
                          placeholder="Variant stock"
                          value={
                            variant.stock
                          }
                          onChange={(
                            e
                          ) =>
                            updateVariant(
                              index,
                              'stock',
                              e
                                .target
                                .value
                            )
                          }
                        />
                      </div>

                      <input
                        className={
                          inputClass
                        }
                        placeholder="Variant image URL"
                        value={
                          variant.imageUrl ||
                          ''
                        }
                        onChange={(
                          e
                        ) =>
                          updateVariant(
                            index,
                            'imageUrl',
                            e
                              .target
                              .value
                          )
                        }
                      />

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">
                            Variant Options
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              addVariantAttribute(
                                index
                              )
                            }
                            className="text-xs text-blue-400"
                          >
                            + Add Option
                          </button>
                        </div>

                        <div className="space-y-2">
                          {Object.entries(
                            variant.attributes ||
                              {}
                          ).map(
                            ([
                              key,
                              value
                            ]) => (
                              <div
                                key={
                                  key
                                }
                                className="grid grid-cols-[1fr_1fr_auto] gap-2"
                              >
                                <input
                                  className={
                                    inputClass
                                  }
                                  placeholder="Option name"
                                  value={
                                    key
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateVariantAttribute(
                                      index,
                                      key,
                                      e
                                        .target
                                        .value,
                                      value
                                    )
                                  }
                                />

                                <input
                                  className={
                                    inputClass
                                  }
                                  placeholder="Option value"
                                  value={
                                    value
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateVariantAttribute(
                                      index,
                                      key,
                                      key,
                                      e
                                        .target
                                        .value
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeVariantAttribute(
                                      index,
                                      key
                                    )
                                  }
                                  className="p-2 text-rose-400"
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

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={
                            variant.isActive !==
                            false
                          }
                          onChange={(
                            e
                          ) =>
                            updateVariant(
                              index,
                              'isActive',
                              e
                                .target
                                .checked
                            )
                          }
                        />
                        Variant Active
                      </label>
                    </div>
                  )
                )}

                {safeArray(
                  productForm.variants
                ).length ===
                  0 && (
                  <p className="text-sm text-slate-500">
                    No variants configured.
                  </p>
                )}
              </div>
            </Section>

            {/* CONTENT */}

            <Section id="content" open={expandedSections["content"]} onToggle={toggleSection}
              title="Product Content"
            >
              <div className="space-y-5">
                <Field label="Short Description">
                  <textarea
                    className={
                      textareaClass
                    }
                    value={
                      productForm.shortDescription
                    }
                    onChange={(e) =>
                      updateProduct(
                        'shortDescription',
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    className={`${textareaClass} min-h-[180px]`}
                    value={
                      productForm.description
                    }
                    onChange={(e) =>
                      updateProduct(
                        'description',
                        e.target.value
                      )
                    }
                  />
                </Field>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">
                      Features
                    </h3>

                    <button
                      type="button"
                      onClick={
                        addFeature
                      }
                      className="text-blue-400 text-sm"
                    >
                      + Add Feature
                    </button>
                  </div>

                  <div className="space-y-2">
                    {safeArray(
                      productForm.features
                    ).map(
                      (
                        feature,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="flex gap-2"
                        >
                          <input
                            className={
                              inputClass
                            }
                            value={
                              feature
                            }
                            onChange={(
                              e
                            ) =>
                              updateFeature(
                                index,
                                e
                                  .target
                                  .value
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeFeature(
                                index
                              )
                            }
                            className="p-2 text-rose-400"
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

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">
                      Applications
                    </h3>

                    <button
                      type="button"
                      onClick={
                        addApplication
                      }
                      className="text-blue-400 text-sm"
                    >
                      + Add Application
                    </button>
                  </div>

                  <div className="space-y-2">
                    {safeArray(
                      productForm.applications
                    ).map(
                      (
                        application,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="flex gap-2"
                        >
                          <input
                            className={
                              inputClass
                            }
                            value={
                              application
                            }
                            onChange={(
                              e
                            ) =>
                              updateApplication(
                                index,
                                e
                                  .target
                                  .value
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeApplication(
                                index
                              )
                            }
                            className="p-2 text-rose-400"
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
              </div>
            </Section>

            {/* SEO */}

            <Section id="seo" open={expandedSections["seo"]} onToggle={toggleSection}
              title="SEO"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="SEO Title">
                  <input
                    className={
                      inputClass
                    }
                    value={
                      productForm.seo
                        ?.title ||
                      ''
                    }
                    onChange={(e) =>
                      updateNestedProduct(
                        'seo',
                        'title',
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="SEO Slug">
                  <input
                    className={
                      inputClass
                    }
                    value={
                      productForm.seo
                        ?.slug ||
                      ''
                    }
                    onChange={(e) =>
                      updateNestedProduct(
                        'seo',
                        'slug',
                        e.target.value
                      )
                    }
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="SEO Description">
                  <textarea
                    className={
                      textareaClass
                    }
                    value={
                      productForm.seo
                        ?.description ||
                      ''
                    }
                    onChange={(e) =>
                      updateNestedProduct(
                        'seo',
                        'description',
                        e.target.value
                      )
                    }
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="SEO Keywords">
                  <input
                    className={
                      inputClass
                    }
                    value={
                      productForm.seo
                        ?.keywords ||
                      ''
                    }
                    onChange={(e) =>
                      updateNestedProduct(
                        'seo',
                        'keywords',
                        e.target.value
                      )
                    }
                    placeholder="keyword 1, keyword 2, keyword 3"
                  />
                </Field>
              </div>
            </Section>

            {/* RELATED */}

            <Section id="related" open={expandedSections["related"]} onToggle={toggleSection}
              title="Related Products"
            >
              <div className="space-y-3">
                <select
                  className={
                    inputClass
                  }
                  value=""
                  onChange={(e) =>
                    addRelatedProduct(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Add related product...
                  </option>

                  {products
                    .filter(
                      (product) =>
                        String(
                          product._id
                        ) !==
                        String(
                          editingProduct?._id
                        ) &&
                        !safeArray(
                          productForm.relatedProducts
                        ).some(
                          (id) =>
                            String(
                              id
                            ) ===
                            String(
                              product._id
                            )
                        )
                    )
                    .map(
                      (product) => (
                        <option
                          key={
                            product._id
                          }
                          value={
                            product._id
                          }
                        >
                          {
                            product.name
                          }{' '}
                          —{' '}
                          {
                            product.sku
                          }
                        </option>
                      )
                    )}
                </select>

                <div className="flex flex-wrap gap-2">
                  {safeArray(
                    productForm.relatedProducts
                  ).map(
                    (id) => {
                      const related =
                        products.find(
                          (product) =>
                            String(
                              product._id
                            ) ===
                            String(
                              id
                            )
                        );

                      return (
                        <div
                          key={
                            id
                          }
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
                        >
                          <span className="text-xs">
                            {related?.name ||
                              id}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeRelatedProduct(
                                id
                              )
                            }
                            className="text-rose-400"
                          >
                            <X
                              size={
                                14
                              }
                            />
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </Section>

            {/* METADATA */}

            <Section id="metadata" open={expandedSections["metadata"]} onToggle={toggleSection}
              title="Flexible Metadata"
            >
              <p className="text-xs text-slate-500 mb-3">
                Future fields can be stored here without changing the Mongo schema.
              </p>

              <textarea
                className={`${textareaClass} min-h-[220px] font-mono`}
                value={
                  metadataText
                }
                onChange={(e) =>
                  setMetadataText(
                    e.target.value
                  )
                }
                placeholder='{"brand":"","countryOfOrigin":"","customField":""}'
              />
            </Section>

            {/* SAVE */}

            <div className="sticky bottom-4 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
              <div>
                <div className="font-semibold">
                  {editingProduct
                    ? 'Update Product'
                    : 'Create Product'}
                </div>

                <div className="text-xs text-slate-500">
                  All configured dynamic data will be saved.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetProduct();
                    setActiveTab(
                      'products'
                    );
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    uploading
                  }
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
                      {editingProduct
                        ? 'Update Product'
                        : 'Create Product'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default AdminPage;