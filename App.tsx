
import React, { useState, useMemo } from 'react';
import { WaterParameters } from './types';
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

  // Helper to format AI response (simple bolding and bullet detection)
  const formatAiText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      
      // Check for bullet points
      const isBullet = line.trim().startsWith('*') || line.trim().startsWith('-');
      const cleanLine = isBullet ? line.trim().substring(1).trim() : line;
      
      // Handle bold text **like this**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <div key={i} className={`${isBullet ? 'pl-4 relative mb-1' : 'mb-2'}`}>
          {isBullet && <span className="absolute left-0 text-blue-500">•</span>}
          {formattedLine}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 pb-12 transition-colors duration-500">
      {/* Header */}
      <header className="bg-slate-900 text-white py-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-indigo-500"></div>
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <span className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.618.309a6 6 0 01-3.86.517l-2.387-.477a2 2 0 00-1.022.547l-1.168 1.168a2 2 0 00.556 3.212 9.954 9.954 0 006.464 1.441 9.954 9.954 0 006.464-1.441 2 2 0 00.556-3.212l-1.168-1.168zM8.684 10.703a4 4 0 005.632 5.632l2.396-2.396a4 4 0 00-5.632-5.632l-2.396 2.396z" />
                  </svg>
                </span>
                HydroGuard Pro
              </h1>
              <p className="text-slate-400 mt-1 text-sm font-medium">CCPP & LSI Engineering Suite for Potable Systems</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">System Active</span>
              </div>
              <button 
                onClick={() => setParams(DEFAULT_PARAMS as unknown as WaterParameters)}
                className="text-xs border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Reset
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
             <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-800 p-6 rounded-xl shadow-lg shadow-blue-200/50 text-white relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10">
                 <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
               </div>
               <h3 className="font-bold text-lg mb-2 flex items-center gap-2 relative z-10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                 AI Professional Insights
               </h3>
               <p className="text-blue-100 text-xs mb-4 leading-relaxed relative z-10">
                 Generate an expert engineering summary of this water profile using Gemini Intelligence.
               </p>
               <button 
                 disabled={isAnalyzing}
                 onClick={handleAiAnalyze}
                 className="w-full bg-white text-blue-700 py-3 rounded-lg font-black text-sm hover:bg-blue-50 transition-all transform active:scale-95 flex items-center justify-center gap-2 relative z-10 shadow-md"
               >
                 {isAnalyzing ? (
                   <>
                     <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                     Analyzing Water Chemistry...
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
              <div className="bg-white border-l-4 border-l-blue-600 p-8 rounded-xl shadow-xl animate-slide-in relative">
                <div className="absolute top-4 right-4">
                  <button onClick={() => setAiAnalysis(null)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg mb-6 pb-4 border-b border-slate-100">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  Engineering Assessment Memo
                </h3>
                <div className="text-slate-600 text-sm leading-relaxed prose prose-blue max-w-none">
                  {formatAiText(aiAnalysis)}
                </div>
                <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gemini Engine Analysis • 2.5 Flash</span>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase transition-colors">Print PDF</button>
                    <button className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase transition-colors">Copy Text</button>
                  </div>
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <TrendsChart params={params} />
            </div>

            {/* Target Tool */}
            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <OptimizationTool params={params} onApply={handleApplyOptimization} />
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">
            © 2024 HydroGuard Pro • Professional Water Chemistry Analysis
          </p>
          <div className="flex gap-4">
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">API Context: {process.env.API_KEY ? 'Authenticated' : 'Offline Mode'}</span>
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Version: 1.2.4-stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
