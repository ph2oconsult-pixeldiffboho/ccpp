
import React from 'react';
import { CalculationResults } from '../types';
import { COLOR_SCALE } from '../constants';

interface Props {
  results: CalculationResults;
}

const ResultsSection: React.FC<Props> = ({ results }) => {
  const getStatusColor = (lsi: number) => {
    if (lsi > 0.5) return COLOR_SCALE.danger; // Scaling
    if (lsi < -0.5) return COLOR_SCALE.warning; // Corrosive
    return COLOR_SCALE.success; // Balanced
  };

  const statusColor = getStatusColor(results.lsi);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* LSI Panel */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Langelier Index (LSI)</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-800">{results.lsi.toFixed(2)}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
            {results.saturationCondition}
          </span>
        </div>
        <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
           <div className="h-full bg-red-400" style={{ width: '33.3%' }}></div>
           <div className="h-full bg-green-400" style={{ width: '33.3%' }}></div>
           <div className="h-full bg-orange-400" style={{ width: '33.3%' }}></div>
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-slate-400">
          <span>Corrosive (-2)</span>
          <span>Balanced (0)</span>
          <span>Scaling (+2)</span>
        </div>
      </div>

      {/* CCPP Panel */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">CCPP (Precipitation Potential)</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-800">{results.ccpp.toFixed(1)}</span>
          <span className="text-sm text-slate-500 font-medium">mg/L as CaCO₃</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          {results.ccpp > 0 
            ? `Likely to precipitate ${results.ccpp.toFixed(1)} mg/L of scale.`
            : `Likely to dissolve ${Math.abs(results.ccpp).toFixed(1)} mg/L of CaCO₃.`}
        </p>
      </div>
      
      {/* Equilibrium Details */}
      <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Thermodynamic Equilibrium States</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Equilibrium pH</div>
            <div className="text-lg font-mono font-bold text-slate-700">{results.equilibriumPh.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Equilibrium Alk</div>
            <div className="text-lg font-mono font-bold text-slate-700">{results.equilibriumAlk.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Equilibrium Ca</div>
            <div className="text-lg font-mono font-bold text-slate-700">{results.equilibriumCa.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSection;
