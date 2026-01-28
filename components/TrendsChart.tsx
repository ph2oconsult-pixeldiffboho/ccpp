
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
      // Adjusted range 7.0 to 9.0 as requested
      for (let ph = 7.0; ph <= 9.0; ph += 0.05) {
        const results = calculateWaterQuality({ ...params, pH: ph });
        points.push({
          x: parseFloat(ph.toFixed(2)),
          ccpp: parseFloat(results.ccpp.toFixed(2)),
          lsi: parseFloat(results.lsi.toFixed(2)),
        });
      }
    } else {
      const baseCa = params.calcium;
      const start = Math.max(0, baseCa - 150);
      const end = baseCa + 150;
      for (let ca = start; ca <= end; ca += 5) {
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 min-w-0">
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

      <div className="h-[350px] w-full min-h-[350px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 10, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="x" 
              type="number"
              domain={mode === 'pH' ? [7.0, 9.0] : ['auto', 'auto']}
              ticks={mode === 'pH' ? [7.0, 7.5, 8.0, 8.5, 9.0] : undefined}
              allowDataOverflow={true}
              fontSize={10} 
              stroke="#94a3b8" 
              tick={{ fill: '#64748b' }}
              label={{ 
                value: mode === 'pH' ? 'Input pH Range' : 'Calcium (mg/L)', 
                position: 'insideBottom', 
                offset: -10, 
                fontSize: 10,
                fontWeight: 600,
                fill: '#64748b'
              }} 
            />

            {/* CCPP Axis: Fixed -10 to 10 */}
            <YAxis 
              yAxisId="left"
              domain={[-10, 10]}
              allowDataOverflow={true}
              ticks={[-10, -5, 0, 5, 10]}
              fontSize={10} 
              stroke="#0d9488" 
              label={{ 
                value: 'CCPP (mg/L)', 
                angle: -90, 
                position: 'insideLeft', 
                fontSize: 10,
                fontWeight: 700,
                fill: '#0d9488'
              }} 
            />

            {/* LSI Axis: Fixed -3 to 3 */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[-3, 3]}
              allowDataOverflow={true}
              ticks={[-3, -2, -1, 0, 1, 2, 3]}
              fontSize={10} 
              stroke="#8b5cf6" 
              label={{ 
                value: 'LSI', 
                angle: 90, 
                position: 'insideRight', 
                fontSize: 10,
                fontWeight: 700,
                fill: '#8b5cf6'
              }} 
            />

            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '11px',
                fontWeight: 600
              }}
              labelStyle={{ fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}
              formatter={(value: number, name: string) => [
                <span style={{ color: name.includes('CCPP') ? '#0d9488' : '#8b5cf6' }}>{value.toFixed(2)}</span>, 
                name
              ]}
            />
            
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} />
            
            <ReferenceLine yAxisId="left" y={0} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />

            <ReferenceLine 
              x={mode === 'pH' ? params.pH : params.calcium} 
              stroke="#3b82f6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: 'Current', 
                position: 'top', 
                fill: '#3b82f6', 
                fontSize: 10, 
                fontWeight: 700,
                // Only show label if within the visible range
                ...(mode === 'pH' && (params.pH < 7.0 || params.pH > 9.0) ? { value: '' } : {})
              }}
            />

            <Line 
              yAxisId="left"
              name="CCPP (mg/L)"
              type="monotone" 
              dataKey="ccpp" 
              stroke="#0d9488" 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 6, strokeWidth: 0 }} 
              isAnimationActive={false}
            />
            <Line 
              yAxisId="right"
              name="Langelier Index"
              type="monotone" 
              dataKey="lsi" 
              stroke="#8b5cf6" 
              strokeWidth={2} 
              strokeDasharray="4 4"
              dot={false} 
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-4 px-2">
        <span className="font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100 italic">
          Scales: pH 7.0-9.0 | CCPP ±10 | LSI ±3
        </span>
        <span className="text-blue-500 font-bold">Blue Dashed Line = Current Operating Point</span>
      </div>
    </div>
  );
};

export default TrendsChart;
