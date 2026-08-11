import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api, { getApiError } from '../lib/api';
import { 
  MessageCircle, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  RefreshCw, 
  Search, 
  Download, 
  Filter, 
  X,
} from 'lucide-react';

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = '/inquiries';

  // Helper to get Auth Headers
  const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // Fetch Inquiries Safely
  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(API_BASE_URL, getAuthHeader());
      const rawData = res.data;
      let dataArray = [];

      if (Array.isArray(rawData)) {
        dataArray = rawData;
      } else if (Array.isArray(rawData?.data)) {
        dataArray = rawData.data;
      } else if (Array.isArray(rawData?.inquiries)) {
        dataArray = rawData.inquiries;
      } else if (Array.isArray(rawData?.result)) {
        dataArray = rawData.result;
      }

      setInquiries(dataArray);
    } catch (err) {
      console.error("Error fetching inquiries:", err);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Update Inquiry Status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`${API_BASE_URL}/${id}`, { status: newStatus }, getAuthHeader());
      setInquiries(prev => 
        prev.map(inq => inq._id === id ? { ...inq, status: newStatus } : inq)
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(getApiError(err, 'Failed to update status'));
    }
  };

  // Delete Inquiry
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this RFQ entry?")) return;
    try {
      await api.delete(`${API_BASE_URL}/${id}`, getAuthHeader());
      setInquiries(prev => prev.filter(inq => inq._id !== id));
    } catch (err) {
      console.error("Failed to delete inquiry:", err);
      alert(getApiError(err, 'Failed to delete inquiry'));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredInquiries.length) return;

    const headers = ["Date", "Customer Name", "Email", "Phone", "Product/Spec", "Quantity", "Message", "Status"];
    const rows = filteredInquiries.map(inq => [
      `"${new Date(inq.createdAt).toLocaleDateString()}"`,
      `"${inq.name || ''}"`,
      `"${inq.email || ''}"`,
      `"${inq.phone || ''}"`,
      `"${(inq.productName || inq.product || '').replace(/"/g, '""')}"`,
      `"${inq.quantity || 1}"`,
      `"${(inq.message || '').replace(/"/g, '""')}"`,
      `"${inq.status || 'Pending'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inquiries_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Real-time Search & Status Filter
  const filteredInquiries = useMemo(() => {
    const safeArray = Array.isArray(inquiries) ? inquiries : [];
    return safeArray.filter((inq) => {
      const matchesStatus = statusFilter === 'All' || inq.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();

      if (!term) return matchesStatus;

      const name = (inq.name || '').toLowerCase();
      const email = (inq.email || '').toLowerCase();
      const phone = (inq.phone || '').toLowerCase();
      const product = (inq.productName || inq.product || '').toLowerCase();
      const message = (inq.message || '').toLowerCase();

      const matchesSearch = 
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        product.includes(term) ||
        message.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [inquiries, statusFilter, searchTerm]);

  // Status Badge Styling Helper
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Contacted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Quoted': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Closed': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">RFQ & Inquiry Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">Manage customer quotes, tech requests, and order inquiries.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchInquiries}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Data"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!filteredInquiries.length}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition flex items-center gap-2 text-xs font-semibold shadow-md shadow-blue-600/20"
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div className="md:col-span-2 relative">
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, email, phone, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Dropdown Filter */}
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 shadow-2xs appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Contacted">Contacted</option>
              <option value="In Review">In Review</option>
              <option value="Quoted">Quoted</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Inquiries Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-medium flex items-center justify-center gap-2">
              <RefreshCw size={18} className="animate-spin text-blue-600" /> Loading inquiries...
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No quote inquiries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-4">Date</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Product / RFQ</th>
                    <th className="p-4">Qty</th>
                    <th className="p-4">Notes</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredInquiries.map((inq) => (
                    <tr key={inq._id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Date */}
                      <td className="p-4 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{inq.name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Mail size={12} /> {inq.email}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Phone size={12} /> {inq.phone}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="p-4 font-semibold text-blue-600 max-w-xs">
                        {inq.productName || inq.product || 'General Inquiry'}
                      </td>

                      {/* Quantity */}
                      <td className="p-4 font-bold text-slate-900">
                        {inq.quantity || 1}
                      </td>

                      {/* Notes / Message */}
                      <td className="p-4 max-w-xs text-slate-600 truncate" title={inq.message}>
                        {inq.message || '-'}
                      </td>

                      {/* Status Selector */}
                      <td className="p-4 whitespace-nowrap">
                        <select
                          value={inq.status || 'Pending'}
                          onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadgeClass(inq.status)} focus:outline-none cursor-pointer`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="In Review">In Review</option>
                          <option value="Quoted">Quoted</option>
                          <option value="Closed">Closed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap space-x-2">
                        {/* Direct WhatsApp Action */}
                        {inq.phone && (
                          <a
                            href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${inq.name}, regarding your inquiry for ${inq.productName || 'our products'}...`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 inline-block bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                            title="WhatsApp Customer"
                          >
                            <MessageCircle size={15} />
                          </a>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(inq._id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                          title="Delete Inquiry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminInquiries;
