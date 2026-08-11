import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquareQuote,
  ShoppingCart,
  Package,
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

const ProductDetailPage = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [selectedCurrency, setSelectedCurrency] =
    useState(
      localStorage.getItem('selectedCurrency') ||
        'INR'
    );

  // =========================================================
  // CURRENCY
  // =========================================================

  useEffect(() => {
    const handleStorage = () => {
      setSelectedCurrency(
        localStorage.getItem('selectedCurrency') ||
          'INR'
      );
    };

    window.addEventListener(
      'currencyChanged',
      handleStorage
    );

    window.addEventListener(
      'storage',
      handleStorage
    );

    return () => {
      window.removeEventListener(
        'currencyChanged',
        handleStorage
      );

      window.removeEventListener(
        'storage',
        handleStorage
      );
    };
  }, []);

  // =========================================================
  // LOAD PRODUCT
  // =========================================================

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);

      try {
        const res = await api.get(
          `/products/${id}`,
          {
            params: {
              currency: selectedCurrency,
              quantity
            }
          }
        );

        const productData =
          res.data?.data ||
          res.data;

        setProduct(productData);

        if (
          Array.isArray(
            productData?.variants
          ) &&
          productData.variants.length > 0
        ) {
          setSelectedVariant(
            productData.variants[0]
          );
        }

        /*
         * Related products.
         *
         * We intentionally fetch the catalog and
         * filter dynamically rather than hardcoding
         * product relationships.
         */
        try {
          const productsRes =
            await api.get(
              '/products',
              {
                params: {
                  currency: selectedCurrency
                }
              }
            );

          const allProducts =
            Array.isArray(
              productsRes.data
            )
              ? productsRes.data
              : productsRes.data?.data ||
                [];

          const currentCategoryId =
            getReferenceId(
              productData?.category
            );

          const currentCategoryName =
            getReferenceName(
              productData?.category
            );

          const currentSubcategoryId =
            getReferenceId(
              productData?.subcategory
            );

          const related =
            allProducts
              .filter((item) => {
                if (
                  String(item._id) ===
                  String(productData._id)
                ) {
                  return false;
                }

                const itemCategoryId =
                  getReferenceId(
                    item.category
                  );

                const itemCategoryName =
                  getReferenceName(
                    item.category
                  );

                const sameCategory =
                  currentCategoryId &&
                  itemCategoryId
                    ? String(
                        currentCategoryId
                      ) ===
                      String(
                        itemCategoryId
                      )
                    : currentCategoryName &&
                      itemCategoryName
                    ? String(
                        currentCategoryName
                      ).toLowerCase() ===
                      String(
                        itemCategoryName
                      ).toLowerCase()
                    : false;

                const itemSubcategoryId =
                  getReferenceId(
                    item.subcategory
                  );

                const sameSubcategory =
                  currentSubcategoryId &&
                  itemSubcategoryId
                    ? String(
                        currentSubcategoryId
                      ) ===
                      String(
                        itemSubcategoryId
                      )
                    : false;

                return (
                  sameSubcategory ||
                  sameCategory
                );
              })
              .slice(0, 6);

          setRelatedProducts(
            related
          );
        } catch (relatedError) {
          console.error(
            'Related products error:',
            relatedError
          );

          setRelatedProducts([]);
        }
      } catch (error) {
        console.error(
          'Product loading error:',
          error
        );

        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [id, selectedCurrency, quantity]);

  // =========================================================
  // HELPERS
  // =========================================================

  function getReferenceId(value) {
    if (!value) return '';

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value);
    }

    if (value._id) {
      return String(value._id);
    }

    if (value.id) {
      return String(value.id);
    }

    return '';
  }

  function getReferenceName(value) {
    if (!value) return '';

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value);
    }

    return (
      value.name ||
      value.title ||
      ''
    );
  }

  // =========================================================
  // PRODUCT IMAGES
  // =========================================================

  const productImages = useMemo(() => {
    if (!product) {
      return [];
    }

    const images = [];

    if (product.imageUrl) {
      images.push({
        url: product.imageUrl,
        alt:
          product.name ||
          'Product image'
      });
    }

    if (
      Array.isArray(
        product.images
      )
    ) {
      product.images.forEach(
        (image) => {
          const url =
            typeof image ===
            'string'
              ? image
              : image?.url ||
                image?.imageUrl ||
                '';

          if (
            url &&
            !images.some(
              (item) =>
                item.url === url
            )
          ) {
            images.push({
              url,
              alt:
                image?.alt ||
                product.name ||
                'Product image'
            });
          }
        }
      );
    }

    return images;
  }, [product]);

  // =========================================================
  // DYNAMIC SPECIFICATIONS
  // =========================================================

  const dynamicSpecifications =
    useMemo(() => {
      if (!product) {
        return [];
      }

      if (
        Array.isArray(
          product.specifications
        )
      ) {
        return product.specifications
          .filter(
            (spec) =>
              spec &&
              String(
                spec.name || ''
              ).trim() &&
              spec.value !==
                undefined &&
              spec.value !==
                null &&
              String(
                spec.value
              ).trim()
          )
          .map((spec) => ({
            name: String(
              spec.name
            ).trim(),

            value:
              typeof spec.value ===
              'object'
                ? JSON.stringify(
                    spec.value
                  )
                : String(
                    spec.value
                  ).trim(),

            unit:
              spec.unit ||
              ''
          }));
      }

      return [];
    }, [product]);

  // =========================================================
  // SPEC ICON
  // =========================================================

  const getSpecificationIcon =
    (name) => {
      const normalized =
        String(
          name || ''
        ).toLowerCase();

      if (
        normalized.includes(
          'material'
        ) ||
        normalized.includes(
          'purity'
        ) ||
        normalized.includes(
          'composition'
        ) ||
        normalized.includes(
          'grade'
        )
      ) {
        return FlaskConical;
      }

      if (
        normalized.includes(
          'image'
        )
      ) {
        return ImageIcon;
      }

      if (
        normalized.includes(
          'weight'
        ) ||
        normalized.includes(
          'capacity'
        ) ||
        normalized.includes(
          'volume'
        ) ||
        normalized.includes(
          'quantity'
        )
      ) {
        return Package;
      }

      return Settings;
    };

  // =========================================================
  // PRICE RESOLUTION
  //
  // Admin can manually define:
  //
  // INR -> 100
  // USD -> 1.20
  // EUR -> 1.10
  //
  // No hardcoded conversion formula.
  // =========================================================

  const resolvedPrice =
    useMemo(() => {
      if (!product) {
        return null;
      }

      const currency =
        String(
          selectedCurrency ||
            product.baseCurrency ||
            'INR'
        ).toUpperCase();

      /*
       * Backend-resolved displayPrice is authoritative.
       * It already includes FX, multiplier, override and rules.
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
       * Variant price has priority when
       * selected variant contains a price.
       */
      if (
        selectedVariant &&
        selectedVariant.price !==
          undefined &&
        selectedVariant.price !==
          null
      ) {
        if (
          selectedVariant.currency &&
          String(
            selectedVariant.currency
          ).toUpperCase() ===
            currency
        ) {
          return Number(
            selectedVariant.price
          );
        }
      }

      /*
       * Dynamic prices array.
       */
      if (
        Array.isArray(
          product.prices
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
              price.enabled !== false
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
       * Backward compatibility:
       *
       * currencyPrices:
       * {
       *   USD: 1.2,
       *   EUR: 1.1
       * }
       */
      if (
        product.currencyPrices
      ) {
        let currencyValue =
          null;

        if (
          typeof product
            .currencyPrices
            .get ===
          'function'
        ) {
          currencyValue =
            product.currencyPrices.get(
              currency
            );
        } else {
          currencyValue =
            product
              .currencyPrices[
              currency
            ];
        }

        if (
          currencyValue !==
            undefined &&
          currencyValue !==
            null
        ) {
          return Number(
            currencyValue
          );
        }
      }

      /*
       * Base price only if requested
       * currency equals base currency.
       */
      const baseCurrency =
        String(
          product.baseCurrency ||
            'INR'
        ).toUpperCase();

      if (
        currency ===
        baseCurrency
      ) {
        return Number(
          product.price
        ) || 0;
      }

      /*
       * No manually configured price
       * for selected currency.
       */
      return null;
    }, [
      product,
      selectedCurrency,
      selectedVariant
    ]);

  // =========================================================
  // CURRENCY SYMBOL
  // =========================================================

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

  const formatPrice = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
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
  // VARIANTS
  // =========================================================

  const variants =
    Array.isArray(
      product?.variants
    )
      ? product.variants
      : [];

  const variantOptions =
    selectedVariant?.options ||
    selectedVariant?.attributes ||
    {};

  const variantOptionEntries =
    Object.entries(
      variantOptions || {}
    );

  // =========================================================
  // PURCHASE LOGIC
  // =========================================================

  const moq =
    Number(
      selectedVariant?.moq ??
        product?.moq
    ) || 1;

  const availableStock =
    Number(
      selectedVariant?.stock ??
        product?.stock
    ) || 0;

  const directPurchaseAllowed =
    selectedVariant
      ?.isDirectPurchaseAllowed !==
    undefined
      ? selectedVariant.isDirectPurchaseAllowed
      : product
          ?.isDirectPurchaseAllowed !==
        false;

  const canBuy =
    directPurchaseAllowed &&
    resolvedPrice !== null &&
    Number(resolvedPrice) > 0 &&
    availableStock > 0 &&
    product?.archived !== true;

  // =========================================================
  // ADD TO CART
  // =========================================================

  const handleBuy = () => {
    if (!canBuy) {
      return;
    }

    const safeQuantity =
      Math.max(
        moq,
        Number(quantity) || moq
      );

    if (
      availableStock > 0 &&
      safeQuantity >
        availableStock
    ) {
      alert(
        `Only ${availableStock} unit(s) are currently available.`
      );

      return;
    }

    let cart = [];

    try {
      cart = JSON.parse(
        localStorage.getItem(
          'cart'
        ) || '[]'
      );

      if (
        !Array.isArray(cart)
      ) {
        cart = [];
      }
    } catch {
      cart = [];
    }

    const variantId =
      selectedVariant?._id ||
      selectedVariant?.id ||
      '';

    const existing =
      cart.find(
        (item) =>
          String(
            item._id
          ) ===
            String(
              product._id
            ) &&
          String(
            item.variantId ||
              ''
          ) ===
            String(
              variantId
            )
      );

    const cartItem = {
      ...product,

      variantId,

      selectedVariant:
        selectedVariant || null,

      selectedCurrency,

      displayedUnitPrice:
        resolvedPrice,

      quantity:
        safeQuantity
    };

    if (existing) {
      existing.quantity +=
        safeQuantity;

      existing.selectedCurrency =
        selectedCurrency;

      existing.displayedUnitPrice =
        resolvedPrice;

      existing.selectedVariant =
        selectedVariant || null;
    } else {
      cart.push(
        cartItem
      );
    }

    localStorage.setItem(
      'cart',
      JSON.stringify(cart)
    );

    window.dispatchEvent(
      new Event(
        'cartUpdated'
      )
    );

    alert(
      'Product added to cart.'
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-slate-500">
          Loading product...
        </div>
      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Product not found
        </h2>

        <Link
          to="/"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  // =========================================================
  // CATEGORY NAMES
  // =========================================================

  const categoryName =
    getReferenceName(
      product.category
    );

  const subcategoryName =
    getReferenceName(
      product.subcategory
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* =====================================================
          BREADCRUMB
      ====================================================== */}

      <div className="max-w-7xl mx-auto px-6 pt-8">

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        <div className="mt-6 text-sm text-slate-400">
          Home / Products /

          {categoryName && (
            <>
              <span className="mx-1">
                /
              </span>

              <span className="text-slate-600">
                {categoryName}
              </span>
            </>
          )}

          {subcategoryName && (
            <>
              <span className="mx-1">
                /
              </span>

              <span className="text-slate-600">
                {subcategoryName}
              </span>
            </>
          )}

          <span className="mx-1">
            /
          </span>

          <span className="text-slate-900 font-semibold">
            {product.name}
          </span>
        </div>
      </div>

      {/* =====================================================
          MAIN PRODUCT
      ====================================================== */}

      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">

          {/* =================================================
              IMAGE GALLERY
          ================================================== */}

          <div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative">

              {productImages.length >
              0 ? (
                <>
                  <img
                    src={
                      productImages[
                        activeImage
                      ]?.url
                    }
                    alt={
                      productImages[
                        activeImage
                      ]?.alt ||
                      product.name
                    }
                    className="w-full h-full object-contain p-8"
                  />

                  {productImages.length >
                    1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImage(
                            (
                              activeImage -
                              1 +
                              productImages.length
                            ) %
                              productImages.length
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:bg-slate-50"
                      >
                        <ChevronLeft
                          size={20}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveImage(
                            (
                              activeImage +
                              1
                            ) %
                              productImages.length
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:bg-slate-50"
                      >
                        <ChevronRight
                          size={20}
                        />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <Box
                    size={60}
                    strokeWidth={1.2}
                  />

                  <span>
                    No Image Available
                  </span>
                </div>
              )}
            </div>

            {/* THUMBNAILS */}

            {productImages.length >
              1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {productImages.map(
                  (
                    image,
                    index
                  ) => (
                    <button
                      type="button"
                      key={`${image.url}-${index}`}
                      onClick={() =>
                        setActiveImage(
                          index
                        )
                      }
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 ${
                        activeImage ===
                        index
                          ? 'border-blue-600'
                          : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={
                          image.url
                        }
                        alt={
                          image.alt
                        }
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* =================================================
              PRODUCT INFO
          ================================================== */}

          <div className="flex flex-col">

            {/* CATEGORY */}

            <div className="flex flex-wrap items-center gap-2 mb-4">

              {categoryName && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                  {categoryName}
                </span>
              )}

              {subcategoryName && (
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {subcategoryName}
                </span>
              )}

              {product.sku && (
                <span className="text-xs text-slate-400">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* NAME */}

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              {product.name}
            </h1>

            {/* SHORT DESCRIPTION */}

            {(product.shortDescription ||
              product.description) && (
              <p className="mt-6 text-lg leading-8 text-slate-600">
                {product.shortDescription ||
                  product.description}
              </p>
            )}

            {/* PRICE */}

            <div className="mt-8">

              {resolvedPrice !==
                null &&
              Number(
                resolvedPrice
              ) > 0 ? (
                <div>
                  <span className="text-3xl font-bold text-slate-900">
                    {getCurrencySymbol(
                      selectedCurrency
                    )}
                    {formatPrice(
                      resolvedPrice
                    )}
                  </span>

                  <span className="ml-2 text-sm text-slate-500">
                    per unit
                  </span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-blue-700">
                  Price on Request
                </div>
              )}

              {selectedCurrency && (
                <p className="mt-1 text-xs text-slate-400">
                  Currency:{" "}
                  {selectedCurrency}
                </p>
              )}
            </div>

            {/* =================================================
                VARIANTS
            ================================================== */}

            {variants.length >
              0 && (
              <div className="mt-8 border border-slate-200 rounded-2xl p-5">

                <div className="flex items-center gap-2 mb-4">
                  <Settings
                    size={18}
                    className="text-blue-600"
                  />

                  <h3 className="font-bold text-slate-900">
                    Available Variants
                  </h3>
                </div>

                <div className="space-y-3">

                  {variants.map(
                    (
                      variant,
                      index
                    ) => {
                      const isSelected =
                        selectedVariant ===
                        variant;

                      const label =
                        variant.name ||
                        variant.title ||
                        variant.label ||
                        `Variant ${
                          index + 1
                        }`;

                      return (
                        <button
                          type="button"
                          key={
                            variant._id ||
                            variant.id ||
                            index
                          }
                          onClick={() => {
                            setSelectedVariant(
                              variant
                            );

                            setQuantity(
                              Math.max(
                                Number(
                                  variant.moq ||
                                    product.moq ||
                                    1
                                ),
                                1
                              )
                            );
                          }}
                          className={`w-full text-left rounded-xl border p-4 transition ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">

                            <span className="font-semibold">
                              {label}
                            </span>

                            {variant.sku && (
                              <span className="text-xs text-slate-400">
                                {variant.sku}
                              </span>
                            )}
                          </div>

                          {variantOptionEntries.length >
                            0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(
                                variant.options ||
                                  variant.attributes ||
                                  {}
                              ).map(
                                (
                                  [
                                    key,
                                    value
                                  ]
                                ) => (
                                  <span
                                    key={key}
                                    className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1"
                                  >
                                    {key}:{" "}
                                    {String(
                                      value
                                    )}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* =================================================
                QUICK SPECS
            ================================================== */}

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">

              {dynamicSpecifications
                .slice(0, 4)
                .map(
                  (
                    spec,
                    index
                  ) => {
                    const Icon =
                      getSpecificationIcon(
                        spec.name
                      );

                    return (
                      <div
                        key={`${spec.name}-${index}`}
                        className="border border-slate-200 rounded-xl p-4 bg-slate-50"
                      >
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <Icon
                            size={17}
                          />

                          <span className="text-xs uppercase font-semibold">
                            {spec.name}
                          </span>
                        </div>

                        <p className="font-semibold text-slate-800">
                          {spec.value}

                          {spec.unit && (
                            <span className="ml-1">
                              {spec.unit}
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  }
                )}

              {/* MOQ */}

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">

                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Package
                    size={17}
                  />

                  <span className="text-xs uppercase font-semibold">
                    Minimum Order
                  </span>
                </div>

                <p className="font-semibold text-slate-800">
                  {moq} unit
                  {moq > 1
                    ? 's'
                    : ''}
                </p>
              </div>

              {/* STOCK */}

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">

                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Package
                    size={17}
                  />

                  <span className="text-xs uppercase font-semibold">
                    Availability
                  </span>
                </div>

                <p
                  className={`font-semibold ${
                    availableStock >
                    0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {availableStock >
                  0
                    ? `${availableStock} unit(s) available`
                    : 'Out of stock'}
                </p>
              </div>
            </div>

            {/* =================================================
                PURCHASE
            ================================================== */}

            <div className="mt-8 border-t border-slate-200 pt-8">

              {canBuy ? (
                <div className="flex flex-col sm:flex-row gap-3">

                  {/* QUANTITY */}

                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          Math.max(
                            moq,
                            quantity -
                              1
                          )
                        )
                      }
                      className="px-4 py-3 hover:bg-slate-100"
                    >
                      <Minus
                        size={16}
                      />
                    </button>

                    <span className="px-5 font-semibold min-w-[65px] text-center">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            availableStock ||
                              quantity +
                                1,
                            quantity +
                              1
                          )
                        )
                      }
                      className="px-4 py-3 hover:bg-slate-100"
                    >
                      <Plus
                        size={16}
                      />
                    </button>

                  </div>

                  {/* CART */}

                  <button
                    type="button"
                    onClick={
                      handleBuy
                    }
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-3 transition"
                  >
                    <ShoppingCart
                      size={18}
                    />

                    Add to Cart
                  </button>
                </div>
              ) : (
                <Link
                  to={`/contact?product=${encodeURIComponent(
                    product.name
                  )}`}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-4 transition"
                >
                  <MessageSquareQuote
                    size={18}
                  />

                  Request a Quote
                </Link>
              )}

              {/* TRUST */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2
                    size={16}
                    className="text-emerald-500"
                  />
                  Verified Product
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ShieldCheck
                    size={16}
                    className="text-blue-500"
                  />
                  Technical Support
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Truck
                    size={16}
                    className="text-orange-500"
                  />
                  Business Shipping
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          DESCRIPTION
      ====================================================== */}

      <section className="border-t border-slate-200">

        <div className="max-w-7xl mx-auto px-6 py-16">

          <div className="max-w-4xl">

            <h2 className="text-2xl font-bold text-slate-900">
              Product Description
            </h2>

            <div className="mt-5 text-slate-600 leading-8 whitespace-pre-line">

              {product.description ? (
                product.description
              ) : (
                <p className="text-slate-400">
                  Product description will be available soon.
                </p>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TECHNICAL SPECIFICATIONS
      ====================================================== */}

      {dynamicSpecifications.length >
        0 && (
        <section className="bg-slate-50 border-y border-slate-200">

          <div className="max-w-7xl mx-auto px-6 py-16">

            <h2 className="text-2xl font-bold text-slate-900">
              Technical Specifications
            </h2>

            <p className="mt-2 text-slate-500">
              Detailed technical information about this product.
            </p>

            <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">

              <div className="divide-y divide-slate-200">

                {dynamicSpecifications.map(
                  (
                    spec,
                    index
                  ) => {
                    const Icon =
                      getSpecificationIcon(
                        spec.name
                      );

                    return (
                      <div
                        key={`${spec.name}-${index}`}
                        className="grid grid-cols-1 sm:grid-cols-2 px-6 py-5 gap-3"
                      >

                        <div className="flex items-center gap-3">

                          <Icon
                            size={18}
                            className="text-blue-600 shrink-0"
                          />

                          <span className="font-medium text-slate-500">
                            {spec.name}
                          </span>
                        </div>

                        <span className="font-semibold text-slate-800">
                          {spec.value}

                          {spec.unit && (
                            <span className="ml-1">
                              {spec.unit}
                            </span>
                          )}
                        </span>

                      </div>
                    );
                  }
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 px-6 py-5 gap-3">

                  <div className="flex items-center gap-3">

                    <Package
                      size={18}
                      className="text-blue-600"
                    />

                    <span className="font-medium text-slate-500">
                      Minimum Order Quantity
                    </span>
                  </div>

                  <span className="font-semibold text-slate-800">
                    {moq}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          RELATED PRODUCTS
      ====================================================== */}

      {relatedProducts.length >
        0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">

          <div className="flex items-end justify-between mb-8">

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Related Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Other products from the same catalog.
              </p>
            </div>

            <Link
              to="/"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

            {relatedProducts.map(
              (item) => {

                const itemPrice =
                  Array.isArray(
                    item.prices
                  )
                    ? item.prices.find(
                        (price) =>
                          String(
                            price.currency ||
                              ''
                          ).toUpperCase() ===
                            String(
                              selectedCurrency
                            ).toUpperCase() &&
                          price.enabled !==
                            false
                      )?.price
                    : null;

                const fallbackPrice =
                  itemPrice ??
                  (
                    String(
                      item.baseCurrency ||
                        'INR'
                    ).toUpperCase() ===
                    String(
                      selectedCurrency
                    ).toUpperCase()
                      ? item.price
                      : null
                  );

                return (
                  <Link
                    key={
                      item._id
                    }
                    to={`/product/${item._id}`}
                    className="group border border-slate-200 rounded-2xl p-4 bg-white hover:border-blue-400 hover:shadow-lg transition"
                  >

                    <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center">

                      {item.imageUrl ? (
                        <img
                          src={
                            item.imageUrl
                          }
                          alt={
                            item.name
                          }
                          className="w-full h-full object-contain group-hover:scale-105 transition"
                        />
                      ) : (
                        <Box
                          size={45}
                          className="text-slate-300"
                        />
                      )}
                    </div>

                    <h3 className="mt-4 font-bold text-sm text-slate-900 group-hover:text-blue-600 line-clamp-2">
                      {item.name}
                    </h3>

                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                      {item.shortDescription ||
                        item.description ||
                        'Technical scientific product.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100">

                      {fallbackPrice !==
                        null &&
                      Number(
                        fallbackPrice
                      ) > 0 ? (
                        <span className="text-sm font-bold text-blue-600">
                          {getCurrencySymbol(
                            selectedCurrency
                          )}
                          {formatPrice(
                            fallbackPrice
                          )}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-blue-600">
                          Price on Request
                        </span>
                      )}

                    </div>
                  </Link>
                );
              }
            )}

          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;