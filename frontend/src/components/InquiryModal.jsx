import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, Package, Sparkles, MessageCircle } from 'lucide-react';
import api, { getApiError } from '../lib/api';

const InquiryModal = ({ isOpen, onClose, productName: initialProduct }) => {
  const [inquiryType, setInquiryType] = useState('catalog');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('');
  
  const [customCategory, setCustomCategory] = useState('');
  const [customProduct, setCustomProduct] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 10,
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/categories')
        .then(res => setCategories(res.data?.data || res.data || []))
        .catch(err => console.error(err));

      api.get('/products')
        .then(res => setProducts(res.data?.data || res.data || []))
        .catch(err => console.error(err));

      if (initialProduct) {
        setSelectedProduct(initialProduct);
      }
    }
  }, [isOpen, initialProduct]);

  if (!isOpen) return null;

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory || p.category?.name === selectedCategory);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const finalProductName = inquiryType === 'catalog' 
      ? (selectedProduct || 'General Catalog Inquiry')
      : (customProduct || 'Custom Item Requirement');

    const finalCategory = inquiryType === 'catalog' 
      ? (selectedCategory !== 'All' ? selectedCategory : 'Catalog Item')
      : (customCategory || 'Custom Category');

    const payload = {
      productName: `[${finalCategory}] ${finalProductName}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      quantity: Number(formData.quantity) || 1,
      message: formData.message || ''
    };

    try {
      await api.post('/inquiries', payload);
      setSubmittedData(payload);
      setSubmitted(true);
    } catch (err) {
      console.error("Submission Error:", err);
      alert(getApiError(err, 'Unable to send your request. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setSubmittedData(null);
    onClose();
  };

  const adminWhatsAppNumber = '919149062163';
  const whatsappMsg = submittedData 
    ? `Hi Bansal Scientific, I have submitted an RFQ for: ${submittedData.productName} (Qty: ${submittedData.quantity}). Name: ${submittedData.name}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle size={52} className="text-emerald-500 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-slate-900">Request Submitted!</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                Thank you for reaching out to Bansal Scientific. Our technical sales team will review your specification and get back to you shortly.
              </p>
            </div>

            {/* Direct WhatsApp Chat Action */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(whatsappMsg)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> Chat Instantly on WhatsApp
              </a>

              <button
                onClick={handleClose}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <span className="text-[10px] uppercase font-extrabold text-blue-600 tracking-wider">Request For Quotation (RFQ)</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">Bansal Scientific Inquiry</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setInquiryType('catalog')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  inquiryType === 'catalog' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package size={14} /> Catalog Item
              </button>
              <button
                type="button"
                onClick={() => setInquiryType('custom')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  inquiryType === 'custom' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={14} /> Custom / Unlisted Item
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">

              {inquiryType === 'catalog' ? (
                <div className="space-y-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Select Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedProduct('');
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="All">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat._id || cat.name} value={cat.name || cat}>{cat.name || cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Select Product</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="">-- Choose Existing Product --</option>
                      {filteredProducts.map((p) => (
                        <option key={p._id || p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Custom Category / Application</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Special High Temp Furnace, Quartz Ware..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Custom Item / Spec Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alumina Crucible with Custom Flange 150mm"
                      value={customProduct}
                      onChange={(e) => setCustomProduct(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Your Name / Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma / IIT Delhi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Estimated Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dimensions / Technical Notes</label>
                <textarea
                  rows="3"
                  placeholder="Specify operating temperature, purity grade (e.g. 99.7% Alumina), CAD dimensions..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-600/20"
              >
                {loading ? 'Submitting Request...' : <><Send size={14} /> Send Quotation Request</>}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default InquiryModal;
