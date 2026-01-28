
import { WaterParameters, CalculationResults } from '../types';

/**
 * Calculates pK values based on Temperature (Celsius)
 */
const getEquilibriumConstants = (tempC: number) => {
  const TK = tempC + 273.15;
  // pKw
  const pKw = 4470.99 / TK - 6.0875 + 0.01706 * TK;
  // pK1 (Carbonic acid first dissociation)
  const pK1 = 3404.71 / TK + 14.8435 - 0.032786 * TK;
  // pK2 (Bicarbonate dissociation)
  const pK2 = 2902.39 / TK + 6.4980 - 0.02379 * TK;
  // pKs (CaCO3 solubility product - Calcite)
  const pKs = 171.9065 + 0.077993 * TK - 2839.319 / TK - 71.595 * Math.log10(TK);

  return { pKw, pK1, pK2, pKs };
};

/**
 * Calculates Ionic Strength and Activity Coefficients (Davies Equation approximation)
 */
const getActivityCorrections = (tds: number, tempC: number) => {
  const IS = 2.5e-5 * tds; // Simple empirical relationship for IS from TDS
  const TK = tempC + 273.15;
  const A = 1.82e6 * Math.pow(78.3 * TK, -1.5);
  
  const logGamma1 = -A * (Math.sqrt(IS) / (1 + Math.sqrt(IS)) - 0.3 * IS);
  const logGamma2 = 4 * logGamma1; // For divalent ions like Ca2+ and CO3 2-
  
  return { 
    gamma1: Math.pow(10, logGamma1), 
    gamma2: Math.pow(10, logGamma2),
    IS 
  };
};

/**
 * Primary LSI and CCPP Calculation
 */
export const calculateWaterQuality = (params: WaterParameters): CalculationResults => {
  const { pH, temp, tds, calcium, alkalinity } = params;
  const { pK2, pKs } = getEquilibriumConstants(temp);
  const { gamma2 } = getActivityCorrections(tds, temp);

  // LSI = pH - pHs
  // pHs = (pK2 - pKs) + pCa + pAlk + log10(gamma2^2) ... simplified standard formula
  // Note: calcium and alkalinity inputs are in mg/L as CaCO3
  const pCa = -Math.log10(calcium / 100000); // 100,000 is molecular weight * 1000
  const pAlk = -Math.log10(alkalinity / 50000); // 50,000 is equivalent weight * 1000
  
  // Correction factor for LSI (STOKES formula variation)
  const A = (Math.log10(tds) - 1) / 10;
  const B = -13.12 * Math.log10(temp + 273.15) + 34.55;
  const C = Math.log10(calcium) - 0.4;
  const D = Math.log10(alkalinity);
  const pHs = (9.3 + A + B) - (C + D);
  
  const lsi = pH - pHs;

  // CCPP Calculation (Iterative approach)
  // CCPP is the amount of CaCO3 that must dissolve or precipitate to reach LSI = 0
  // while maintaining inorganic carbon balance in a closed system.
  // Simplified for this tool using a robust numerical solver for equilibrium.
  
  let low = -500; // Dissolving 500 mg/L
  let high = 500; // Precipitating 500 mg/L
  let ccpp = 0;
  
  // Bisection method to find the amount X (mg/L CaCO3) that brings LSI to 0
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const testCa = calcium - mid;
    const testAlk = alkalinity - mid;
    
    // Simple pH adjustment assumption: pH changes as Alk changes
    // Refined: pH_eq = pH_init + log10(Alk_eq / Alk_init) roughly for bicarbonate buffering
    const testPh = pH + Math.log10(Math.max(0.1, testAlk) / alkalinity);
    
    const testA = (Math.log10(tds) - 1) / 10;
    const testB = -13.12 * Math.log10(temp + 273.15) + 34.55;
    const testC = Math.log10(Math.max(0.1, testCa)) - 0.4;
    const testD = Math.log10(Math.max(0.1, testAlk));
    const testPhs = (9.3 + testA + testB) - (testC + testD);
    const testLsi = testPh - testPhs;

    if (testLsi > 0) low = mid;
    else high = mid;
    
    if (Math.abs(high - low) < 0.001) {
      ccpp = mid;
      break;
    }
  }

  return {
    lsi,
    ccpp,
    phS: pHs,
    saturationCondition: lsi > 0.2 ? 'Oversaturated' : lsi < -0.2 ? 'Undersaturated' : 'Saturated',
    equilibriumPh: pH + Math.log10(Math.max(0.1, alkalinity - ccpp) / alkalinity),
    equilibriumAlk: Math.max(0, alkalinity - ccpp),
    equilibriumCa: Math.max(0, calcium - ccpp)
  };
};

/**
 * Solves for Target CCPP by adjusting either pH or Calcium
 */
export const solveForTarget = (
  params: WaterParameters, 
  targetCcpp: number, 
  mode: 'pH' | 'calcium'
): number | null => {
  let low = mode === 'pH' ? 4 : 5;
  let high = mode === 'pH' ? 11 : 1000;
  
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    const testParams = { ...params, [mode === 'pH' ? 'pH' : 'calcium']: mid };
    const results = calculateWaterQuality(testParams);
    
    if (results.ccpp < targetCcpp) low = mid;
    else high = mid;
    
    if (Math.abs(results.ccpp - targetCcpp) < 0.01) return mid;
  }
  return null;
};
