const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimitMiddleware');
const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry
} = require('../controllers/inquiryController');

router.post('/', rateLimit({ windowMs: 15 * 60 * 1000, max: 8, keyPrefix: 'inquiry' }), createInquiry);

router.get('/', protect, getInquiries);

router.get('/:id', protect, getInquiryById);

router.put('/:id', protect, updateInquiryStatus);

router.patch('/:id', protect, updateInquiryStatus);

router.delete('/:id', protect, deleteInquiry);

module.exports = router;
