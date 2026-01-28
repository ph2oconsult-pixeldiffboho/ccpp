
import { WaterParameters, CalculationResults } from '../types';

/**
 * Standard Thermodynamic Constants (Plummer & Busenberg, 1982)
 * These are the industry standard coefficients used in RTW4 and similar software.
 */
const getConstants = (tempC: number, tds: number) => {
  const TK = tempC + 273.15;
  const logTK = Math.log10(TK);
  const TK2 = TK * TK;
  
  const IS = 2.5e-5 * tds; // Standard Ionic Strength approximation from TDS
  const sqrtI = Math.sqrt(IS);
  
  // Davies Activity Coefficients
  // log gamma = -A * z^2 * [ sqrt(I)/(1+sqrt(I)) - 0.3*I ]
  const A_DH = 0.4918 + 0.0006614 * tempC + 0.000004975 * Math.pow(tempC, 2);
  const davies = (sqrtI / (1 + sqrtI)) - 0.3 * IS;
  
  const g1 = Math.pow(10, -A_DH * 1 * davies); // Monovalent (H+, HCO3-, OH-)
  const g2 = Math.pow(10, -A_DH * 4 * davies); // Divalent (Ca++, CO3--)

  // log K values (Thermodynamic Equilibrium)
  // K1: H2CO3 <-> H+ + HCO3-
  const logK1 = -356.3094 - 0.06091964 * TK + 21834.37 / TK + 126.8339 * logTK - 1684915 / TK2;
  // K2: HCO3- <-> H+ + CO3--
  const logK2 = -107.8871 - 0.03252849 * TK + 5151.79 / TK + 38.92561 * logTK - 563713.9 / TK2;
  // Ks: CaCO3 <-> Ca++ + CO3-- (Calcite solubility)
  const logKs = -171.9065 - 0.077993 * TK + 2839.319 / TK + 71.595 * logTK;
  // Kw: H2O <-> H+ + OH-
  const logKw = -4470.99 / TK + 6.0875 - 0.01706 * TK;

  return {
    K1: Math.pow(10, logK1),
    K2: Math.pow(10, logK2),
    Ks: Math.pow(10, logKs),
    Kw: Math.pow(10, logKw),
    g1,
    g2
  };
};

/**
 * Activity-corrected alpha fractions
 * K1 = {H}{HCO3}/{H2CO3} -> [HCO3] = K1 * [H2CO3] / (aH * g1)
 */
const getAlphas = (aH: number, c: any) => {
  const t1 = c.K1 / (aH * c.g1);
  const t2 = (c.K1 * c.K2) / (Math.pow(aH, 2) * c.g2);
  
  const a0 = 1 / (1 + t1 + t2);
  const a1 = t1 * a0;
  const a2 = t2 * a0;
  
  return { a0, a1, a2 };
};

/**
 * Iterative pH solver using charge balance / alkalinity definition
 */
const solvePh = (alk_eq: number, ct_mol: number, c: any): number => {
  let low = 4;
  let high = 13;
  for (let i = 0; i < 40; i++) {
    const ph = (low + high) / 2;
    const aH = Math.pow(10, -ph);
    const { a1, a2 } = getAlphas(aH, c);
    // Alk (eq/L) = [HCO3-] + 2[CO3--] + [OH-] - [H+]
    const calcAlk = ct_mol * (a1 + 2 * a2) + (c.Kw / (aH * c.g1)) - (aH / c.g1);
    if (calcAlk < alk_eq) low = ph; else high = ph;
  }
  return (low + high) / 2;
};

export const calculateWaterQuality = (params: WaterParameters): CalculationResults => {
  const { pH, temp, tds, calcium, alkalinity } = params;
  const c = getConstants(temp, tds);
  
  // Standard Constants
  const MW_Ca = 40.078;      // mg/mmol
  const MW_CaCO3 = 100.087;  // mg/mmol
  const EW_Alk = 50043.5;    // mg/eq as CaCO3
  
  // Conversion: Calcium input is typically mg/L as Ca (Standard RTW4)
  const ca_m = calcium / (MW_Ca * 1000); 
  const alk_eq = alkalinity / EW_Alk;
  const aH_init = Math.pow(10, -pH);

  // 1. Initial Total Inorganic Carbon (CT)
  const a_init = getAlphas(aH_init, c);
  const ct_init = (alk_eq - (c.Kw / (aH_init * c.g1)) + (aH_init / c.g1)) / (a_init.a1 + 2 * a_init.a2);

  // 2. Initial Saturation Index (SI) / LSI
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

  // 4. CCPP Solver (x = moles of CaCO3 precipitated per Liter)
  let lowX = -0.01; 
  let highX = 0.01;
  
  for (let i = 0; i < 50; i++) {
    const x = (lowX + highX) / 2;
    const ca_x = Math.max(1e-10, ca_m - x);
    const alk_x = Math.max(1e-10, alk_eq - 2 * x);
    const ct_x = Math.max(1e-10, ct_init - x);
    
    const ph_x = solvePh(alk_x, ct_x, c);
    const aH_x = Math.pow(10, -ph_x);
    const a_x = getAlphas(aH_x, c);
    const si_x = Math.log10((ca_x * c.g2 * (ct_x * a_x.a2) * c.g2) / c.Ks);
    
    if (si_x > 0) lowX = x;
    else highX = x;
  }
  
  const finalX = (lowX + highX) / 2;
  const ccpp = finalX * MW_CaCO3 * 1000;

  return {
    lsi,
    ccpp,
    phS,
    saturationCondition: lsi > 0.1 ? 'Oversaturated' : lsi < -0.1 ? 'Undersaturated' : 'Saturated',
    equilibriumPh: solvePh(alk_eq - 2 * finalX, ct_init - finalX, c),
    equilibriumAlk: Math.max(0, (alk_eq - 2 * finalX) * EW_Alk),
    equilibriumCa: Math.max(0, (ca_m - finalX) * MW_Ca * 1000)
  };
};

export const solveForTarget = (
  params: WaterParameters, 
  targetCcpp: number, 
  mode: 'pH' | 'calcium'
): number | null => {
  let low = mode === 'pH' ? 6 : 0;
  let high = mode === 'pH' ? 10 : 500;
  
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const testParams = { ...params, [mode === 'pH' ? 'pH' : 'calcium']: mid };
    const results = calculateWaterQuality(testParams);
    
    if (results.ccpp < targetCcpp) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
};
