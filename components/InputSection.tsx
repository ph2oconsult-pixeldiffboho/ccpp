
import React from 'react';
import { WaterParameters } from '../types';

interface Props {
  params: WaterParameters;
  onChange: (newParams: WaterParameters) => void;
}

const InputSection: React.FC<Props> = ({ params, onChange }) => {
  const handleChange = (key: keyof WaterParameters, val: string) => {
    let numVal = parseFloat(val);
    
    // Allow empty string for better typing experience, but don't update state with NaN
    if (isNaN(numVal)) return;

    onChange({ ...params, [key]: numVal });
  };

  const InputField = ({ label, unit, value, min, max, step, paramKey }: any) => (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          {label}
          <span className="text-[10px] text-slate-400 font-medium">({unit})</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => handleChange(paramKey, e.target.value)}
            className="w-24 text-right text-sm font-mono bg-slate-50 hover:bg-white focus:bg-white px-2 py-1 rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>
      <div className="px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleChange(paramKey, e.target.value)}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all hover:bg-slate-300"
        />
      </div>
      <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
        <span>Min: {min}</span>
        <span>Max: {max}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <div className="bg-blue-50 p-1.5 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        Parameters
      </h2>
      
      <div className="space-y-2">
        <InputField label="pH Level" unit="pH" value={params.pH} min={6} max={10} step={0.1} paramKey="pH" />
        <InputField label="Temperature" unit="°C" value={params.temp} min={0} max={60} step={1} paramKey="temp" />
        <InputField label="TDS" unit="mg/L" value={params.tds} min={0} max={2000} step={10} paramKey="tds" />
        <InputField label="Calcium Hardness" unit="mg/L CaCO₃" value={params.calcium} min={5} max={500} step={5} paramKey="calcium" />
        <InputField label="Total Alkalinity" unit="mg/L CaCO₃" value={params.alkalinity} min={5} max={500} step={5} paramKey="alkalinity" />
      </div>
    </div>
  );
};

export default InputSection;
