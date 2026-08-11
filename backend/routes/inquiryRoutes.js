const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry
} = require('../controllers/inquiryController');

router.post('/', createInquiry);

router.get('/', protect, getInquiries);

router.get('/:id', protect, getInquiryById);

router.put('/:id', protect, updateInquiryStatus);

router.patch('/:id', protect, updateInquiryStatus);

router.delete('/:id', protect, deleteInquiry);

module.exports = router;