const express = require('express');
const router = express.Router();
const SiteContent = require('../models/SiteContent');
const protect = require('../middleware/authMiddleware');

const cleanText = (value, max = 5000) => String(value ?? '').trim().slice(0, max);
const safeUrl = (value, { allowRelative = false } = {}) => {
  const url = cleanText(value, 2000);
  if (!url) return '';
  if (allowRelative && url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch { return ''; }
};
const sanitizeContent = (body = {}) => ({
  aboutUs: {
    heading: cleanText(body.aboutUs?.heading, 200),
    introText: cleanText(body.aboutUs?.introText),
    videoUrl: safeUrl(body.aboutUs?.videoUrl),
    legacyText: cleanText(body.aboutUs?.legacyText),
    manufacturingExcellence: (Array.isArray(body.aboutUs?.manufacturingExcellence) ? body.aboutUs.manufacturingExcellence : []).slice(0, 20).map((item) => ({ title: cleanText(item?.title, 200), description: cleanText(item?.description) })).filter((item) => item.title)
  },
  homeSlideshow: (Array.isArray(body.homeSlideshow) ? body.homeSlideshow : []).slice(0, 20).map((item, index) => ({ title: cleanText(item?.title, 160), subtitle: cleanText(item?.subtitle, 500), imageUrl: safeUrl(item?.imageUrl, { allowRelative: true }), ctaLabel: cleanText(item?.ctaLabel, 80) || 'Explore collection', ctaUrl: safeUrl(item?.ctaUrl, { allowRelative: true }) || '/scientific', isActive: item?.isActive !== false, sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index })).filter((item) => item.title && item.imageUrl),
  faqs: (Array.isArray(body.faqs) ? body.faqs : []).slice(0, 50).map((item, index) => ({ question: cleanText(item?.question, 300), answer: cleanText(item?.answer), isActive: item?.isActive !== false, sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index })).filter((item) => item.question && item.answer),
  technicals: (Array.isArray(body.technicals) ? body.technicals : []).slice(0, 50).map((item) => ({ title: cleanText(item?.title, 300), description: cleanText(item?.description), pdfUrl: safeUrl(item?.pdfUrl), category: cleanText(item?.category, 100) })).filter((item) => item.title && item.pdfUrl),
  contact: { salesEmail: cleanText(body.contact?.salesEmail, 254), phone: cleanText(body.contact?.phone, 50), address: cleanText(body.contact?.address, 1000), openingHours: cleanText(body.contact?.openingHours, 500), mapEmbedUrl: safeUrl(body.contact?.mapEmbedUrl) },
  serviceSupport: { heading: cleanText(body.serviceSupport?.heading, 200), content: cleanText(body.serviceSupport?.content) }
});

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
    console.error('Get site content error:', err);
    res.status(500).json({ success: false, message: 'Unable to load site content.' });
  }
});

// 2. UPDATE CONTENT (For Admin Panel)
router.put('/', protect, async (req, res) => {
  try {
    // Upsert will create the document if it doesn't exist, or update it if it does
    const updatedContent = await SiteContent.findOneAndUpdate(
      { singletonId: 'CMS_CONTENT' },
      { $set: sanitizeContent(req.body) },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Site content updated successfully.',
      data: updatedContent 
    });
  } catch (err) {
    console.error('Update site content error:', err);
    res.status(400).json({ success: false, message: 'Unable to update site content.' });
  }
});

module.exports = router;
