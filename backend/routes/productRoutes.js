const express = require('express');
const mongoose = require('mongoose');

const router =
  express.Router();

const Product =
  require('../models/Product');

const Category =
  require('../models/Category');

const {
  upload
} = require('../config/cloudinary');

const protect =
  require('../middleware/authMiddleware');

const {
  getProductPrice,
  getProductPricing
} =
  require('../services/pricingService');

/* =========================================================
   HELPERS
========================================================= */

const validateId = (
  id
) =>
  mongoose.Types.ObjectId.isValid(
    id
  );

const normalizeSpecifications =
  (specifications) => {
    if (
      !Array.isArray(
        specifications
      )
    ) {
      return [];
    }

    return specifications
      .map((spec) => ({
        name: String(
          spec?.name || ''
        ).trim(),

        value: String(
          spec?.value || ''
        ).trim(),

        unit: String(
          spec?.unit || ''
        ).trim()
      }))
      .filter(
        (spec) =>
          spec.name &&
          spec.value
      );
  };

const normalizeImages =
  (images) => {
    if (
      !Array.isArray(images)
    ) {
      return [];
    }

    return images
      .map(
        (image, index) => ({
          url: String(
            image?.url || ''
          ).trim(),

          alt: String(
            image?.alt || ''
          ).trim(),

          sortOrder:
            Number(
              image?.sortOrder
            ) || index,

          isPrimary:
            Boolean(
              image?.isPrimary
            )
        })
      )
      .filter(
        (image) =>
          image.url
      );
  };

const normalizeVariants =
  (variants) => {
    if (
      !Array.isArray(
        variants
      )
    ) {
      return [];
    }

    return variants.map(
      (variant) => ({
        name: String(
          variant?.name || ''
        ).trim(),

        sku: String(
          variant?.sku || ''
        )
          .trim()
          .toUpperCase(),

        price:
          Number(
            variant?.price
          ) || 0,

        stock:
          Number(
            variant?.stock
          ) || 0,

        attributes:
          variant?.attributes ||
          {},

        imageUrl:
          String(
            variant?.imageUrl ||
              ''
          ).trim(),

        isActive:
          variant?.isActive !==
          false
      })
    );
  };

/* =========================================================
   IMAGE UPLOAD
========================================================= */

router.post(
  '/upload',
  protect,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            'No file uploaded.'
        });
      }

      return res.json({
        success: true,
        imageUrl:
          req.file.path
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

/* =========================================================
   GET PRODUCTS
========================================================= */

router.get(
  '/',
  async (req, res) => {
    try {
      const {
        categoryId,
        subcategoryId,
        category,
        search,
        includeArchived = 'false',
        currency = 'INR',
        page = 1,
        limit = 50
      } = req.query;

      const query = {};

      if (
        includeArchived !==
        'true'
      ) {
        query.archived = {
          $ne: true
        };
      }

      if (
        categoryId &&
        validateId(categoryId)
      ) {
        query.categoryId =
          categoryId;
      }

      if (
        subcategoryId &&
        validateId(
          subcategoryId
        )
      ) {
        query.subcategoryId =
          subcategoryId;
      }

      if (
        category &&
        category.trim()
      ) {
        query.category =
          category.trim();
      }

      if (
        search &&
        search.trim()
      ) {
        query.$or = [
          {
            name: {
              $regex:
                search.trim(),
              $options: 'i'
            }
          },
          {
            sku: {
              $regex:
                search.trim(),
              $options: 'i'
            }
          }
        ];
      }

      const safePage =
        Math.max(
          1,
          Number(page) || 1
        );

      const safeLimit =
        Math.min(
          100,
          Math.max(
            1,
            Number(limit) || 50
          )
        );

      const skip =
        (safePage - 1) *
        safeLimit;

      const [
        products,
        total
      ] =
        await Promise.all([
          Product.find(
            query
          )
            .populate(
              'categoryId',
              'name slug parent'
            )
            .populate(
              'subcategoryId',
              'name slug parent'
            )
            .sort({
              createdAt: -1
            })
            .skip(skip)
            .limit(
              safeLimit
            )
            .lean(),

          Product.countDocuments(
            query
          )
        ]);

      const data =
        await Promise.all(
          products.map(
            async (product) => {
              try {
                const pricing =
                  await getProductPrice({
                    product,
                    currency
                  });

                return {
                  ...product,

                  displayPrice:
                    pricing.amount,

                  displayCurrency:
                    pricing.currency,

                  pricingSource:
                    pricing.source
                };
              } catch {
                return {
                  ...product,

                  displayPrice:
                    product.price,

                  displayCurrency:
                    product.baseCurrency ||
                    'INR'
                };
              }
            }
          )
        );

      return res.json({
        success: true,
        data,

        pagination: {
          total,
          page:
            safePage,
          limit:
            safeLimit,
          pages:
            Math.ceil(
              total /
                safeLimit
            )
        }
      });
    } catch (error) {
      console.error(
        'Get products error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

/* =========================================================
   GET PRODUCT
========================================================= */

router.get(
  '/:id',
  async (req, res) => {
    try {
      if (
        !validateId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid Product ID format.'
        });
      }

      const product =
        await Product.findById(
          req.params.id
        )
          .populate(
            'categoryId',
            'name slug parent specificationFields'
          )
          .populate(
            'subcategoryId',
            'name slug parent specificationFields'
          )
          .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            'Product not found.'
        });
      }

      const currency =
        String(
          req.query.currency ||
            'INR'
        ).toUpperCase();

      const quantity =
        Number(
          req.query.quantity
        ) || 1;

      const pricing =
        await getProductPrice({
          product,
          currency,
          quantity
        });

      return res.json({
        success: true,

        data: {
          ...product,

          displayPrice:
            pricing.amount,

          displayCurrency:
            pricing.currency,

          pricing
        }
      });
    } catch (error) {
      console.error(
        'Get product error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

/* =========================================================
   GET PRODUCT PRICING
========================================================= */

router.get(
  '/:id/pricing',
  async (req, res) => {
    try {
      if (
        !validateId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid Product ID.'
        });
      }

      const product =
        await Product.findById(
          req.params.id
        ).lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            'Product not found.'
        });
      }

      let currencies =
        req.query.currencies;

      if (
        typeof currencies ===
        'string'
      ) {
        currencies =
          currencies
            .split(',')
            .map(
              (item) =>
                item
                  .trim()
                  .toUpperCase()
            )
            .filter(Boolean);
      }

      if (
        !Array.isArray(
          currencies
        ) ||
        currencies.length ===
          0
      ) {
        currencies = [
          'INR',
          'USD',
          'EUR'
        ];
      }

      const pricing =
        await getProductPricing({
          product,
          currencies
        });

      return res.json({
        success: true,
        data: pricing
      });
    } catch (error) {
      console.error(
        'Product pricing error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

/* =========================================================
   CREATE PRODUCT
========================================================= */

router.post(
  '/',
  protect,
  async (req, res) => {
    try {
      const body =
        req.body || {};

      if (
        !String(
          body.sku || ''
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'SKU is required.'
        });
      }

      if (
        !String(
          body.name || ''
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Product name is required.'
        });
      }

      const sku =
        String(
          body.sku
        )
          .trim()
          .toUpperCase();

      const existing =
        await Product.findOne({
          sku
        });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            'A product with this SKU already exists.'
        });
      }

      let categoryId =
        body.categoryId ||
        null;

      let subcategoryId =
        body.subcategoryId ||
        null;

      let categoryName =
        String(
          body.category || ''
        ).trim();

      let subcategoryName =
        String(
          body.subcategory || ''
        ).trim();

      if (
        categoryId
      ) {
        if (
          !validateId(
            categoryId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid category ID.'
          });
        }

        const category =
          await Category.findById(
            categoryId
          );

        if (!category) {
          return res.status(404).json({
            success: false,
            message:
              'Category not found.'
          });
        }

        categoryName =
          category.name;
      }

      if (
        subcategoryId
      ) {
        if (
          !validateId(
            subcategoryId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid subcategory ID.'
          });
        }

        const subcategory =
          await Category.findById(
            subcategoryId
          );

        if (
          !subcategory
        ) {
          return res.status(404).json({
            success: false,
            message:
              'Subcategory not found.'
          });
        }

        if (
          !subcategory.parent
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Selected subcategory is actually a main category.'
          });
        }

        if (
          categoryId &&
          String(
            subcategory.parent
          ) !==
            String(
              categoryId
            )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Subcategory does not belong to selected category.'
          });
        }

        subcategoryName =
          subcategory.name;

        if (
          !categoryId
        ) {
          categoryId =
            subcategory.parent;
        }
      }

      const product =
        await Product.create({
          sku,

          name:
            String(
              body.name
            ).trim(),

          categoryId,

          subcategoryId,

          category:
            categoryName,

          subcategory:
            subcategoryName,

          price:
            Number(
              body.price
            ) || 0,

          baseCurrency:
            String(
              body.baseCurrency ||
                'INR'
            )
              .trim()
              .toUpperCase(),

          currencyPrices:
            body.currencyPrices ||
            {},

          currencyPricing:
            body.currencyPricing ||
            {},

          pricing:
            body.pricing || {},

          moq:
            Math.max(
              1,
              Number(
                body.moq
              ) || 1
            ),

          stock:
            Math.max(
              0,
              Number(
                body.stock
              ) || 0
            ),

          isDirectPurchaseAllowed:
            body.isDirectPurchaseAllowed !==
            false,

          archived:
            body.archived === true,

          imageUrl:
            String(
              body.imageUrl ||
                ''
            ).trim(),

          images:
            normalizeImages(
              body.images
            ),

          shortDescription:
            String(
              body.shortDescription ||
                ''
            ).trim(),

          description:
            String(
              body.description ||
                ''
            ),

          specifications:
            normalizeSpecifications(
              body.specifications
            ),

          variants:
            normalizeVariants(
              body.variants
            ),

          metadata:
            body.metadata || {}
        });

      return res.status(201).json({
        success: true,
        message:
          'Product created successfully.',
        data: product
      });
    } catch (error) {
      console.error(
        'Create product error:',
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

/* =========================================================
   UPDATE PRODUCT
========================================================= */

router.patch(
  '/:id',
  protect,
  async (req, res) => {
    try {
      if (
        !validateId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid Product ID.'
        });
      }

      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            'Product not found.'
        });
      }

      const body =
        req.body || {};

      if (
        body.sku !==
        undefined
      ) {
        const sku =
          String(
            body.sku
          )
            .trim()
            .toUpperCase();

        const duplicate =
          await Product.findOne({
            sku,

            _id: {
              $ne:
                product._id
            }
          });

        if (duplicate) {
          return res.status(409).json({
            success: false,
            message:
              'Another product already uses this SKU.'
          });
        }

        product.sku =
          sku;
      }

      if (
        body.name !==
        undefined
      ) {
        product.name =
          String(
            body.name
          ).trim();
      }

      if (
        body.categoryId !==
        undefined
      ) {
        if (
          body.categoryId ===
          null ||
          body.categoryId ===
          ''
        ) {
          product.categoryId =
            null;
          product.category =
            '';
        } else {
          if (
            !validateId(
              body.categoryId
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                'Invalid category ID.'
            });
          }

          const category =
            await Category.findById(
              body.categoryId
            );

          if (!category) {
            return res.status(404).json({
              success: false,
              message:
                'Category not found.'
            });
          }

          product.categoryId =
            category._id;

          product.category =
            category.name;
        }
      }

      if (
        body.subcategoryId !==
        undefined
      ) {
        if (
          body.subcategoryId ===
            null ||
          body.subcategoryId ===
            ''
        ) {
          product.subcategoryId =
            null;

          product.subcategory =
            '';
        } else {
          if (
            !validateId(
              body.subcategoryId
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                'Invalid subcategory ID.'
            });
          }

          const subcategory =
            await Category.findById(
              body.subcategoryId
            );

          if (
            !subcategory
          ) {
            return res.status(404).json({
              success: false,
              message:
                'Subcategory not found.'
            });
          }

          if (
            !subcategory.parent
          ) {
            return res.status(400).json({
              success: false,
              message:
                'Selected category is not a subcategory.'
            });
          }

          if (
            product.categoryId &&
            String(
              subcategory.parent
            ) !==
              String(
                product.categoryId
              )
          ) {
            return res.status(400).json({
              success: false,
              message:
                'Subcategory does not belong to selected category.'
            });
          }

          product.subcategoryId =
            subcategory._id;

          product.subcategory =
            subcategory.name;
        }
      }

      const numericFields = [
        'price',
        'moq',
        'stock'
      ];

      for (
        const field of numericFields
      ) {
        if (
          body[field] !==
          undefined
        ) {
          product[field] =
            Number(
              body[field]
            );

          if (
            !Number.isFinite(
              product[field]
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                `${field} must be a valid number.`
            });
          }
        }
      }

      if (
        body.baseCurrency !==
        undefined
      ) {
        product.baseCurrency =
          String(
            body.baseCurrency
          )
            .trim()
            .toUpperCase();
      }

      if (
        body.currencyPrices !==
        undefined
      ) {
        product.currencyPrices =
          body.currencyPrices;
      }

      if (
        body.currencyPricing !==
        undefined
      ) {
        product.currencyPricing =
          body.currencyPricing;
      }

      if (
        body.pricing !==
        undefined
      ) {
        product.pricing =
          body.pricing;
      }

      if (
        body.isDirectPurchaseAllowed !==
        undefined
      ) {
        product.isDirectPurchaseAllowed =
          Boolean(
            body.isDirectPurchaseAllowed
          );
      }

      if (
        body.archived !==
        undefined
      ) {
        product.archived =
          Boolean(
            body.archived
          );
      }

      if (
        body.imageUrl !==
        undefined
      ) {
        product.imageUrl =
          String(
            body.imageUrl ||
              ''
          ).trim();
      }

      if (
        body.images !==
        undefined
      ) {
        product.images =
          normalizeImages(
            body.images
          );
      }

      if (
        body.shortDescription !==
        undefined
      ) {
        product.shortDescription =
          String(
            body.shortDescription ||
              ''
          ).trim();
      }

      if (
        body.description !==
        undefined
      ) {
        product.description =
          String(
            body.description ||
              ''
          );
      }

      if (
        body.specifications !==
        undefined
      ) {
        product.specifications =
          normalizeSpecifications(
            body.specifications
          );
      }

      if (
        body.variants !==
        undefined
      ) {
        product.variants =
          normalizeVariants(
            body.variants
          );
      }

      if (
        body.metadata !==
        undefined
      ) {
        product.metadata =
          body.metadata;
      }

      await product.save();

      return res.json({
        success: true,
        message:
          'Product updated successfully.',
        data: product
      });
    } catch (error) {
      console.error(
        'Update product error:',
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

/* =========================================================
   ARCHIVE PRODUCT
========================================================= */

router.delete(
  '/:id',
  protect,
  async (req, res) => {
    try {
      if (
        !validateId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid Product ID.'
        });
      }

      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            'Product not found.'
        });
      }

      /*
       * Soft delete.
       *
       * Existing orders still keep
       * their product reference.
       */
      product.archived =
        true;

      await product.save();

      return res.json({
        success: true,
        message:
          'Product archived successfully.',
        data: product
      });
    } catch (error) {
      console.error(
        'Archive product error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

module.exports =
  router;