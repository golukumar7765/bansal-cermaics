import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { ChevronDown, ChevronUp, HelpCircle, MessageSquareQuote } from 'lucide-react';

const defaultFaqs = [
  {
    question: "What products does Bansal Scientific & Ceramic Industry manufacture?",
    answer: "We manufacture Porcelain Laboratory Wares, High Alumina (99.7%) products, Agate Mortar & Pestles, and Industrial & Technical Ceramic components for laboratories, institutions, and industrial applications."
  },
  {
    question: "Are your products ISO certified?",
    answer: "Yes, we are an ISO 9001:2015 certified company and follow strict quality control processes at every stage of manufacturing."
  },
  {
    question: "Do you provide custom-made ceramic products?",
    answer: "Yes. We offer custom manufacturing based on drawings, samples, dimensions, and application-specific requirements."
  },
  {
    question: "Do you accept bulk and institutional orders?",
    answer: "Yes. We specialize in bulk manufacturing, institutional supply, and long-term contracts with consistent quality and reliable timelines."
  },
  {
    question: "Do you ship across India and internationally?",
    answer: "We provide pan-India delivery and also export products internationally, subject to order quantity and destination requirements."
  },
  {
    question: "How can I contact your support team?",
    answer: "You can contact us through the website inquiry form, email, phone, or WhatsApp. Our team usually responds within one working day."
  }
];

const FaqPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [faqs, setFaqs] = useState(defaultFaqs);

  // Fetch Dynamic Data and Override if available
  useEffect(() => {
    window.scrollTo(0, 0);
    api.get('/site-content')
      .then(res => {
        const dynamicFaqs = res.data?.data?.faqs;
        if (dynamicFaqs && dynamicFaqs.length > 0) {
          setFaqs(dynamicFaqs);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="bg-gradient-to-b from-blue-50/80 to-slate-50 border-b border-slate-200 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle size={16} />
            Support Center
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-600 text-base md:text-lg">
            Answers to common questions about our products, manufacturing, and services.
          </p>
        </div>
      </section>

      {/* =========================================================
          FAQ ACCORDION SECTION
      ========================================================= */}
      <main className="max-w-4xl mx-auto px-6 pt-12">
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isActive = activeIndex === index;

            return (
              <div 
                key={index} 
                className={`bg-white border rounded-2xl transition-all duration-300 overflow-hidden ${
                  isActive ? 'border-[#0b4c8c] shadow-lg shadow-blue-900/5' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* QUESTION HEADER */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <h3 className={`text-[15px] sm:text-base font-bold pr-4 transition-colors duration-300 ${
                    isActive ? 'text-[#0b4c8c]' : 'text-slate-800'
                  }`}>
                    {faq.question}
                  </h3>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isActive ? 'bg-blue-100 text-[#0b4c8c]' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isActive ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* ANSWER BODY */}
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6 text-slate-600 text-[14px] sm:text-[15px] leading-relaxed border-t border-slate-50 mt-2 pt-4 whitespace-pre-wrap">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================================
            BOTTOM CTA (STILL HAVE QUESTIONS?)
        ========================================================= */}
        <div className="mt-16 bg-slate-900 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden shadow-xl shadow-slate-900/10 border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-600/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-3">Still have questions?</h2>
            <p className="text-sm text-slate-300 mb-8 max-w-lg mx-auto">
              If you couldn't find the answer you were looking for, our technical sales team is ready to assist you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/contact" 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                <MessageSquareQuote size={16} /> Contact Support
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default FaqPage;