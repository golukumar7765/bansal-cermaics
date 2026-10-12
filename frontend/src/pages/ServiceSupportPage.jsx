import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  FileText,
  Headphones,
  PackageCheck,
  SearchCheck,
  Wrench
} from 'lucide-react';
import api from '../lib/api';

const defaultContent = {
  heading: 'Service & Support',
  content: 'From product selection to after-sales assistance, our team helps customers choose the right product and move their requirement forward with confidence.'
};

const supportSteps = [
  {
    icon: SearchCheck,
    title: 'Product selection',
    description: 'Share your application, material requirement, dimensions, quantity and operating conditions so we can help identify a suitable product.'
  },
  {
    icon: FileText,
    title: 'Technical information',
    description: 'Use technical resources and product specifications to review available materials, variants and documents before ordering.'
  },
  {
    icon: ClipboardCheck,
    title: 'Custom & bulk requirements',
    description: 'For special dimensions, drawings, larger quantities or export enquiries, submit a detailed RFQ and our team can review it.'
  },
  {
    icon: PackageCheck,
    title: 'Order assistance',
    description: 'After an order is placed, use your order number and email address to check its current status online.'
  }
];

const ServiceSupportPage = () => {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await api.get('/site-content');
        const savedContent = response.data?.data?.serviceSupport;
        if (savedContent?.heading || savedContent?.content) {
          setContent({ ...defaultContent, ...savedContent });
        }
      } catch {
        // The page remains useful before CMS content has been configured.
      }
    };

    loadContent();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <section className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              <Headphones size={15} /> Customer care
            </div>
            <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight">{content.heading}</h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-300">
              {content.content}
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
        <section>
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">How we can help</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950">Support at every stage</h2>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {supportSteps.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={21} />
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-3">
          <Link to="/technicals" className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            <FileText className="text-emerald-700" size={22} />
            <h2 className="mt-4 font-extrabold text-slate-950">Technical resources</h2>
            <p className="mt-2 text-sm text-slate-600">Browse documents and product information.</p>
          </Link>
          <Link to="/track-order" className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            <PackageCheck className="text-emerald-700" size={22} />
            <h2 className="mt-4 font-extrabold text-slate-950">Track an order</h2>
            <p className="mt-2 text-sm text-slate-600">Check your order status using your order details.</p>
          </Link>
          <Link to="/contact" className="rounded-2xl bg-emerald-700 p-6 text-white transition hover:bg-emerald-800 hover:shadow-md">
            <Wrench size={22} />
            <h2 className="mt-4 font-extrabold">Request support</h2>
            <p className="mt-2 text-sm text-emerald-50">Send product, technical or bulk-order requirements to our team.</p>
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ServiceSupportPage;
