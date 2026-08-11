import React, { useState } from 'react';
import api, { getApiError } from '../lib/api';
import { X, Send, CheckCircle2 } from 'lucide-react';

const QuoteModal = ({ isOpen, onClose, selectedProduct }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 1,
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      productName: selectedProduct?.name || 'General Inquiry',
      ...formData
    };

    try {
      await api.post('/inquiries', payload);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err) {
      setError(getApiError(err, 'Failed to submit inquiry. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border border-slate-100">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 size={56} className="text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-slate-900">RFQ Submitted Successfully!</h3>
            <p className="text-sm text-slate-600">Our sales team will send a formal quote shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase">Request For Quotation</span>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedProduct ? selectedProduct.name : 'Bulk Order Inquiry'}
              </h2>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Specs / Notes</label>
              <textarea
                name="message"
                rows="3"
                value={formData.message}
                onChange={handleChange}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                placeholder="Dimensions, grade, custom packaging requirements..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
            >
              <Send size={15} /> {loading ? 'Submitting Request...' : 'Send Quote Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuoteModal;
