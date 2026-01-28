
import React, { useState, useMemo } from 'react';
import { WaterParameters } from './types';
import { calculateWaterQuality } from './utils/chemistry';
import { analyzeWaterProfile } from './services/geminiService';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';
import OptimizationTool from './components/OptimizationTool';
import TrendsChart from './components/TrendsChart';
import ScenarioManager from './components/ScenarioManager';
import { DEFAULT_PARAMS } from './constants';

const App: React.FC = () => {
  const [params, setParams] = useState<WaterParameters>(DEFAULT_PARAMS as unknown as WaterParameters);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);

  const results = useMemo(() => calculateWaterQuality(params), [params]);

  const handleApplyOptimization = (newPartial: Partial<WaterParameters>) => {
    setParams(prev => ({ ...prev, ...newPartial }));
  };

  const handleSaveScenario = () => {
    const name = `Profile ${scenarios.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    const newScenario = {
      id: crypto.randomUUID(),
      name,
      params: { ...params },
      results: { ...results }
    };
    setScenarios([newScenario, ...scenarios].slice(0, 10)); // Keep last 10
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const handleAiAnalyze = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const analysis = await analyzeWaterProfile(params, results);
    setAiAnalysis(analysis || "Analysis unavailable.");
    setIsAnalyzing(false);
  };

  const formatAiText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      const isBullet = line.trim().startsWith('*') || line.trim().startsWith('-');
      const cleanLine = isBullet ? line.trim().substring(1).trim() : line;
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
      <header className="bg-slate-900 text-white py-8 shadow-xl relative overflow-hidden print:hidden">
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
              <p className="text-slate-400 mt-1 text-sm font-medium">CCPP & LSI Engineering Suite</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.print()}
                className="text-xs bg-white text-slate-900 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 hover:bg-slate-100 border border-slate-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Report
              </button>
              <button 
                onClick={() => setParams(DEFAULT_PARAMS as unknown as WaterParameters)}
                className="text-xs border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg font-bold transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-6xl -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-6 print:hidden">
             <InputSection params={params} onChange={setParams} />
             <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-800 p-6 rounded-xl shadow-lg shadow-blue-200/50 text-white">
               <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                 AI Expert Analysis
               </h3>
               <button 
                 disabled={isAnalyzing}
                 onClick={handleAiAnalyze}
                 className="w-full bg-white text-blue-700 py-3 rounded-lg font-black text-sm hover:bg-blue-50 transition-all shadow-md"
               >
                 {isAnalyzing ? "Analyzing..." : "Generate Insights"}
               </button>
             </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <ResultsSection results={results} onSave={handleSaveScenario} />
            
            <div className="print:hidden">
              <ScenarioManager 
                scenarios={scenarios} 
                onDelete={handleDeleteScenario} 
                onRestore={setParams} 
                onSave={handleSaveScenario} 
              />
            </div>

            {aiAnalysis && (
              <div className="bg-white border-l-4 border-l-blue-600 p-8 rounded-xl shadow-xl prose prose-blue max-w-none print:shadow-none print:border-slate-200">
                <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg mb-4">AI Engineering Assessment</h3>
                <div className="text-slate-600 text-sm leading-relaxed">{formatAiText(aiAnalysis)}</div>
              </div>
            )}

            <div className="print:hidden">
              <TrendsChart params={params} />
            </div>

            <div className="print:hidden">
              <OptimizationTool params={params} onApply={handleApplyOptimization} />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 py-8 border-t border-slate-200 print:hidden">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">
            © 2024 HydroGuard Pro • Validated Against RTW4 Standards
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
