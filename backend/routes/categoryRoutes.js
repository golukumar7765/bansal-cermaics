const express = require('express');
const mongoose = require('mongoose');

const router =
  express.Router();

const Category =
  require('../models/Category');

const Product =
  require('../models/Product');

const protect =
  require('../middleware/authMiddleware');

/* =========================================================
   HELPERS
========================================================= */

const slugify = (
  value = ''
) => {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const validateId = (
  id
) =>
  mongoose.Types.ObjectId.isValid(
    id
  );

/* =========================================================
   GET ALL CATEGORIES
========================================================= */

router.get(
  '/',
  async (req, res) => {
    try {
      const {
        activeOnly = 'false',
        parent
      } = req.query;

      const query = {};

      if (
        activeOnly === 'true'
      ) {
        query.isActive = true;
      }

      if (
        parent === 'root'
      ) {
        query.parent = null;
      } else if (
        parent &&
        validateId(parent)
      ) {
        query.parent = parent;
      }

      const categories =
        await Category.find(
          query
        )
          .sort({
            sortOrder: 1,
            name: 1
          })
          .lean();

      return res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error(
        'Get categories error:',
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
   GET CATEGORY TREE
========================================================= */

router.get(
  '/tree',
  async (req, res) => {
    try {
      const categories =
        await Category.find({
          isActive: true
        })
          .sort({
            sortOrder: 1,
            name: 1
          })
          .lean();

      const map =
        new Map();

      const roots = [];

      categories.forEach(
        (category) => {
          map.set(
            String(
              category._id
            ),
            {
              ...category,
              children: []
            }
          );
        }
      );

      categories.forEach(
        (category) => {
          const current =
            map.get(
              String(
                category._id
              )
            );

          if (
            category.parent
          ) {
            const parent =
              map.get(
                String(
                  category.parent
                )
              );

            if (parent) {
              parent.children.push(
                current
              );
            }
          } else {
            roots.push(
              current
            );
          }
        }
      );

      return res.json({
        success: true,
        data: roots
      });
    } catch (error) {
      console.error(
        'Category tree error:',
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
   GET SINGLE CATEGORY
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
            'Invalid category ID.'
        });
      }

      const category =
        await Category.findById(
          req.params.id
        ).lean();

      if (!category) {
        return res.status(404).json({
          success: false,
          message:
            'Category not found.'
        });
      }

      return res.json({
        success: true,
        data: category
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
   CREATE CATEGORY / SUBCATEGORY
========================================================= */

router.post(
  '/',
  protect,
  async (req, res) => {
    try {
      const {
        name,
        description = '',
        imageUrl = '',
        parent = null,
        isActive = true,
        sortOrder = 0,
        specificationFields = []
      } = req.body;

      if (
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Category name is required.'
        });
      }

      if (
        parent !== null
      ) {
        if (
          !validateId(parent)
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid parent category.'
          });
        }

        const parentCategory =
          await Category.findById(
            parent
          );

        if (!parentCategory) {
          return res.status(404).json({
            success: false,
            message:
              'Parent category not found.'
          });
        }

        /*
         * Only one level of
         * subcategory.
         */
        if (
          parentCategory.parent
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Nested subcategories beyond one level are not allowed.'
          });
        }
      }

      const cleanName =
        String(name).trim();

      const slug =
        slugify(
          cleanName
        );

      const existing =
        await Category.findOne({
          slug
        });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            'A category with this name already exists.'
        });
      }

      const category =
        await Category.create({
          name:
            cleanName,

          slug,

          description:
            String(
              description || ''
            ).trim(),

          imageUrl:
            String(
              imageUrl || ''
            ).trim(),

          parent,

          isActive:
            Boolean(isActive),

          sortOrder:
            Number(sortOrder) || 0,

          specificationFields:
            Array.isArray(
              specificationFields
            )
              ? specificationFields
              : []
        });

      return res.status(201).json({
        success: true,
        message:
          parent
            ? 'Subcategory created successfully.'
            : 'Category created successfully.',
        data: category
      });
    } catch (error) {
      console.error(
        'Create category error:',
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
   UPDATE CATEGORY
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
            'Invalid category ID.'
        });
      }

      const category =
        await Category.findById(
          req.params.id
        );

      if (!category) {
        return res.status(404).json({
          success: false,
          message:
            'Category not found.'
        });
      }

      const {
        name,
        description,
        imageUrl,
        parent,
        isActive,
        sortOrder,
        specificationFields
      } = req.body;

      if (
        name !== undefined
      ) {
        category.name =
          String(
            name
          ).trim();

        category.slug =
          slugify(
            category.name
          );
      }

      if (
        description !==
        undefined
      ) {
        category.description =
          String(
            description || ''
          ).trim();
      }

      if (
        imageUrl !==
        undefined
      ) {
        category.imageUrl =
          String(
            imageUrl || ''
          ).trim();
      }

      if (
        parent !==
        undefined
      ) {
        if (
          parent !== null &&
          !validateId(parent)
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid parent category.'
          });
        }

        if (
          parent &&
          String(parent) ===
            String(category._id)
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Category cannot be its own parent.'
          });
        }

        category.parent =
          parent;
      }

      if (
        isActive !==
        undefined
      ) {
        category.isActive =
          Boolean(
            isActive
          );
      }

      if (
        sortOrder !==
        undefined
      ) {
        category.sortOrder =
          Number(
            sortOrder
          ) || 0;
      }

      if (
        specificationFields !==
        undefined
      ) {
        category.specificationFields =
          Array.isArray(
            specificationFields
          )
            ? specificationFields
            : [];
      }

      await category.save();

      return res.json({
        success: true,
        message:
          'Category updated successfully.',
        data: category
      });
    } catch (error) {
      console.error(
        'Update category error:',
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
   DELETE / ARCHIVE CATEGORY
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
            'Invalid category ID.'
        });
      }

      const category =
        await Category.findById(
          req.params.id
        );

      if (!category) {
        return res.status(404).json({
          success: false,
          message:
            'Category not found.'
        });
      }

      const children =
        await Category.countDocuments({
          parent:
            category._id
        });

      if (children > 0) {
        return res.status(409).json({
          success: false,
          message:
            'Remove or move subcategories before deleting this category.'
        });
      }

      const products =
        await Product.countDocuments({
          $or: [
            {
              categoryId:
                category._id
            },
            {
              subcategoryId:
                category._id
            }
          ]
        });

      if (products > 0) {
        return res.status(409).json({
          success: false,
          message:
            'This category is assigned to products. Reassign products before deleting it.'
        });
      }

      await category.deleteOne();

      return res.json({
        success: true,
        message:
          'Category deleted successfully.'
      });
    } catch (error) {
      console.error(
        'Delete category error:',
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

module.exports = router;