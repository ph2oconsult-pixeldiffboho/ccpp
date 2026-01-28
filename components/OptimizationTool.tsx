
import React, { useState, useEffect } from 'react';
import { solveForTarget } from '../utils/chemistry';
import { WaterParameters } from '../types';

interface Props {
  params: WaterParameters;
  onApply: (newParams: Partial<WaterParameters>) => void;
}

const OptimizationTool: React.FC<Props> = ({ params, onApply }) => {
  const [targetCcpp, setTargetCcpp] = useState<number>(5.0);
  
  // States for "What-if" inputs within the solver
  const [fixedCalcium, setFixedCalcium] = useState<number>(params.calcium);
  const [fixedPh, setFixedPh] = useState<number>(params.pH);
  
  // Results
  const [solvedPh, setSolvedPh] = useState<number | null>(null);
  const [solvedCa, setSolvedCa] = useState<number | null>(null);

  // Sync internal fixed values when main params change, 
  // but only if they haven't been manually touched (simple heuristic)
  useEffect(() => {
    setFixedCalcium(params.calcium);
    setFixedPh(params.pH);
  }, [params.calcium, params.pH]);

  const handleSolvePh = () => {
    // We want to find pH, so we use the user-defined 'fixedCalcium'
    const tempParams = { ...params, calcium: fixedCalcium };
    const result = solveForTarget(tempParams, targetCcpp, 'pH');
    setSolvedPh(result);
  };

  const handleSolveCa = () => {
    // We want to find Calcium, so we use the user-defined 'fixedPh'
    const tempParams = { ...params, pH: fixedPh };
    const result = solveForTarget(tempParams, targetCcpp, 'calcium');
    setSolvedCa(result);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="bg-indigo-100 p-1.5 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          Target CCPP Solver Workbench
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target CCPP:</label>
          <div className="relative">
            <input 
              type="number" 
              value={targetCcpp} 
              onChange={(e) => setTargetCcpp(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm font-mono font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <span className="absolute right-2 top-1.5 text-[8px] text-slate-400 font-bold uppercase pointer-events-none">mg/L</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Solve for pH Column */}
        <div className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-100 p-5">
          <div className="mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
              Find Required pH
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[9px]">Fixed Calcium</span>
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Calcium Input (mg/L)</label>
                <input 
                  type="number"
                  value={fixedCalcium}
                  onChange={(e) => setFixedCalcium(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <button 
                onClick={handleSolvePh}
                className="mt-auto px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-200 uppercase tracking-wider"
              >
                Solve
              </button>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">Required pH Result</div>
              <div className="text-3xl font-black text-indigo-900 leading-none mt-1">
                {solvedPh !== null ? solvedPh.toFixed(2) : '--'}
              </div>
            </div>
            {solvedPh !== null && (
              <button 
                onClick={() => onApply({ pH: solvedPh, calcium: fixedCalcium })}
                className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 text-[10px] font-black rounded hover:bg-indigo-50 transition uppercase"
              >
                Apply Profile
              </button>
            )}
          </div>
        </div>

        {/* Solve for Calcium Column */}
        <div className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-100 p-5">
          <div className="mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
              Find Required Calcium
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[9px]">Fixed pH</span>
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">pH Input</label>
                <input 
                  type="number"
                  step="0.01"
                  value={fixedPh}
                  onChange={(e) => setFixedPh(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <button 
                onClick={handleSolveCa}
                className="mt-auto px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-200 uppercase tracking-wider"
              >
                Solve
              </button>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">Required Ca (mg/L)</div>
              <div className="text-3xl font-black text-indigo-900 leading-none mt-1">
                {solvedCa !== null ? solvedCa.toFixed(1) : '--'}
              </div>
            </div>
            {solvedCa !== null && (
              <button 
                onClick={() => onApply({ calcium: solvedCa, pH: fixedPh })}
                className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 text-[10px] font-black rounded hover:bg-indigo-50 transition uppercase"
              >
                Apply Profile
              </button>
            )}
          </div>
        </div>
      </div>
      
      <p className="mt-4 text-[10px] text-slate-400 italic font-medium leading-relaxed">
        * Note: Solving updates the missing parameter while holding the specified "Fixed" value and other profile parameters (TDS, Temp, Alk) constant.
      </p>
    </div>
  );
};

export default OptimizationTool;
