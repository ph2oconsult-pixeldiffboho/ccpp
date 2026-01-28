
import { WaterParameters, CalculationResults } from '../types';

/**
 * Rigorous Thermodynamic Constants (Plummer & Busenberg, 1982)
 * Temperature must be in Kelvin
 */
const getEquilibriumConstants = (tempC: number, tds: number) => {
  const TK = tempC + 273.15;
  const IS = 2.5e-5 * tds; // Simple Ionic Strength approximation
  const sqrtIS = Math.sqrt(IS);
  
  // Activity coefficients (Davies Equation)
  // log gamma = -A * z^2 * [ sqrt(I)/(1+sqrt(I)) - 0.3*I ]
  // A is approx 0.5 at 25C
  const A_DH = 0.4918 + 0.0006614 * tempC + 0.000004975 * Math.pow(tempC, 2);
  const davies = (sqrtIS / (1 + sqrtIS)) - 0.3 * IS;
  
  const logGamma1 = -A_DH * 1 * davies;
  const logGamma2 = -A_DH * 4 * davies;
  
  const g1 = Math.pow(10, logGamma1);
  const g2 = Math.pow(10, logGamma2);

  // Equilibrium Constants pK = -log10(K)
  const pK1 = 3404.71 / TK + 14.8435 - 0.032786 * TK;
  const pK2 = 2902.39 / TK + 6.4980 - 0.02379 * TK;
  const pKw = 4470.99 / TK - 6.0875 + 0.01706 * TK;
  // Calcite solubility
  const pKs = 171.9065 + 0.077993 * TK - 2839.319 / TK - 71.595 * Math.log10(TK);

  return {
    K1: Math.pow(10, -pK1),
    K2: Math.pow(10, -pK2),
    Kw: Math.pow(10, -pKw),
    Ks: Math.pow(10, -pKs),
    g1,
    g2
  };
};

/**
 * Finds the pH for a given Total Inorganic Carbon (CT) and Alkalinity (Alk)
 * Alk (eq/L) = [HCO3-] + 2[CO3--] + [OH-] - [H+]
 */
const solvePhAtEquilibrium = (alk_eq: number, ct_mol: number, c: any): number => {
  let lowPh = 4;
  let highPh = 12;
  
  for (let i = 0; i < 35; i++) {
    const ph = (lowPh + highPh) / 2;
    const h = Math.pow(10, -ph);
    
    // Activity corrected constants
    const K1_prime = c.K1 / (c.g1 * c.g1);
    const K2_prime = c.K2 / (c.g1 * c.g2 / c.g1); // K2' = [H][CO3]/[HCO3] = K2 * gamma_HCO3 / (gamma_H * gamma_CO3)
    // Actually simpler: Activity of H is 10^-pH. 
    // [H] = 10^-pH / g1
    // [OH] = Kw / (aH * g1) 
    
    const aH = h; 
    const den = (aH * aH) + (c.K1 * aH) + (c.K1 * c.K2);
    const alpha1 = (c.K1 * aH) / den;
    const alpha2 = (c.K1 * c.K2) / den;
    
    const calcAlk = ct_mol * (alpha1 + 2 * alpha2) + (c.Kw / (aH * c.g1)) - (aH / c.g1);
    
    if (calcAlk < alk_eq) lowPh = ph;
    else highPh = ph;
  }
  return (lowPh + highPh) / 2;
};

export const calculateWaterQuality = (params: WaterParameters): CalculationResults => {
  const { pH, temp, tds, calcium, alkalinity } = params;
  const c = getEquilibriumConstants(temp, tds);
  
  // Convert units to molar/equivalents
  // Calcium: 100,081 mg/mol CaCO3
  // Alkalinity: 50,045 mg/eq (as CaCO3)
  const ca_m = calcium / 100081;
  const alk_eq = alkalinity / 50045;
  const aH_init = Math.pow(10, -pH);

  // 1. Calculate Initial Total Inorganic Carbon (CT)
  const den_init = (aH_init * aH_init) + (c.K1 * aH_init) + (c.K1 * c.K2);
  const alpha1_init = (c.K1 * aH_init) / den_init;
  const alpha2_init = (c.K1 * c.K2) / den_init;
  const ct_init = (alk_eq - (c.Kw / (aH_init * c.g1)) + (aH_init / c.g1)) / (alpha1_init + 2 * alpha2_init);

  // 2. Initial LSI Calculation
  // SI = log10( IAP / Ks ) = log10( [Ca]*g2 * [CO3]*g2 / Ks )
  const co3_init = ct_init * alpha2_init;
  const iap_init = (ca_m * c.g2) * (co3_init * c.g2);
  const lsi = Math.log10(iap_init / c.Ks);

  // 3. Find pHs (pH where SI = 0 at current Ca and Alk)
  // This is for LSI reporting
  let lowPhs = 6;
  let highPhs = 11;
  for (let i = 0; i < 30; i++) {
    const testPh = (lowPhs + highPhs) / 2;
    const aH = Math.pow(10, -testPh);
    const den = (aH * aH) + (c.K1 * aH) + (c.K1 * c.K2);
    const a2 = (c.K1 * c.K2) / den;
    // Recalculate CT required for this pH and initial Alkalinity
    const ct_for_phs = (alk_eq - (c.Kw / (aH * c.g1)) + (aH / c.g1)) / (aH * c.K1 / den + 2 * a2);
    const co3 = ct_for_phs * a2;
    const si = Math.log10((ca_m * c.g2 * co3 * c.g2) / c.Ks);
    if (si < 0) lowPhs = testPh; else highPhs = testPh;
  }
  const phS = (lowPhs + highPhs) / 2;

  // 4. CCPP Solver (Bisection on x moles of CaCO3 precipitated)
  // Equilibrium defined as SI_equilibrium = 0
  let lowX = -0.005; // Max dissolution (~500 mg/L)
  let highX = 0.005; // Max precipitation (~500 mg/L)
  
  for (let i = 0; i < 40; i++) {
    const x = (lowX + highX) / 2;
    const ca_x = ca_m - x;
    const alk_x = alk_eq - 2 * x;
    const ct_x = ct_init - x;
    
    if (ca_x <= 0 || alk_x <= 0 || ct_x <= 0) {
      if (x > 0) highX = x; else lowX = x;
      continue;
    }
    
    // Find pH at this state
    const ph_x = solvePhAtEquilibrium(alk_x, ct_x, c);
    const aH_x = Math.pow(10, -ph_x);
    const den_x = (aH_x * aH_x) + (c.K1 * aH_x) + (c.K1 * c.K2);
    const co3_x = ct_x * (c.K1 * c.K2 / den_x);
    
    const si_x = Math.log10((ca_x * c.g2 * co3_x * c.g2) / c.Ks);
    
    if (si_x > 0) lowX = x;
    else highX = x;
  }
  
  const finalX = (lowX + highX) / 2;
  const ccpp_mg = finalX * 100081;

  // Final equilibrium values
  const eq_alk_mg = Math.max(0, (alk_eq - 2 * finalX) * 50045);
  const eq_ca_mg = Math.max(0, (ca_m - finalX) * 100081);
  const eq_ph = solvePhAtEquilibrium(eq_alk_mg / 50045, ct_init - finalX, c);

  return {
    lsi,
    ccpp: ccpp_mg,
    phS,
    saturationCondition: lsi > 0.1 ? 'Oversaturated' : lsi < -0.1 ? 'Undersaturated' : 'Saturated',
    equilibriumPh: eq_ph,
    equilibriumAlk: eq_alk_mg,
    equilibriumCa: eq_ca_mg
  };
};

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
  }
  return (low + high) / 2;
};
