import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, ShieldCheck, MessageSquare } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-sm font-sans">
      
      {/* Top Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Col 1: Brand & Tagline */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-blue-500/20">
              BS
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">BANSAL SCIENTIFIC</h2>
              <span className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold">Ceramics & Labware</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed">
            Leading manufacturer of Porcelain, Alumina (99.7%), and Agate Labware for scientific, industrial, and R&D applications.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>ISO 9001:2015 Certified</span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-4 border-b border-slate-800 pb-2">Useful Links</h3>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/about" className="hover:text-blue-400 transition">About Bansal Scientific</Link></li>
            <li><Link to="/contact" className="hover:text-blue-400 transition">Contact & bulk enquiries</Link></li>
            <li><Link to="/faq" className="hover:text-blue-400 transition">Frequently asked questions</Link></li>
            <li><Link to="/technicals" className="hover:text-blue-400 transition">Technical documents</Link></li>
            <li>
              <a href="#iso" className="hover:text-blue-400 transition flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck size={14} /> ISO Certificate 9001:2015
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: Contact Info */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-4 border-b border-slate-800 pb-2">Contact Information</h3>
          <ul className="space-y-3 text-xs">
            <li className="flex items-start gap-2.5">
              <Phone size={16} className="text-blue-400 mt-0.5 shrink-0" />
              <a href="tel:+919149062163" className="hover:text-white transition font-medium text-slate-200">
                +91-9149062163
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="text-blue-400 mt-0.5 shrink-0" />
              <span>
                712, City Station Road, Khurja,<br />
                Distt. Bulandshahr-203131 INDIA
              </span>
            </li>
          </ul>
        </div>

        {/* Col 4: Follow Us */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-4 border-b border-slate-800 pb-2">Follow Us</h3>
          <p className="text-xs text-slate-400 mb-4">Connect with us on our official social channels:</p>
          <div className="flex items-center gap-2">
            
            {/* LinkedIn SVG */}
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-blue-500 hover:text-blue-400 transition" title="LinkedIn">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z"/></svg>
            </a>

            {/* Facebook SVG */}
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-blue-500 hover:text-blue-400 transition" title="Facebook">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>
            </a>

            {/* Instagram SVG */}
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-pink-500 hover:text-pink-400 transition" title="Instagram">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>

            {/* YouTube SVG */}
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-rose-500 hover:text-rose-400 transition" title="YouTube">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>

            {/* WhatsApp */}
            <a href="https://wa.me/919149062163" target="_blank" rel="noreferrer" className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-emerald-500 hover:text-emerald-400 transition" title="WhatsApp">
              <MessageSquare size={16} />
            </a>

          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="bg-slate-950 border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Bansal Scientific. All Rights Reserved. ISO 9001:2015 Certified Supplier.</p>
      </div>

    </footer>
  );
};

export default Footer;
