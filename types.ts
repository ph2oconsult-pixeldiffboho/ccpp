
export interface WaterParameters {
  pH: number;
  temp: number; // Celsius
  tds: number; // mg/L
  calcium: number; // mg/L as CaCO3
  alkalinity: number; // mg/L as CaCO3
}

export interface CalculationResults {
  lsi: number;
  ccpp: number; // mg/L as CaCO3
  phS: number;
  saturationCondition: 'Undersaturated' | 'Saturated' | 'Oversaturated';
  equilibriumPh: number;
  equilibriumAlk: number;
  equilibriumCa: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  ccpp: number;
  lsi: number;
}

export interface TargetSolverResult {
  requiredPh: number | null;
  requiredCalcium: number | null;
  found: boolean;
}
