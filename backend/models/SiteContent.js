const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
  // Singleton ID ensures only ONE document exists for the whole site
  singletonId: { type: String, default: 'CMS_CONTENT', unique: true, index: true },

  // About Us Page Data
  aboutUs: {
    heading: { type: String },
    introText: { type: String },
    videoUrl: { type: String },
    legacyText: { type: String },
    manufacturingExcellence: [{
      title: String,
      description: String
    }]
  },

  // Homepage promotional slides.  The admin controls this collection so offers
  // can be scheduled/published without a frontend deployment.
  homeSlideshow: [{
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    ctaLabel: { type: String, default: 'Explore collection' },
    ctaUrl: { type: String, default: '/scientific' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  }],

  // FAQs Page Data (Array of questions & answers)
  faqs: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  }],

  // Technical & Datasheet Page Data
  technicals: [{
    title: { type: String, required: true },
    description: { type: String },
    pdfUrl: { type: String, required: true }, // Uploaded to Cloudinary
    category: { type: String }
  }],

  // Contact Page Data
  contact: {
    salesEmail: { type: String },
    phone: { type: String },
    address: { type: String },
    openingHours: { type: String },
    mapEmbedUrl: { type: String }
  },

  // Service & Support Page Data
  serviceSupport: {
    heading: { type: String },
    content: { type: String } // Can store rich text / HTML
  }
}, { timestamps: true });

module.exports = mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema);
