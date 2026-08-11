import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link,
  useParams,
  useNavigate
} from 'react-router-dom';

import api from '../lib/api';

import {
  Flame,
  Search,
  ChevronRight,
  MessageSquareQuote,
  Eye,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  SlidersHorizontal,
  X
} from 'lucide-react';

import InquiryModal from '../components/InquiryModal';

const HomePage = () => {
  const {
    categoryName,
    subcategoryName
  } = useParams();

  const navigate =
    useNavigate();

  const [
    products,
    setProducts
  ] = useState([]);

  const [
    dbCategories,
    setDbCategories
  ] = useState([]);

  const [
    searchQuery,
    setSearchQuery
  ] = useState('');

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    selectedProducts,
    setSelectedProducts
  ] = useState([]);

  const [
    isModalOpen,
    setIsModalOpen
  ] = useState(false);

  const [
    modalTitle,
    setModalTitle
  ] = useState('');

  const [
    selectedCurrency,
    setSelectedCurrency
  ] = useState(
    localStorage.getItem(
      'selectedCurrency'
    ) || 'INR'
  );

  const [
    sortBy,
    setSortBy
  ] = useState('default');

  const [
    showFilters,
    setShowFilters
  ] = useState(false);

  const [
    selectedSubcategory,
    setSelectedSubcategory
  ] = useState(
    subcategoryName
      ? decodeURIComponent(
          subcategoryName
        )
      : 'All'
  );

  // =========================================================
  // CURRENCY
  // =========================================================

  useEffect(() => {
    const updateCurrency = () => {
      setSelectedCurrency(
        localStorage.getItem(
          'selectedCurrency'
        ) || 'INR'
      );
    };

    window.addEventListener(
      'currencyChanged',
      updateCurrency
    );

    window.addEventListener(
      'storage',
      updateCurrency
    );

    return () => {
      window.removeEventListener(
        'currencyChanged',
        updateCurrency
      );

      window.removeEventListener(
        'storage',
        updateCurrency
      );
    };
  }, []);

  // =========================================================
  // FETCH DATA
  // =========================================================

  useEffect(() => {
    const fetchData =
      async () => {
        setLoading(true);

        try {
          const [
            productsResponse,
            categoriesResponse
          ] =
            await Promise.all([
              api.get(
                '/products',
                {
                  params: {
                    currency: selectedCurrency
                  }
                }
              ),
              api.get(
                '/categories'
              )
            ]);

          const productData =
            Array.isArray(
              productsResponse.data
            )
              ? productsResponse.data
              : productsResponse
                  .data?.data ||
                [];

          const categoryData =
            Array.isArray(
              categoriesResponse.data
            )
              ? categoriesResponse.data
              : categoriesResponse
                  .data?.data ||
                [];

          setProducts(
            productData
          );

          setDbCategories(
            categoryData
          );
        } catch (error) {
          console.error(
            'Error loading catalog:',
            error
          );

          setProducts([]);
          setDbCategories([]);
        } finally {
          setLoading(false);
        }
      };

    fetchData();
  }, [selectedCurrency]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getReferenceId =
    (value) => {
      if (!value) return '';

      if (
        typeof value ===
          'string' ||
        typeof value ===
          'number'
      ) {
        return String(
          value
        );
      }

      return String(
        value._id ||
          value.id ||
          ''
      );
    };

  const getReferenceName =
    (value) => {
      if (!value) return '';

      if (
        typeof value ===
          'string' ||
        typeof value ===
          'number'
      ) {
        return String(
          value
        );
      }

      return (
        value.name ||
        value.title ||
        ''
      );
    };

  const getCurrencySymbol =
    (currency) => {
      const symbols = {
        INR: '₹',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CNY: '¥',
        AED: 'د.إ',
        SAR: '﷼',
        AUD: 'A$',
        CAD: 'C$'
      };

      return (
        symbols[
          String(
            currency || 'INR'
          ).toUpperCase()
        ] ||
        `${String(
          currency || 'INR'
        ).toUpperCase()} `
      );
    };

  const formatPrice =
    (value) => {
      if (
        value ===
          undefined ||
        value === null ||
        !Number.isFinite(
          Number(value)
        )
      ) {
        return '';
      }

      return Number(
        value
      ).toLocaleString(
        'en-IN',
        {
          maximumFractionDigits: 2
        }
      );
    };

  // =========================================================
  // CATEGORY STRUCTURE
  // =========================================================

  const activeCategory =
    categoryName
      ? decodeURIComponent(
          categoryName
        )
      : 'All';

  useEffect(() => {
    setSelectedSubcategory(
      subcategoryName
        ? decodeURIComponent(
            subcategoryName
          )
        : 'All'
    );
  }, [
    subcategoryName
  ]);

  const categoryObjects =
    useMemo(
      () =>
        dbCategories.filter(
          (category) =>
            category &&
            category.archived !==
              true &&
            category.isActive !==
              false
        ),
      [dbCategories]
    );

  const findCategory =
    (category) => {
      if (!category) {
        return null;
      }

      const categoryId =
        getReferenceId(
          category
        );

      const categoryLabel =
        getReferenceName(
          category
        );

      return (
        categoryObjects.find(
          (item) => {
            const itemId =
              getReferenceId(
                item
              );

            const itemName =
              getReferenceName(
                item
              );

            return (
              (
                categoryId &&
                itemId &&
                String(
                  categoryId
                ) ===
                  String(
                    itemId
                  )
              ) ||
              (
                categoryLabel &&
                itemName &&
                String(
                  categoryLabel
                ).toLowerCase() ===
                  String(
                    itemName
                  ).toLowerCase()
              )
            );
          }
        ) || null
      );
    };

  // =========================================================
  // SUBCATEGORIES
  //
  // Dynamic:
  // no fixed category names.
  // =========================================================

  const activeCategoryObject =
    categoryObjects.find(
      (category) =>
        String(
          getReferenceName(
            category
          )
        ).toLowerCase() ===
        String(
          activeCategory
        ).toLowerCase()
    ) || null;

  const subcategories =
    useMemo(() => {
      /*
       * If backend category documents use:
       *
       * parent
       * parentId
       * parentCategory
       *
       * support all of them.
       */

      if (
        !activeCategoryObject
      ) {
        return [];
      }

      const parentId =
        getReferenceId(
          activeCategoryObject
        );

      return categoryObjects.filter(
        (category) => {
          const categoryParent =
            category.parent ||
            category.parentId ||
            category.parentCategory;

          if (
            !categoryParent
          ) {
            return false;
          }

          return (
            String(
              getReferenceId(
                categoryParent
              )
            ) ===
            String(parentId)
          );
        }
      );
    }, [
      categoryObjects,
      activeCategoryObject
    ]);

  // =========================================================
  // CATEGORY CLICK
  // =========================================================

  const handleCategoryClick =
    (category) => {
      if (
        category ===
        'All'
      ) {
        navigate('/');
        return;
      }

      navigate(
        `/category/${encodeURIComponent(
          category
        )}`
      );
    };

  const handleSubcategoryClick =
    (subcategory) => {
      const name =
        getReferenceName(
          subcategory
        );

      const category =
        activeCategory;

      navigate(
        `/category/${encodeURIComponent(
          category
        )}/${encodeURIComponent(
          name
        )}`
      );
    };

  // =========================================================
  // PRODUCT PRICE
  // =========================================================

  const getProductPrice =
    (product) => {
      const currency =
        String(
          selectedCurrency ||
            'INR'
        ).toUpperCase();

      /*
       * The backend is the authoritative pricing resolver.
       * It applies FX + multiplier + exact override + rules.
       */
      if (
        product?.displayPrice !== undefined &&
        product?.displayPrice !== null &&
        String(
          product?.displayCurrency || ''
        ).toUpperCase() === currency &&
        Number.isFinite(
          Number(product.displayPrice)
        )
      ) {
        return Number(product.displayPrice);
      }

      /*
       * Manual dynamic prices.
       */

      if (
        Array.isArray(
          product?.prices
        )
      ) {
        const matched =
          product.prices.find(
            (price) =>
              String(
                price.currency ||
                  ''
              ).toUpperCase() ===
                currency &&
              price.enabled !==
                false
          );

        if (
          matched &&
          matched.price !==
            undefined
        ) {
          return Number(
            matched.price
          );
        }
      }

      /*
       * Legacy currencyPrices.
       */

      if (
        product?.currencyPrices
      ) {
        let value =
          null;

        if (
          typeof product
            .currencyPrices
            .get ===
          'function'
        ) {
          value =
            product.currencyPrices.get(
              currency
            );
        } else {
          value =
            product
              .currencyPrices[
              currency
            ];
        }

        if (
          value !==
            undefined &&
          value !== null
        ) {
          return Number(
            value
          );
        }
      }

      /*
       * Base price.
       */

      const baseCurrency =
        String(
          product?.baseCurrency ||
            'INR'
        ).toUpperCase();

      if (
        baseCurrency ===
        currency
      ) {
        return (
          Number(
            product?.price
          ) || 0
        );
      }

      return null;
    };

  // =========================================================
  // CATEGORY MATCH
  // =========================================================

  const productMatchesCategory =
    (
      product
    ) => {
      if (
        activeCategory ===
        'All'
      ) {
        return true;
      }

      const productCategory =
        getReferenceName(
          product.category
        );

      const productCategoryId =
        getReferenceId(
          product.category
        );

      const categoryObject =
        findCategory(
          product.category
        );

      const requestedCategory =
        String(
          activeCategory
        ).toLowerCase();

      const sameCategoryName =
        String(
          productCategory
        ).toLowerCase() ===
        requestedCategory;

      const sameCategoryId =
        activeCategoryObject &&
        productCategoryId &&
        getReferenceId(
          activeCategoryObject
        ) ===
          productCategoryId;

      const sameResolvedCategory =
        categoryObject &&
        String(
          getReferenceName(
            categoryObject
          )
        ).toLowerCase() ===
          requestedCategory;

      return Boolean(
        sameCategoryName ||
          sameCategoryId ||
          sameResolvedCategory
      );
    };

  // =========================================================
  // SUBCATEGORY MATCH
  // =========================================================

  const productMatchesSubcategory =
    (
      product
    ) => {
      if (
        selectedSubcategory ===
          'All' ||
        !selectedSubcategory
      ) {
        return true;
      }

      const productSubcategory =
        getReferenceName(
          product.subcategory
        );

      const productSubcategoryId =
        getReferenceId(
          product.subcategory
        );

      const selectedObject =
        subcategories.find(
          (item) =>
            String(
              getReferenceName(
                item
              )
            ).toLowerCase() ===
            String(
              selectedSubcategory
            ).toLowerCase()
        );

      return Boolean(
        String(
          productSubcategory
        ).toLowerCase() ===
          String(
            selectedSubcategory
          ).toLowerCase() ||
          (
            selectedObject &&
            productSubcategoryId &&
            productSubcategoryId ===
              getReferenceId(
                selectedObject
              )
          )
      );
    };

  // =========================================================
  // FILTER PRODUCTS
  // =========================================================

  const filteredProducts =
    useMemo(() => {
      const result =
        products.filter(
          (product) => {
            if (
              product.archived ===
              true
            ) {
              return false;
            }

            const matchesCategory =
              productMatchesCategory(
                product
              );

            const matchesSubcategory =
              productMatchesSubcategory(
                product
              );

            const searchableText =
              [
                product.name,
                product.sku,
                product.description,
                product.shortDescription,
                getReferenceName(
                  product.category
                ),
                getReferenceName(
                  product.subcategory
                ),
                ...(Array.isArray(
                  product.specifications
                )
                  ? product.specifications.flatMap(
                      (spec) => [
                        spec?.name ||
                          '',
                        String(
                          spec?.value ||
                            ''
                        )
                      ]
                    )
                  : [])
              ]
                .join(' ')
                .toLowerCase();

            const matchesSearch =
              searchableText.includes(
                searchQuery
                  .trim()
                  .toLowerCase()
              );

            return (
              matchesCategory &&
              matchesSubcategory &&
              matchesSearch
            );
          }
        );

      if (
        sortBy ===
        'name-asc'
      ) {
        return [
          ...result
        ].sort((a, b) =>
          String(
            a.name || ''
          ).localeCompare(
            String(
              b.name || ''
            )
          )
        );
      }

      if (
        sortBy ===
        'name-desc'
      ) {
        return [
          ...result
        ].sort((a, b) =>
          String(
            b.name || ''
          ).localeCompare(
            String(
              a.name || ''
            )
          )
        );
      }

      if (
        sortBy ===
        'price-low'
      ) {
        return [
          ...result
        ].sort(
          (a, b) =>
            Number(
              getProductPrice(
                a
              ) ?? 0
            ) -
            Number(
              getProductPrice(
                b
              ) ?? 0
            )
        );
      }

      if (
        sortBy ===
        'price-high'
      ) {
        return [
          ...result
        ].sort(
          (a, b) =>
            Number(
              getProductPrice(
                b
              ) ?? 0
            ) -
            Number(
              getProductPrice(
                a
              ) ?? 0
            )
        );
      }

      return result;
    }, [
      products,
      activeCategory,
      selectedSubcategory,
      searchQuery,
      sortBy,
      selectedCurrency,
      activeCategoryObject,
      subcategories
    ]);

  // =========================================================
  // MULTI QUOTE
  // =========================================================

  const toggleProductSelect =
    (productId) => {
      if (
        selectedProducts.includes(
          productId
        )
      ) {
        setSelectedProducts(
          selectedProducts.filter(
            (id) =>
              id !==
              productId
          )
        );
      } else {
        setSelectedProducts(
          [
            ...selectedProducts,
            productId
          ]
        );
      }
    };

  const handleOpenCommonModal =
    (
      defaultName = ''
    ) => {
      if (
        selectedProducts.length >
        0
      ) {
        const names =
          products
            .filter(
              (product) =>
                selectedProducts.includes(
                  product._id
                )
            )
            .map(
              (product) =>
                product.name
            );

        setModalTitle(
          names.join(
            ', '
          )
        );
      } else if (
        defaultName
      ) {
        setModalTitle(
          defaultName
        );
      } else {
        setModalTitle(
          'Custom / Multiple Products Inquiry'
        );
      }

      setIsModalOpen(true);
    };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-28">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative bg-gradient-to-b from-blue-50/80 via-slate-50 to-slate-50 border-b border-slate-200 py-14 px-6">

        <div className="max-w-5xl mx-auto text-center space-y-4">

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Flame
              size={14}
              className="text-blue-600"
            />

            Scientific Products
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Scientific Products &
            <span className="text-blue-600">
              {' '}
              Technical Solutions
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Explore our complete product catalog with dynamic technical specifications, pricing, variants and business purchasing options.
          </p>

          {/* SEARCH */}

          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3 pt-3">

            <div className="relative flex-1 w-full">

              <Search
                className="absolute left-4 top-3.5 text-slate-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search products, SKU, specifications..."
                value={
                  searchQuery
                }
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
                className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-xs text-sm"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery(
                      ''
                    )
                  }
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                >
                  <X
                    size={17}
                  />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                handleOpenCommonModal(
                  'General Catalog Quote / Custom Item'
                )
              }
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition shadow-md shadow-blue-600/20 whitespace-nowrap flex items-center justify-center gap-2"
            >
              <MessageSquareQuote
                size={16}
              />

              Request Quote
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATALOG
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-6 pt-8">

        {/* CATEGORY */}

        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">

          <button
            type="button"
            onClick={() =>
              handleCategoryClick(
                'All'
              )
            }
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeCategory ===
              'All'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>

          {categoryObjects.map(
            (category) => {
              const name =
                getReferenceName(
                  category
                );

              if (!name) {
                return null;
              }

              return (
                <button
                  type="button"
                  key={
                    category._id ||
                    name
                  }
                  onClick={() =>
                    handleCategoryClick(
                      name
                    )
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    String(
                      activeCategory
                    ).toLowerCase() ===
                    String(
                      name
                    ).toLowerCase()
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {name}
                </button>
              );
            }
          )}
        </div>

        {/* =================================================
            SUBCATEGORY
        ================================================== */}

        {activeCategory !==
          'All' &&
          subcategories.length >
            0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/category/${encodeURIComponent(
                      activeCategory
                    )}`
                  )
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  selectedSubcategory ===
                  'All'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                All Subcategories
              </button>

              {subcategories.map(
                (
                  subcategory
                ) => {
                  const name =
                    getReferenceName(
                      subcategory
                    );

                  return (
                    <button
                      type="button"
                      key={
                        subcategory._id ||
                        name
                      }
                      onClick={() =>
                        handleSubcategoryClick(
                          subcategory
                        )
                      }
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                        String(
                          selectedSubcategory
                        ).toLowerCase() ===
                        String(
                          name
                        ).toLowerCase()
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {name}
                    </button>
                  );
                }
              )}
            </div>
          )}

        {/* =================================================
            TOOLBAR
        ================================================== */}

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mt-2">

          <div className="text-xs text-slate-500">
            <strong className="text-slate-800">
              {
                filteredProducts.length
              }
            </strong>{' '}
            product
            {filteredProducts.length !==
            1
              ? 's'
              : ''}{' '}
            found
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
            >
              <SlidersHorizontal
                size={14}
              />

              Filters
            </button>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value
                )
              }
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="default">
                Sort: Default
              </option>

              <option value="name-asc">
                Name A-Z
              </option>

              <option value="name-desc">
                Name Z-A
              </option>

              <option value="price-low">
                Price Low-High
              </option>

              <option value="price-high">
                Price High-Low
              </option>
            </select>
          </div>
        </div>

        {/* FILTER PANEL */}

        {showFilters && (
          <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-5">

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Current Catalog Filters
            </div>

            <div className="flex flex-wrap gap-2">

              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                Category:{' '}
                {activeCategory}
              </span>

              {selectedSubcategory !==
                'All' && (
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                  Subcategory:{' '}
                  {
                    selectedSubcategory
                  }
                </span>
              )}

              {searchQuery && (
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                  Search:{' '}
                  {searchQuery}
                </span>
              )}

              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                Currency:{' '}
                {
                  selectedCurrency
                }
              </span>
            </div>
          </div>
        )}

        {/* =================================================
            CUSTOM MANUFACTURING
        ================================================== */}

        <div className="mt-6 bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-slate-800">

          <div>

            <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
              <Sparkles
                size={12}
              />

              Custom Manufacturing
            </span>

            <h3 className="text-base sm:text-lg font-bold mt-1">
              Need Custom Dimensions, CAD Drawings or Unlisted Products?
            </h3>

            <p className="text-xs text-slate-300 mt-1">
              Submit your technical requirement and our team can assist with custom products.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              handleOpenCommonModal(
                'Custom CAD Drawing / Unlisted Product Requirement'
              )
            }
            className="whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-1.5"
          >
            Submit Custom Spec

            <ChevronRight
              size={14}
            />
          </button>
        </div>

        {/* =================================================
            PRODUCTS
        ================================================== */}

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium text-xs">
            Loading product catalog...
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 mt-6 shadow-2xs space-y-3">

            <p className="text-slate-700 font-semibold text-sm">
              No products found.
            </p>

            <p className="text-xs text-slate-400">
              Try another category, subcategory or search term.
            </p>

            <button
              type="button"
              onClick={() =>
                handleOpenCommonModal(
                  searchQuery ||
                    activeCategory
                )
              }
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              Request a custom quote
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">

            {filteredProducts.map(
              (product) => {
                const isSelected =
                  selectedProducts.includes(
                    product._id
                  );

                const price =
                  getProductPrice(
                    product
                  );

                const category =
                  getReferenceName(
                    product.category
                  );

                const subcategory =
                  getReferenceName(
                    product.subcategory
                  );

                const specifications =
                  Array.isArray(
                    product.specifications
                  )
                    ? product.specifications
                        .filter(
                          (
                            spec
                          ) =>
                            spec?.name &&
                            spec?.value !==
                              undefined
                        )
                        .slice(
                          0,
                          3
                        )
                    : [];

                return (
                  <div
                    key={
                      product._id
                    }
                    className={`group bg-white border ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-blue-400'
                    } rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative`}
                  >

                    <div>

                      {/* IMAGE */}

                      <div className="relative aspect-square rounded-xl bg-slate-50 overflow-hidden border border-slate-100 mb-4 flex items-center justify-center">

                        {product.imageUrl ? (
                          <img
                            src={
                              product.imageUrl
                            }
                            alt={
                              product.name
                            }
                            className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="text-slate-400 text-xs font-semibold">
                            Product Image
                          </div>
                        )}

                        {/* CATEGORY */}

                        {category && (
                          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-md border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 shadow-2xs">
                            {category}
                          </span>
                        )}

                        {/* SELECT */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleProductSelect(
                              product._id
                            )
                          }
                          className={`absolute top-2 right-2 p-1 rounded-lg backdrop-blur-md transition ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/90 text-slate-400 hover:text-blue-600 border border-slate-200'
                          }`}
                          title={
                            isSelected
                              ? 'Unselect for Quote'
                              : 'Select for Quote'
                          }
                        >
                          {isSelected ? (
                            <CheckSquare
                              size={
                                18
                              }
                            />
                          ) : (
                            <Square
                              size={
                                18
                              }
                            />
                          )}
                        </button>
                      </div>

                      {/* NAME */}

                      <Link
                        to={`/product/${product._id}`}
                      >
                        <h3 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition line-clamp-2">
                          {
                            product.name
                          }
                        </h3>
                      </Link>

                      {/* SUBCATEGORY */}

                      {subcategory && (
                        <div className="mt-2 text-[10px] font-semibold text-blue-600">
                          {
                            subcategory
                          }
                        </div>
                      )}

                      {/* DESCRIPTION */}

                      <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {product.shortDescription ||
                          product.description ||
                          'Technical scientific product.'}
                      </p>

                      {/* DYNAMIC SPECS */}

                      {specifications.length >
                        0 && (
                        <div className="mt-3 space-y-1">

                          {specifications.map(
                            (
                              spec,
                              index
                            ) => (
                              <div
                                key={`${spec.name}-${index}`}
                                className="flex justify-between gap-3 text-[10px]"
                              >
                                <span className="text-slate-400">
                                  {
                                    spec.name
                                  }
                                </span>

                                <span className="text-slate-700 font-semibold text-right line-clamp-1">
                                  {String(
                                    spec.value
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* BOTTOM */}

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">

                      <div>

                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                          Price
                        </span>

                        <span className="text-xs font-extrabold text-blue-600">

                          {price !==
                            null &&
                          Number(
                            price
                          ) > 0
                            ? `${getCurrencySymbol(
                                selectedCurrency
                              )}${formatPrice(
                                price
                              )}`
                            : 'RFQ Required'}
                        </span>
                      </div>

                      <Link
                        to={`/product/${product._id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                      >
                        <Eye
                          size={
                            14
                          }
                        />

                        Details
                      </Link>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </main>

      {/* =====================================================
          SELECTED PRODUCTS BAR
      ====================================================== */}

      {selectedProducts.length >
        0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700">

          <div className="flex items-center gap-2 text-xs font-semibold">

            <Layers
              size={16}
              className="text-blue-400"
            />

            <span>
              <strong className="text-blue-400">
                {
                  selectedProducts.length
                }
              </strong>{' '}
              Product
              {selectedProducts.length !==
              1
                ? 's'
                : ''}{' '}
              Selected
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              handleOpenCommonModal()
            }
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
          >
            Get Combined Quote
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedProducts(
                []
              )
            }
            className="text-slate-400 hover:text-white"
            title="Clear selection"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* =====================================================
          INQUIRY MODAL
      ====================================================== */}

      <InquiryModal
        isOpen={
          isModalOpen
        }
        onClose={() =>
          setIsModalOpen(
            false
          )
        }
        productName={
          modalTitle
        }
      />
    </div>
  );
};

export default HomePage;