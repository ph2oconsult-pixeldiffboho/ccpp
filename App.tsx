
import React, { useState, useMemo, useEffect } from 'react';
import { WaterParameters, CalculationResults } from './types';
import { calculateWaterQuality } from './utils/chemistry';
import { analyzeWaterProfile } from './services/geminiService';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';
import OptimizationTool from './components/OptimizationTool';
import TrendsChart from './components/TrendsChart';
import { DEFAULT_PARAMS } from './constants';

const App: React.FC = () => {
  const [params, setParams] = useState<WaterParameters>(DEFAULT_PARAMS as unknown as WaterParameters);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const results = useMemo(() => calculateWaterQuality(params), [params]);

  const handleApplyOptimization = (newPartial: Partial<WaterParameters>) => {
    setParams(prev => ({ ...prev, ...newPartial }));
  };

  const handleAiAnalyze = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const analysis = await analyzeWaterProfile(params, results);
    setAiAnalysis(analysis || "Analysis unavailable.");
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-slate-900 text-white py-8 shadow-xl">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <span className="bg-blue-600 p-1.5 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.618.309a6 6 0 01-3.86.517l-2.387-.477a2 2 0 00-1.022.547l-1.168 1.168a2 2 0 00.556 3.212 9.954 9.954 0 006.464 1.441 9.954 9.954 0 006.464-1.441 2 2 0 00.556-3.212l-1.168-1.168zM8.684 10.703a4 4 0 005.632 5.632l2.396-2.396a4 4 0 00-5.632-5.632l-2.396 2.396z" />
                  </svg>
                </span>
                HydroGuard Pro
              </h1>
              <p className="text-slate-400 mt-1 text-sm font-medium">CCPP & LSI Engineering Suite for Potable Systems</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setParams(DEFAULT_PARAMS as unknown as WaterParameters)}
                className="text-xs border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg font-bold transition"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 max-w-6xl -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar: Inputs */}
          <div className="lg:col-span-4 flex flex-col gap-6">
             <InputSection params={params} onChange={setParams} />
             
             {/* Gemini Button */}
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg shadow-blue-100 text-white">
               <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                 AI Professional Insights
               </h3>
               <p className="text-blue-100 text-xs mb-4 leading-relaxed">
                 Generate an expert engineering summary of this water profile using Gemini Intelligence.
               </p>
               <button 
                 disabled={isAnalyzing}
                 onClick={handleAiAnalyze}
                 className="w-full bg-white text-blue-700 py-2.5 rounded-lg font-black text-sm hover:bg-blue-50 transition flex items-center justify-center gap-2"
               >
                 {isAnalyzing ? (
                   <>
                     <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                     Analyzing...
                   </>
                 ) : "Run AI Expert Analysis"}
               </button>
             </div>
          </div>

          {/* Main Display: Results & Tools */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Real-time Results */}
            <ResultsSection results={results} />

            {/* AI Result Box */}
            {aiAnalysis && (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-blue-900 flex items-center gap-2">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                     AI Engineering Memo
                   </h3>
                   <button onClick={() => setAiAnalysis(null)} className="text-blue-400 hover:text-blue-600">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <div className="text-blue-800 text-sm leading-relaxed prose prose-slate">
                  {aiAnalysis.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                </div>
              </div>
            )}

            {/* Charts */}
            <TrendsChart params={params} />

            {/* Target Tool */}
            <OptimizationTool params={params} onApply={handleApplyOptimization} />

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-slate-400 text-xs">
        <p>© 2024 HydroGuard Pro • Scientific Water Treatment Tool • Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;
