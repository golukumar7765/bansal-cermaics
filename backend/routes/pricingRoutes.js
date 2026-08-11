const express = require('express');

const router =
  express.Router();

const PricingRule =
  require('../models/PricingRule');

const protect =
  require('../middleware/authMiddleware');

/* =========================================================
   GET RULES
========================================================= */

router.get(
  '/',
  protect,
  async (req, res) => {
    try {
      const rules =
        await PricingRule.find()
          .populate(
            'category',
            'name slug'
          )
          .populate(
            'product',
            'name sku'
          )
          .sort({
            priority: -1,
            createdAt: -1
          });

      return res.json({
        success: true,
        data: rules
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
   CREATE RULE
========================================================= */

router.post(
  '/',
  protect,
  async (req, res) => {
    try {
      const {
        name,
        description = '',
        scope,
        category = null,
        product = null,
        currency = null,
        method,
        value,
        priority = 0,
        minQuantity = 1,
        maxQuantity = null,
        startsAt = null,
        endsAt = null,
        isActive = true
      } = req.body;

      if (
        !String(
          name || ''
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Pricing rule name is required.'
        });
      }

      if (
        ![
          'global',
          'category',
          'subcategory',
          'product'
        ].includes(
          scope
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid pricing rule scope.'
        });
      }

      if (
        ![
          'percentage',
          'fixed',
          'multiplier'
        ].includes(
          method
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid pricing method.'
        });
      }

      const numericValue =
        Number(value);

      if (
        !Number.isFinite(
          numericValue
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Pricing value must be numeric.'
        });
      }

      const rule =
        await PricingRule.create({
          name:
            String(
              name
            ).trim(),

          description:
            String(
              description || ''
            ).trim(),

          scope,

          category,

          product,

          currency:
            currency
              ? String(
                  currency
                )
                  .trim()
                  .toUpperCase()
              : null,

          method,

          value:
            numericValue,

          priority:
            Number(
              priority
            ) || 0,

          minQuantity:
            Math.max(
              1,
              Number(
                minQuantity
              ) || 1
            ),

          maxQuantity:
            maxQuantity ===
              null ||
            maxQuantity ===
              ''
              ? null
              : Number(
                  maxQuantity
                ),

          startsAt,

          endsAt,

          isActive:
            Boolean(
              isActive
            )
        });

      return res.status(201).json({
        success: true,
        message:
          'Pricing rule created successfully.',
        data: rule
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

/* =========================================================
   UPDATE RULE
========================================================= */

router.patch(
  '/:id',
  protect,
  async (req, res) => {
    try {
      const rule =
        await PricingRule.findById(
          req.params.id
        );

      if (!rule) {
        return res.status(404).json({
          success: false,
          message:
            'Pricing rule not found.'
        });
      }

      const allowedFields = [
        'name',
        'description',
        'scope',
        'category',
        'product',
        'currency',
        'method',
        'value',
        'priority',
        'minQuantity',
        'maxQuantity',
        'startsAt',
        'endsAt',
        'isActive'
      ];

      for (
        const field of allowedFields
      ) {
        if (
          req.body[field] !==
          undefined
        ) {
          rule[field] =
            req.body[field];
        }
      }

      if (
        rule.currency
      ) {
        rule.currency =
          String(
            rule.currency
          )
            .trim()
            .toUpperCase();
      }

      await rule.save();

      return res.json({
        success: true,
        message:
          'Pricing rule updated successfully.',
        data: rule
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message
      });
    }
  }
);

/* =========================================================
   DELETE RULE
========================================================= */

router.delete(
  '/:id',
  protect,
  async (req, res) => {
    try {
      const rule =
        await PricingRule.findById(
          req.params.id
        );

      if (!rule) {
        return res.status(404).json({
          success: false,
          message:
            'Pricing rule not found.'
        });
      }

      await rule.deleteOne();

      return res.json({
        success: true,
        message:
          'Pricing rule deleted successfully.'
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

module.exports =
  router;