const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: String, default: '1' },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Contacted', 'Closed'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);
// Direct require karein (destructuring `{ Inquiry }` mat lagana)
const Inquiry = require('../models/Inquiry'); 

// OR agar file path alag hai toh path sahi karein