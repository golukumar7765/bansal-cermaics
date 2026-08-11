const Inquiry = require('../models/Inquiry');
const nodemailer = require('nodemailer');

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// 1. Create New Inquiry + Send Email Alerts (POST)
exports.createInquiry = async (req, res) => {
  try {
    const { productName, name, email, phone, quantity, message } = req.body;
    const parsedQuantity = Number(quantity);

    if (!productName || !name || !email || !phone || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill all required fields.' 
      });
    }

    // Database me Save Karein
    const newInquiry = new Inquiry({ 
      productName, 
      name, 
      email, 
      phone, 
      quantity: parsedQuantity,
      message 
    });
    const savedInquiry = await newInquiry.save();

    // Email Templates
    const adminMailOptions = {
      from: `"Bansal RFQ Alert" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🚨 New RFQ Received: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">New Quote Request Details</h2>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
          <p><strong>Item / Spec:</strong> ${escapeHtml(productName)}</p>
          <p><strong>Customer Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Quantity:</strong> ${parsedQuantity} units</p>
          <p><strong>Technical Notes:</strong> ${escapeHtml(message || 'N/A')}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #64748b;">Log in to Admin Panel to update quote status.</p>
        </div>
      `
    };

    const customerMailOptions = {
      from: `"Bansal Scientific" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `RFQ Acknowledgment - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">Thank You for Reaching Out!</h2>
          <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
          <p>We have received your Request for Quotation (RFQ) for <strong>${escapeHtml(productName)}</strong>.</p>
          <p>Our sales engineering team is reviewing your requirements and will revert with a formal quotation shortly.</p>
          <br />
          <p>Best Regards,<br /><strong>Bansal Scientific Team</strong></p>
        </div>
      `
    };

    // Fail-safe non-blocking email trigger
    Promise.allSettled([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(customerMailOptions)
    ]).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Email ${index === 0 ? 'Admin' : 'Customer'} Error:`, result.reason?.message || result.reason);
        }
      });
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Inquiry submitted & emails sent successfully!', 
      data: savedInquiry,
      inquiry: savedInquiry 
    });

  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// 2. Get All Inquiries (GET)
exports.getInquiries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const inquiries = await Inquiry.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Inquiry.countDocuments();

    res.status(200).json({
      success: true,
      data: inquiries,
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Get Single Inquiry by ID (GET)
exports.getInquiryById = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.status(200).json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Update Status (PUT / PATCH)
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required.' });
    }

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true, runValidators: true }
    );

    if (!updatedInquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    res.status(200).json({ success: true, inquiry: updatedInquiry, data: updatedInquiry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 5. Delete Inquiry (DELETE)
exports.deleteInquiry = async (req, res) => {
  try {
    const deletedInquiry = await Inquiry.findByIdAndDelete(req.params.id);

    if (!deletedInquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    res.status(200).json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
