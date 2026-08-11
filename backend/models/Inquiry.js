const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    productName: { 
      type: String, 
      required: [true, 'Product name is required'], 
      trim: true 
    },
    name: { 
      type: String, 
      required: [true, 'Name is required'], 
      trim: true 
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      lowercase: true, 
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: { 
      type: String, 
      required: [true, 'Phone number is required'], 
      trim: true 
    },
    quantity: { 
      type: Number, 
      required: [true, 'Quantity is required'], 
      min: [1, 'Quantity must be at least 1'] 
    },
    message: { 
      type: String, 
      trim: true,
      default: ''
    },
    status: { 
      type: String, 
      enum: ['Pending', 'Contacted', 'In Review', 'Quoted', 'Closed', 'Rejected'], 
      default: 'Pending' 
    }
  }, 
  { timestamps: true }
);

module.exports = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);