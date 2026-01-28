
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calculateWaterQuality } from '../utils/chemistry';
import { WaterParameters } from '../types';

interface Props {
  params: WaterParameters;
}

const TrendsChart: React.FC<Props> = ({ params }) => {
  const data = useMemo(() => {
    const points = [];
    const basePh = params.pH;
    for (let ph = Math.max(6, basePh - 1); ph <= Math.min(10, basePh + 1); ph += 0.1) {
      const results = calculateWaterQuality({ ...params, pH: ph });
      points.push({
        ph: ph.toFixed(1),
        ccpp: parseFloat(results.ccpp.toFixed(2)),
        lsi: parseFloat(results.lsi.toFixed(2)),
      });
    }
    return points;
  }, [params]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        Sensitivity Analysis (CCPP vs pH)
      </h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="ph" fontSize={10} stroke="#94a3b8" label={{ value: 'pH Scale', position: 'insideBottom', offset: -5, fontSize: 10 }} />
            <YAxis fontSize={10} stroke="#94a3b8" label={{ value: 'CCPP (mg/L)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} label={{ value: 'Saturation', position: 'right', fill: '#94a3b8', fontSize: 10 }} />
            <ReferenceLine x={params.pH.toFixed(1)} stroke="#3b82f6" strokeDasharray="5 5" label={{ value: 'Current pH', position: 'top', fill: '#3b82f6', fontSize: 10 }} />
            <Line type="monotone" dataKey="ccpp" stroke="#0d9488" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendsChart;
