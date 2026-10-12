import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { 
  ShieldCheck, 
  Globe2, 
  Flame, 
  Award, 
  Microscope, 
  Factory, 
  Target, 
  ChevronRight,
  CheckCircle2 
} from 'lucide-react';

const AboutPage = () => {
  const [cmsData, setCmsData] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Fetch dynamic content
    api.get('/site-content')
      .then(res => setCmsData(res.data?.data))
      .catch(err => console.error(err));
  }, []);

  // Premium Fallback Texts
  const defaultIntro = "Bansal Scientific & Ceramic Industry serves laboratories, academic institutions, hospitals, research organizations, and industrial sectors across India and overseas. Years of experience in ceramic engineering and materials science have allowed us to develop one of the widest and finest ranges of laboratory ceramic wares in the country.";
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 selection:bg-blue-200">
      
      {/* =========================================================
          HERO SECTION (MODERN OVERLAP DESIGN)
      ========================================================= */}
      <section className="relative w-full pt-20 pb-32 lg:pt-32 lg:pb-48 bg-gradient-to-br from-[#072f5f] via-[#0b4c8c] to-blue-900 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[140%] rounded-full bg-gradient-to-b from-white/10 to-transparent blur-3xl"></div>
          <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[60%] rounded-full bg-gradient-to-t from-blue-400/20 to-transparent blur-3xl"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
            <Award size={14} className="text-amber-400" />
            Leading Indian Manufacturer
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Precision Ceramics for <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
              Global Innovators.
            </span>
          </h1>
          <p className="mt-6 text-blue-100/80 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Delivering high-performance Porcelain, 99.7% Alumina, and Agate laboratory wares engineered for the world's most demanding environments.
          </p>
        </div>
      </section>

      <main className="max-w-[1200px] mx-auto px-6 -mt-20 lg:-mt-32 relative z-20 space-y-16 lg:space-y-24">
        
        {/* =========================================================
            TRUST METRICS (FLOATING STATS BAR)
        ========================================================= */}
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 p-6 sm:p-10 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
          <div className="flex flex-col items-center justify-center text-center px-4">
            <Flame size={32} className="text-amber-500 mb-3" />
            <div className="text-3xl font-extrabold text-slate-900">1750°C</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Max Temperature</div>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-4">
            <Microscope size={32} className="text-[#0b4c8c] mb-3" />
            <div className="text-3xl font-extrabold text-slate-900">99.8%</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Alumina Purity</div>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-4">
            <ShieldCheck size={32} className="text-emerald-500 mb-3" />
            <div className="text-3xl font-extrabold text-slate-900">ISO</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">9001:2015 Certified</div>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-4">
            <Globe2 size={32} className="text-blue-500 mb-3" />
            <div className="text-3xl font-extrabold text-slate-900">Global</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Export Network</div>
          </div>
        </div>

        {/* =========================================================
            COMPANY MISSION & VIDEO
        ========================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Rooted in Research. <br />
              <span className="text-[#0b4c8c]">Built for Industry.</span>
            </h2>
            
            <div className="pl-6 border-l-4 border-[#0b4c8c] py-2">
              <p className="text-lg text-slate-700 font-medium leading-relaxed italic">
                "Our clear objective is to deliver high-precision ceramic laboratory products that meet global quality standards while ensuring absolute consistency."
              </p>
            </div>

            {/* DYNAMIC TEXT HERE */}
            <p className="text-[15px] text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">
              {cmsData?.aboutUs?.introText || defaultIntro}
            </p>
            
            <div className="pt-4 flex items-center gap-4">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <span className="text-sm font-bold text-slate-800">Trusted for thermal stability & dimensional accuracy.</span>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-[#0b4c8c] rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0" 
                title="Bansal Scientific Manufacturing Video" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>

        {/* =========================================================
            BENTO GRID: MANUFACTURING EXCELLENCE
        ========================================================= */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Manufacturing Excellence</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Our fully integrated manufacturing facility allows us to maintain complete control over production quality and batch consistency, supporting institutional supply and custom-designs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#0b4c8c] text-white p-8 sm:p-10 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition duration-700">
                <Factory size={160} />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6">
                  <Flame size={24} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">High Alumina (99.7%) Products</h3>
                <p className="text-blue-100 text-sm leading-relaxed max-w-md">
                  High-purity alumina components engineered for high-temperature performance up to 1750°C. Perfect for demanding industrial environments and metallurgical testing.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <Microscope size={24} className="text-[#0b4c8c]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Porcelain Lab Wares</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Precision-crafted porcelain products designed for chemical resistance, thermal stability, and routine laboratory applications.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <Target size={24} className="text-[#0b4c8c]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Agate Mortar & Pestles</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Natural agate grinding tools manufactured for precise sample preparation and absolute minimal contamination.
              </p>
            </div>

            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 sm:p-10 rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition duration-700"></div>
               <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center h-full">
                 <div className="flex-1">
                   <h3 className="text-2xl font-bold mb-3">Industrial & Technical Ceramics</h3>
                   <p className="text-slate-300 text-sm leading-relaxed mb-6">
                     Custom-engineered ceramic components developed specifically for industrial machinery, advanced research, and complex technical applications requiring exact tolerances.
                   </p>
                   <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition">
                     Request Custom Specs <ChevronRight size={16} />
                   </Link>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            ISO COMPLIANCE & CTA SECTION
        ========================================================= */}
        <section className="relative bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -z-0"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-tr-[100px] -z-0"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-bold uppercase tracking-wider mb-4 border border-emerald-100">
                <ShieldCheck size={14} /> Quality Assured
              </div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-4">
                ISO 9001:2015 Certified
              </h2>
              <p className="text-[14px] text-slate-600 leading-relaxed max-w-2xl">
                Every stage of our manufacturing process — from <strong>raw material selection</strong> to <strong>forming, glazing, firing</strong>, and <strong>final inspection</strong> — is executed entirely in-house under strict quality control protocols. This ensures consistent performance across all batches.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center md:items-end space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Explore Our Range</h3>
              <Link 
                to="/technicals" 
                className="bg-[#1a8b44] hover:bg-[#146c35] text-white font-bold text-sm px-8 py-4 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                Product Brochures
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default AboutPage;