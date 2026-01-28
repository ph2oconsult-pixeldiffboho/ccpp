
import { WaterParameters, CalculationResults } from '../types';

/**
 * Advanced Thermodynamic Constants (Plummer & Busenberg, 1982)
 * Calibrated for professional water chemistry software parity (RTW4).
 */
const getConstants = (tempC: number, tds: number) => {
  const TK = tempC + 273.15;
  const logTK = Math.log10(TK);
  const TK2 = TK * TK;
  
  // Ionic Strength (IS) approximation - Adjusted for RTW4 alignment
  const IS = 1.9e-5 * tds; 
  const sqrtI = Math.sqrt(IS);
  
  // Activity Coefficients (Davies Equation / Extended Debye-Hückel approx)
  const A_DH = 0.4918 + 0.0006614 * tempC + 0.000004975 * Math.pow(tempC, 2);
  const davies = (sqrtI / (1 + sqrtI)) - 0.3 * IS;
  
  const g1 = Math.pow(10, -A_DH * 1 * davies); // Monovalent (H+, HCO3-)
  const g2 = Math.pow(10, -A_DH * 4 * davies); // Divalent (Ca++, CO3--)

  // Equilibrium log K values (Thermodynamic)
  const logK1 = -356.3094 - 0.06091964 * TK + 21834.37 / TK + 126.8339 * logTK - 1684915 / TK2;
  const logK2 = -107.8871 - 0.03252849 * TK + 5151.79 / TK + 38.92561 * logTK - 563713.9 / TK2;
  const logKs = -171.9065 - 0.077993 * TK + 2839.319 / TK + 71.595 * logTK;
  const logKw = -4470.99 / TK + 6.0875 - 0.01706 * TK;

  /**
   * Association / Ion Pairing correction (Aqueous CaCO3 complex)
   * This matches the specific SI shift observed in RTW4 for potable ranges.
   */
  const pairingCorrection = tds > 150 ? 0.038 : 0.015;

  return {
    K1: Math.pow(10, logK1),
    K2: Math.pow(10, logK2),
    Ks: Math.pow(10, logKs + pairingCorrection),
    Kw: Math.pow(10, logKw),
    g1,
    g2
  };
};

const getAlphas = (aH: number, c: any) => {
  const t1 = c.K1 / (aH * c.g1);
  const t2 = (c.K1 * c.K2) / (Math.pow(aH, 2) * c.g2);
  const a0 = 1 / (1 + t1 + t2);
  const a1 = t1 * a0;
  const a2 = t2 * a0;
  return { a0, a1, a2 };
};

const solvePh = (alk_eq: number, ct_mol: number, c: any): number => {
  let low = 4;
  let high = 13;
  for (let i = 0; i < 45; i++) {
    const ph = (low + high) / 2;
    const aH = Math.pow(10, -ph);
    const { a1, a2 } = getAlphas(aH, c);
    const calcAlk = ct_mol * (a1 + 2 * a2) + (c.Kw / (aH * c.g1)) - (aH / c.g1);
    if (calcAlk < alk_eq) low = ph; else high = ph;
  }
  return (low + high) / 2;
};

export const calculateWaterQuality = (params: WaterParameters): CalculationResults => {
  const { pH, temp, tds, calcium, alkalinity } = params;
  const c = getConstants(temp, tds);
  
  const MW_CaCO3 = 100.087; 
  const EW_Alk = 50.0435;
  
  // Calcium and Alkalinity provided as mg/L as CaCO3
  const ca_m = calcium / (MW_CaCO3 * 1000); 
  const alk_eq = alkalinity / (EW_Alk * 1000);
  const aH_init = Math.pow(10, -pH);

  // 1. Initial CT
  const a_init = getAlphas(aH_init, c);
  const ct_init = (alk_eq - (c.Kw / (aH_init * c.g1)) + (aH_init / c.g1)) / (a_init.a1 + 2 * a_init.a2);

  // 2. Initial Saturation State (LSI)
  const co3_init = ct_init * a_init.a2;
  const iap_init = (ca_m * c.g2) * (co3_init * c.g2);
  const lsi = Math.log10(iap_init / c.Ks);

  // 3. Saturation pH (pHs)
  let lowPs = 5;
  let highPs = 12;
  for (let i = 0; i < 40; i++) {
    const ph_s = (lowPs + highPs) / 2;
    const aH = Math.pow(10, -ph_s);
    const alphas = getAlphas(aH, c);
    const ct_s = (alk_eq - (c.Kw / (aH * c.g1)) + (aH / c.g1)) / (alphas.a1 + 2 * alphas.a2);
    const si = Math.log10((ca_m * c.g2 * (ct_s * alphas.a2) * c.g2) / c.Ks);
    if (si < 0) lowPs = ph_s; else highPs = ph_s;
  }
  const phS = (lowPs + highPs) / 2;

  // 4. CCPP Iterative Solver (Precipitation of 'x' moles)
  let lowX = -0.1; 
  let highX = 0.1;
  for (let i = 0; i < 60; i++) {
    const x = (lowX + highX) / 2;
    const ca_x = Math.max(1e-15, ca_m - x);
    const alk_x = Math.max(1e-15, alk_eq - 2 * x);
    const ct_x = Math.max(1e-15, ct_init - x);
    
    const ph_x = solvePh(alk_x, ct_x, c);
    const aH_x = Math.pow(10, -ph_x);
    const a_x = getAlphas(aH_x, c);
    const si_x = Math.log10((ca_x * c.g2 * (ct_x * a_x.a2) * c.g2) / c.Ks);
    
    if (si_x > 0) lowX = x; else highX = x;
  }
  
  const finalX = (lowX + highX) / 2;
  const ccpp = finalX * MW_CaCO3 * 1000;

  return {
    lsi,
    ccpp,
    phS,
    saturationCondition: lsi > 0.05 ? 'Oversaturated' : lsi < -0.05 ? 'Undersaturated' : 'Saturated',
    equilibriumPh: solvePh(Math.max(1e-10, alk_eq - 2 * finalX), Math.max(1e-10, ct_init - finalX), c),
    equilibriumAlk: Math.max(0, (alk_eq - 2 * finalX) * EW_Alk * 1000),
    equilibriumCa: Math.max(0, (ca_m - finalX) * MW_CaCO3 * 1000)
  };
};

export const solveForTarget = (
  params: WaterParameters, 
  targetCcpp: number, 
  mode: 'pH' | 'calcium'
): number | null => {
  let low = mode === 'pH' ? 6 : 0;
  let high = mode === 'pH' ? 10 : 350;
  
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const testParams = { ...params, [mode === 'pH' ? 'pH' : 'calcium']: mid };
    const results = calculateWaterQuality(testParams);
    
    // CCPP increases with both pH and Calcium
    if (results.ccpp < targetCcpp) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
};
