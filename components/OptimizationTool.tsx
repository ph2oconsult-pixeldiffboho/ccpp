
import React, { useState } from 'react';
import { solveForTarget } from '../utils/chemistry';
import { WaterParameters } from '../types';

interface Props {
  params: WaterParameters;
  onApply: (newParams: Partial<WaterParameters>) => void;
}

const OptimizationTool: React.FC<Props> = ({ params, onApply }) => {
  const [targetCcpp, setTargetCcpp] = useState<number>(5.0);
  const [solvedPh, setSolvedPh] = useState<number | null>(null);
  const [solvedCa, setSolvedCa] = useState<number | null>(null);

  const handleSolve = () => {
    const ph = solveForTarget(params, targetCcpp, 'pH');
    const ca = solveForTarget(params, targetCcpp, 'calcium');
    setSolvedPh(ph);
    setSolvedCa(ca);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Target CCPP Optimizer
      </h2>
      
      <div className="flex gap-4 items-end mb-6">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target CCPP (mg/L)</label>
          <input 
            type="number" 
            value={targetCcpp} 
            onChange={(e) => setTargetCcpp(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
          />
        </div>
        <button 
          onClick={handleSolve}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
        >
          Solve
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-slate-100 bg-slate-50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Required pH</span>
          <div className="flex justify-between items-center mt-1">
            <span className="text-2xl font-black text-indigo-900">{solvedPh?.toFixed(2) || '--'}</span>
            {solvedPh && (
              <button 
                onClick={() => onApply({ pH: solvedPh })}
                className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 font-bold text-slate-600"
              >
                Apply
              </button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-100 bg-slate-50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Required Calcium</span>
          <div className="flex justify-between items-center mt-1">
            <span className="text-2xl font-black text-indigo-900">{solvedCa?.toFixed(1) || '--'}</span>
            {solvedCa && (
              <button 
                onClick={() => onApply({ calcium: solvedCa })}
                className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 font-bold text-slate-600"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationTool;
