import React from 'react';
import { Thermometer, Database, FileText } from 'lucide-react';

const TechnicalsPage = () => {
  const specs = [
    {
      material: "High Alumina Ceramics (99.7% Al₂O₃)",
      maxTemp: "1700°C - 1750°C",
      density: "3.90 g/cm³",
      features: [
        "Extreme resistance to high-temperature chemical erosion",
        "Ideal for molten glass, metals, and harsh acids",
        "Non-porous glaze-free composition for zero sample contamination"
      ]
    },
    {
      material: "Natural Agate Labware",
      maxTemp: "300°C",
      density: "2.65 g/cm³",
      features: [
        "Mohs Hardness Grade 7.0 - High abrasion resistance",
        "Used for ultra-fine particle size reduction and grinding",
        "Impermeable to liquids and chemical reagents"
      ]
    },
    {
      material: "Glazed Laboratory Porcelain",
      maxTemp: "1050°C - 1150°C",
      density: "2.40 g/cm³",
      features: [
        "Thermal expansion matched glazes prevent micro-cracking",
        "Highly resistant to thermal shocks and acid washes",
        "Standard for evaporating dishes, Buchner funnels, crucibles"
      ]
    },
    {
      material: "Fused Quartz Ware",
      maxTemp: "1100°C (Continuous) / 1300°C (Short term)",
      density: "2.20 g/cm³",
      features: [
        "Near-zero thermal expansion coefficient",
        "Can withstand rapid quenching from high heat into cold water",
        "High optical clarity and UV transmission capabilities"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <FileText size={14} /> Material Data Sheets
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Technical & Thermal Specifications
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm">
            Engineering parameters, temperature thresholds, and material purity metrics for Bansal Scientific products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specs.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-blue-400 transition shadow-xs">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-900">{item.material}</h3>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Thermometer size={12}/> {item.maxTemp}
                </span>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Database size={14} className="text-slate-400"/>
                <span>Density: <strong className="text-slate-800">{item.density}</strong></span>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                {item.features.map((feat, fIdx) => (
                  <p key={fIdx} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span> {feat}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechnicalsPage;