const express = require('express');
const router = express.Router();
const SiteContent = require('../models/SiteContent');
const protect = require('../middleware/authMiddleware');

// 1. GET PUBLIC CONTENT (For Frontend Pages)
router.get('/', async (req, res) => {
  try {
    const content = await SiteContent.findOne({ singletonId: 'CMS_CONTENT' });
    
    // If no content exists yet, return an empty object so the frontend knows to use fallbacks
    res.status(200).json({ 
      success: true, 
      data: content || {} 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. UPDATE CONTENT (For Admin Panel)
router.put('/', protect, async (req, res) => {
  try {
    // Upsert will create the document if it doesn't exist, or update it if it does
    const updatedContent = await SiteContent.findOneAndUpdate(
      { singletonId: 'CMS_CONTENT' },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Site content updated successfully.',
      data: updatedContent 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;