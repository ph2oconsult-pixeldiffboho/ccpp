
import React from 'react';
import { WaterParameters, CalculationResults } from '../types';

interface SavedScenario {
  id: string;
  name: string;
  params: WaterParameters;
  results: CalculationResults;
}

interface Props {
  scenarios: SavedScenario[];
  onDelete: (id: string) => void;
  onRestore: (params: WaterParameters) => void;
  onSave: () => void;
}

const ScenarioManager: React.FC<Props> = ({ scenarios, onDelete, onRestore, onSave }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-2 overflow-hidden animate-slide-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="bg-amber-100 p-1.5 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          Scenario Comparison Manager
        </h2>
        <button 
          onClick={onSave}
          className="text-xs bg-amber-600 text-white border border-amber-700 px-4 py-2 rounded-lg font-bold hover:bg-amber-700 transition flex items-center gap-2 shadow-lg shadow-amber-900/10"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          Snapshot Current
        </button>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="mx-auto w-12 h-12 bg-slate-200/50 rounded-full flex items-center justify-center mb-3">
             <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">No Saved Profiles</p>
          <p className="text-slate-400 text-[11px]">Click "Snapshot Current" or the Snapshot icon in results to start comparing water profiles.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scenario Name</th>
                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parameters</th>
                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">LSI Result</th>
                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">CCPP Result</th>
                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right px-2">Manage</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="py-4">
                    <div className="font-black text-slate-800 text-xs">{s.name}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Captured Profile</div>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2 text-[10px] font-mono text-slate-500">
                      <span title="pH" className="bg-slate-100 px-1 rounded">pH {s.params.pH.toFixed(2)}</span>
                      <span title="Temp" className="bg-slate-100 px-1 rounded">{s.params.temp}°C</span>
                      <span title="Alk" className="bg-slate-100 px-1 rounded">A {s.params.alkalinity}</span>
                      <span title="Ca" className="bg-slate-100 px-1 rounded">C {s.params.calcium}</span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${Math.abs(s.results.lsi) < 0.2 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-800'}`}>
                      {s.results.lsi.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${s.results.ccpp > 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {s.results.ccpp.toFixed(1)} <span className="text-[9px] font-medium opacity-70">mg/L</span>
                    </span>
                  </td>
                  <td className="py-4 text-right space-x-3 px-2">
                    <button 
                      onClick={() => onRestore(s.params)}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest border-b border-transparent hover:border-blue-600"
                    >
                      Load
                    </button>
                    <button 
                      onClick={() => onDelete(s.id)}
                      className="text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScenarioManager;
