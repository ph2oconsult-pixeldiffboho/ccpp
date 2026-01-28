
import React from 'react';
import { CalculationResults } from '../types';
import { COLOR_SCALE } from '../constants';

interface Props {
  results: CalculationResults;
  onSave: () => void;
}

const ResultsSection: React.FC<Props> = ({ results, onSave }) => {
  const getStatusColor = (lsi: number) => {
    if (lsi > 0.5) return COLOR_SCALE.danger; // Scaling
    if (lsi < -0.5) return COLOR_SCALE.warning; // Corrosive
    return COLOR_SCALE.success; // Balanced
  };

  const statusColor = getStatusColor(results.lsi);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LSI Panel */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 print:hidden">
             <button 
               onClick={onSave}
               title="Save this snapshot"
               className="p-1.5 bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors border border-slate-100"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
             </button>
          </div>
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
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 print:hidden">
             <button 
               onClick={onSave}
               className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 hover:bg-amber-100 transition flex items-center gap-1"
             >
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
               Snapshot
             </button>
          </div>
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
      </div>
      
      {/* Equilibrium Details */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
          Thermodynamic Equilibrium States
          <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tighter">Theoretical Balanced Point</span>
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white p-2 rounded border border-slate-100">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Equilibrium pH</div>
            <div className="text-lg font-mono font-bold text-slate-700">{results.equilibriumPh.toFixed(2)}</div>
          </div>
          <div className="bg-white p-2 rounded border border-slate-100">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Equilibrium Alk</div>
            <div className="text-lg font-mono font-bold text-slate-700">{results.equilibriumAlk.toFixed(1)}</div>
          </div>
          <div className="bg-white p-2 rounded border border-slate-100">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Equilibrium Ca</div>
            <div className="text-lg font-mono font-bold text-slate-700">{results.equilibriumCa.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSection;
