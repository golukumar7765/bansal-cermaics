import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getApiError } from '../lib/api';
import { Mail, Phone, MapPin, CheckCircle } from 'lucide-react';

const ContactPage = () => {
  const [searchParams] = useSearchParams();
  const [contact, setContact] = useState({
    salesEmail: 'sales@bansalscientific.com',
    phone: '+91-9149062163',
    address: '712, City Station Road, Khurja,\nDistt. Bulandshahr-203131, INDIA',
    openingHours: 'Mon-Sat 10:00-18:00',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14030.73033506161!2d77.8384992!3d28.243555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ca7a1c3b1e3ab%3A0x6b8f3b8b6e6f1f!2sKhurja%2C%20Uttar%20Pradesh%20203131!5e0!3m2!1sen!2sin!4v1690000000000!5m2!1sen!2sin'
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    country: 'India',
    phone: '',
    enquiryType: 'Product enquiry',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const product = searchParams.get('product');
    if (!product) return;
    setFormData((previous) => ({
      ...previous,
      enquiryType: 'Product enquiry',
      message: `I would like a quote and availability details for: ${product}`
    }));
  }, [searchParams]);

  useEffect(() => {
    api.get('/site-content')
      .then((response) => {
        const saved = response.data?.data?.contact;
        if (saved) setContact((previous) => ({ ...previous, ...saved }));
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mapping new fields into the existing backend schema to prevent breaking
    const combinedMessage = `Company: ${formData.companyName || 'N/A'}\nCountry: ${formData.country}\n\nMessage/Requirement:\n${formData.message}`;

    const payload = {
      productName: `[${formData.enquiryType}] Contact Form`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      quantity: 1,
      message: combinedMessage
    };

    try {
      await api.post('/inquiries', payload);
      setSubmitted(true);
    } catch (err) {
      setError(getApiError(err, 'Failed to send enquiry. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans">
      <div className="max-w-[1200px] mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* LEFT COLUMN: CONTACT INFO */}
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Sales Enquiries & Bulk Orders</h1>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                If you are looking for alumina crucibles or advanced ceramic labware for laboratory or industrial applications, our team will be happy to assist you.
              </p>
              <p className="text-sm text-slate-900 font-bold leading-relaxed mb-4">
                We support bulk orders, research laboratories, industrial buyers and international distributors worldwide.
              </p>
              <p className="text-[13px] font-bold text-emerald-700 bg-emerald-50 inline-block px-3 py-1 rounded-sm border border-emerald-200">
                ISO 9001 Certified Manufacturer | Exporting Worldwide
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">Quick Contact</h2>
              
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <span className="block font-bold text-slate-900 mb-1 flex items-center gap-2"><Mail size={16} className="text-[#1a8b44]" /> Sales Email</span>
                  <a href={`mailto:${contact.salesEmail}`} className="text-blue-600 hover:underline">{contact.salesEmail}</a>
                </div>
                
                <div>
                  <span className="block font-bold text-slate-900 mb-1 flex items-center gap-2"><Phone size={16} className="text-[#1a8b44]" /> Phone / WhatsApp</span>
                  <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`} className="hover:text-slate-900">{contact.phone}</a>
                </div>
                
                <div>
                  <span className="block font-bold text-slate-900 mb-1 flex items-center gap-2"><MapPin size={16} className="text-[#1a8b44]" /> Address</span>
                  <span className="whitespace-pre-line">{contact.address}</span>
                </div>
                
                <div>
                  <span className="block font-bold text-slate-900">Opening Hours:</span>
                  <span>{contact.openingHours}</span>
                </div>
              </div>
            </div>

            {/* GOOGLE MAP IFRAME */}
            <div className="w-full h-[250px] bg-slate-200 rounded-sm overflow-hidden border border-slate-300">
              <iframe 
                title="Bansal Scientific Location"
                src={contact.mapEmbedUrl}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* RIGHT COLUMN: CONTACT FORM */}
          <div className="bg-white p-8 rounded-sm shadow-xs border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Product Enquiry & Quote Request</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Send us your enquiry and our sales team will respond within 24 hours with product information, pricing and delivery details. Request a quote for bulk alumina crucibles or ceramic labware.
            </p>

            {submitted ? (
              <div className="text-center py-10 bg-emerald-50 border border-emerald-200 rounded-sm">
                <CheckCircle size={48} className="text-[#1a8b44] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Enquiry Sent Successfully!</h3>
                <p className="text-sm text-slate-600 mt-2">Our team will get back to you shortly.</p>
                <button onClick={() => setSubmitted(false)} className="mt-6 text-sm text-[#1a8b44] font-bold hover:underline">Send another enquiry</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-sm border border-red-200">{error}</div>}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full text-sm bg-slate-50 border border-slate-300 rounded-sm p-2.5 focus:outline-none focus:border-[#1a8b44]" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full text-sm bg-slate-50 border border-slate-300 rounded-sm p-2.5 focus:outline-none focus:border-[#1a8b44]" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full text-sm bg-slate-50 border border-slate-300 rounded-sm p-2.5 focus:outline-none focus:border-[#1a8b44]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Country *</label>
                    <select name="country" required value={formData.country} onChange={handleChange} className="w-full text-sm bg-slate-50 border border-slate-300 rounded-sm p-2.5 focus:outline-none focus:border-[#1a8b44]">
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp *</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full text-sm bg-slate-50 border border-slate-300 rounded-sm p-2.5 focus:outline-none focus:border-[#1a8b44]" placeholder="+91" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enquiry Type *</label>
                  <select name="enquiryType" required value={formData.enquiryType} onChange={handleChange} className="w-full text-sm bg-slate-50 border border-slate-300 rounded-sm p-2.5 focus:outline-none focus:border-[#1a8b44]">
                    <option value="Product enquiry">Product enquiry</option>
                    <option value="Bulk order enquiry">Bulk order enquiry</option>
                    <option value="Distributor Enquiry">Distributor Enquiry</option>
                    <option value="Technical question">Technical question</option>
                    <option value="General enquiry">General enquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Enquiry / Requirement *</label>
                  <textarea name="message" required rows="4" value={formData.message} onChange={handleChange} className="w-full text-sm bg-slate-50 border border-slate-300 rounded-sm p-2.5 focus:outline-none focus:border-[#1a8b44]" placeholder="Provide details like dimensions, temperature rating, etc..."></textarea>
                </div>

                <button type="submit" disabled={loading} className="mt-4 bg-[#1a8b44] hover:bg-[#157236] text-white font-bold text-sm px-8 py-3 rounded-sm transition cursor-pointer disabled:opacity-50 w-full sm:w-auto">
                  {loading ? 'Sending...' : 'Send Enquiry'}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ContactPage;
