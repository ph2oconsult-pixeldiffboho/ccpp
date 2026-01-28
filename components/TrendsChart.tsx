
import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { calculateWaterQuality } from '../utils/chemistry';
import { WaterParameters } from '../types';

interface Props {
  params: WaterParameters;
}

type SensitivityMode = 'pH' | 'Calcium';

const TrendsChart: React.FC<Props> = ({ params }) => {
  const [mode, setMode] = useState<SensitivityMode>('pH');

  const data = useMemo(() => {
    const points = [];
    if (mode === 'pH') {
      const basePh = params.pH;
      for (let ph = Math.max(6, basePh - 1.5); ph <= Math.min(10, basePh + 1.5); ph += 0.1) {
        const results = calculateWaterQuality({ ...params, pH: ph });
        points.push({
          x: parseFloat(ph.toFixed(1)),
          ccpp: parseFloat(results.ccpp.toFixed(2)),
          lsi: parseFloat(results.lsi.toFixed(2)),
        });
      }
    } else {
      const baseCa = params.calcium;
      for (let ca = Math.max(5, baseCa - 100); ca <= baseCa + 100; ca += 10) {
        const results = calculateWaterQuality({ ...params, calcium: ca });
        points.push({
          x: ca,
          ccpp: parseFloat(results.ccpp.toFixed(2)),
          lsi: parseFloat(results.lsi.toFixed(2)),
        });
      }
    }
    return points;
  }, [params, mode]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Sensitivity Analysis
        </h2>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['pH', 'Calcium'] as SensitivityMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                mode === m 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              vs {m}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="x" 
              fontSize={10} 
              stroke="#94a3b8" 
              label={{ 
                value: mode === 'pH' ? 'pH' : 'Calcium (mg/L)', 
                position: 'insideBottom', 
                offset: -10, 
                fontSize: 10 
              }} 
            />
            <YAxis 
              fontSize={10} 
              stroke="#94a3b8" 
              label={{ 
                value: 'Value', 
                angle: -90, 
                position: 'insideLeft', 
                fontSize: 10 
              }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              formatter={(value: number, name: string) => [value, name.toUpperCase()]}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
            
            {/* Equilibrium Center Line */}
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
            
            {/* CCPP Target Boundary Lines */}
            <ReferenceLine 
              y={5} 
              stroke="#cbd5e1" 
              strokeDasharray="4 4" 
              label={{ position: 'insideRight', value: '+5 CCPP', fontSize: 9, fill: '#94a3b8', dy: -10 }} 
            />
            <ReferenceLine 
              y={-5} 
              stroke="#cbd5e1" 
              strokeDasharray="4 4" 
              label={{ position: 'insideRight', value: '-5 CCPP', fontSize: 9, fill: '#94a3b8', dy: 10 }} 
            />

            {/* Current Operating Point */}
            <ReferenceLine 
              x={mode === 'pH' ? params.pH : params.calcium} 
              stroke="#3b82f6" 
              strokeDasharray="5 5" 
            />

            <Line 
              name="CCPP (mg/L)"
              type="monotone" 
              dataKey="ccpp" 
              stroke="#0d9488" 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 6 }} 
            />
            <Line 
              name="LSI"
              type="monotone" 
              dataKey="lsi" 
              stroke="#8b5cf6" 
              strokeWidth={2} 
              strokeDasharray="3 3"
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-slate-400 mt-4 italic text-center">
        Threshold lines at ±5 mg/L CCPP indicate the typical target range for water stabilization.
      </p>
    </div>
  );
};

export default TrendsChart;
