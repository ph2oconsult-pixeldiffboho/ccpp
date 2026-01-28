
import { WaterParameters, CalculationResults } from '../types';

/**
 * Standard Methods / AWWA calculation constants for LSI
 * Ref: Standard Methods for the Examination of Water and Wastewater
 */
const getLSIConstants = (params: WaterParameters) => {
  const { temp, tds, calcium, alkalinity } = params;
  
  // 1. TDS Correction (A)
  const A = (Math.log10(tds) - 1) / 10;
  
  // 2. Temperature Correction (B)
  // Formula: -13.12 * log10(C + 273.15) + 34.55
  const B = -13.12 * Math.log10(temp + 273.15) + 34.55;
  
  // 3. Calcium Hardness Correction (C)
  // log10(Ca as CaCO3) - 0.4
  const C = Math.log10(calcium) - 0.4;
  
  // 4. Alkalinity Correction (D)
  // log10(Alk as CaCO3)
  const D = Math.log10(alkalinity);

  // pHs = (9.3 + A + B) - (C + D)
  const phS = (9.3 + A + B) - (C + D);
  
  return { A, B, C, D, phS };
};

/**
 * Calculates water quality indices using industry standard empirical formulas
 */
export const calculateWaterQuality = (params: WaterParameters): CalculationResults => {
  const { pH, calcium, alkalinity } = params;
  
  // Calculate LSI using standard A,B,C,D method
  const { phS } = getLSIConstants(params);
  const lsi = pH - phS;

  // Saturation Condition logic
  let saturationCondition: 'Undersaturated' | 'Saturated' | 'Oversaturated' = 'Saturated';
  if (lsi > 0.1) saturationCondition = 'Oversaturated';
  else if (lsi < -0.1) saturationCondition = 'Undersaturated';

  /**
   * CCPP Calculation using a robust bisection method
   * Find x (mg/L of CaCO3) such that the resulting water has LSI = 0
   * 
   * When x mg/L precipitates:
   * New Ca = Ca_orig - x
   * New Alk = Alk_orig - x
   * New pH shifts based on the CO2/Bicarbonate balance. 
   * For potable water engineering approximations:
   * pH_new = pH_orig + log10(Alk_new / Alk_orig) is a common simplification 
   * for closed systems, but we use a more stable mass-balance approach.
   */
  let low = -200; // Max dissolution 200 mg/L
  let high = 200; // Max precipitation 200 mg/L
  let ccpp = 0;

  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    
    // Adjusted parameters after mid mg/L precipitation
    const testCa = Math.max(1, calcium - mid);
    const testAlk = Math.max(1, alkalinity - mid);
    
    // Estimate pH shift: Precipitation of CaCO3 releases CO2, which typically 
    // lowers pH slightly, but the change in alkalinity is the primary driver.
    // We use the relationship: [H+]_new = [H+]_old * (Alk_old / Alk_new)
    // which simplifies to: pH_new = pH_old + log10(Alk_new / Alk_old)
    const testPh = pH + Math.log10(testAlk / alkalinity);
    
    const { phS: testPhS } = getLSIConstants({ ...params, calcium: testCa, alkalinity: testAlk });
    const testLsi = testPh - testPhS;

    if (testLsi > 0) low = mid;
    else high = mid;

    if (Math.abs(testLsi) < 0.001) {
      ccpp = mid;
      break;
    }
    ccpp = mid;
  }

  // Final equilibrium states based on the CCPP solve
  const eqCa = Math.max(0, calcium - ccpp);
  const eqAlk = Math.max(0, alkalinity - ccpp);
  const eqPh = pH + Math.log10(eqAlk / alkalinity);

  return {
    lsi,
    ccpp,
    phS,
    saturationCondition,
    equilibriumPh: eqPh,
    equilibriumAlk: eqAlk,
    equilibriumCa: eqCa
  };
};

/**
 * Iteratively solves for a parameter (pH or Calcium) to hit a specific CCPP goal
 */
export const solveForTarget = (
  params: WaterParameters, 
  targetCcpp: number, 
  mode: 'pH' | 'calcium'
): number | null => {
  let low = mode === 'pH' ? 6 : 5;
  let high = mode === 'pH' ? 10 : 1000;
  
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const testParams = { ...params, [mode === 'pH' ? 'pH' : 'calcium']: mid };
    const results = calculateWaterQuality(testParams);
    
    // CCPP increases with both pH and Calcium
    if (results.ccpp < targetCcpp) low = mid;
    else high = mid;
    
    if (Math.abs(results.ccpp - targetCcpp) < 0.005) return mid;
  }
  return null;
};
