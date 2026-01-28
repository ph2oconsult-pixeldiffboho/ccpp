
import { WaterParameters, CalculationResults } from '../types';

/**
 * Thermodynamic Constants (Plummer & Busenberg, 1982)
 * All calculations use absolute temperature (Kelvin)
 */
const getConstants = (tempC: number, tds: number) => {
  const TK = tempC + 273.15;
  const IS = 2.5e-5 * tds; // Ionic Strength approximation
  const sqrtI = Math.sqrt(IS);
  
  // Davies Activity Coefficients
  const A_DH = 0.4918 + 0.0006614 * tempC + 0.000004975 * Math.pow(tempC, 2);
  const davies = (sqrtI / (1 + sqrtI)) - 0.3 * IS;
  
  const g1 = Math.pow(10, -A_DH * 1 * davies); // Monovalent (H+, HCO3-, OH-)
  const g2 = Math.pow(10, -A_DH * 4 * davies); // Divalent (Ca++, CO3--)

  // Equilibrium Constants (pK = -log10 K)
  const pK1 = 3404.71 / TK + 14.8435 - 0.032786 * TK;
  const pK2 = 2902.39 / TK + 6.4980 - 0.02379 * TK;
  const pKw = 4470.99 / TK - 6.0875 + 0.01706 * TK;
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
 * Calculates carbonate system alpha fractions corrected for activities
 */
const getAlphas = (aH: number, c: any) => {
  // Activity of species: a_i = [i] * g_i
  // K1 = aH * [HCO3] * g1 / [H2CO3]  => [HCO3] = [H2CO3] * K1 / (aH * g1)
  // K2 = aH * [CO3] * g2 / ([HCO3] * g1) => [CO3] = [HCO3] * K2 * g1 / (aH * g2) = [H2CO3] * K1 * K2 / (aH^2 * g2)
  
  const term1 = c.K1 / (aH * c.g1);
  const term2 = (c.K1 * c.K2) / (Math.pow(aH, 2) * c.g2);
  
  const alpha0 = 1 / (1 + term1 + term2);
  const alpha1 = term1 * alpha0;
  const alpha2 = term2 * alpha0;
  
  return { alpha0, alpha1, alpha2 };
};

/**
 * Solves for equilibrium pH given Total Carbon (CT) and Alkalinity (Alk)
 */
const solvePh = (alk_eq: number, ct_mol: number, c: any): number => {
  let lowPh = 4;
  let highPh = 12;
  
  for (let i = 0; i < 35; i++) {
    const ph = (lowPh + highPh) / 2;
    const aH = Math.pow(10, -ph);
    const { alpha1, alpha2 } = getAlphas(aH, c);
    
    // Alk (eq/L) = [HCO3-] + 2[CO3--] + [OH-] - [H+]
    const calcAlk = ct_mol * (alpha1 + 2 * alpha2) + (c.Kw / (aH * c.g1)) - (aH / c.g1);
    
    if (calcAlk < alk_eq) lowPh = ph;
    else highPh = ph;
  }
  return (lowPh + highPh) / 2;
};

export const calculateWaterQuality = (params: WaterParameters): CalculationResults => {
  const { pH, temp, tds, calcium, alkalinity } = params;
  const c = getConstants(temp, tds);
  
  // Convert inputs to molar/equivalent units (Standard MW: 100,080 mg/mol)
  const ca_m = calcium / 100080;
  const alk_eq = alkalinity / 50040;
  const aH_init = Math.pow(10, -pH);

  // 1. Initial Total Carbon (CT)
  const alphas_init = getAlphas(aH_init, c);
  const ct_init = (alk_eq - (c.Kw / (aH_init * c.g1)) + (aH_init / c.g1)) / (alphas_init.alpha1 + 2 * alphas_init.alpha2);

  // 2. Initial LSI Calculation
  const co3_init = ct_init * alphas_init.alpha2;
  const iap_init = (ca_m * c.g2) * (co3_init * c.g2);
  const lsi = Math.log10(iap_init / c.Ks);

  // 3. Find pHs (pH where IAP = Ks for current Ca and Alk)
  let lowPs = 6;
  let highPs = 12;
  for (let i = 0; i < 35; i++) {
    const testPh = (lowPs + highPs) / 2;
    const aH = Math.pow(10, -testPh);
    const alphas = getAlphas(aH, c);
    const ct_test = (alk_eq - (c.Kw / (aH * c.g1)) + (aH / c.g1)) / (alphas.alpha1 + 2 * alphas.alpha2);
    const co3 = ct_test * alphas.alpha2;
    const si = Math.log10((ca_m * c.g2 * co3 * c.g2) / c.Ks);
    if (si < 0) lowPs = testPh; else highPs = testPh;
  }
  const phS = (lowPs + highPs) / 2;

  // 4. CCPP Solver
  // x = moles of CaCO3 precipitated (negative if dissolved)
  let lowX = -0.01; 
  let highX = 0.01;
  
  for (let i = 0; i < 45; i++) {
    const x = (lowX + highX) / 2;
    const ca_x = ca_m - x;
    const alk_x = alk_eq - 2 * x;
    const ct_x = ct_init - x;
    
    if (ca_x <= 0 || alk_x <= 0 || ct_x <= 0) {
      if (x > 0) highX = x; else lowX = x;
      continue;
    }
    
    const ph_x = solvePh(alk_x, ct_x, c);
    const aH_x = Math.pow(10, -ph_x);
    const alphas_x = getAlphas(aH_x, c);
    const co3_x = ct_x * alphas_x.alpha2;
    
    const si_x = Math.log10((ca_x * c.g2 * co3_x * c.g2) / c.Ks);
    
    if (si_x > 0) lowX = x;
    else highX = x;
  }
  
  const finalX = (lowX + highX) / 2;
  const ccpp_mg = finalX * 100080;

  // Equilibrium state calculation
  const eq_alk_mg = Math.max(0, (alk_eq - 2 * finalX) * 50040);
  const eq_ca_mg = Math.max(0, (ca_m - finalX) * 100080);
  const eq_ph = solvePh(eq_alk_mg / 50040, ct_init - finalX, c);

  return {
    lsi,
    ccpp: ccpp_mg,
    phS,
    saturationCondition: lsi > 0.05 ? 'Oversaturated' : lsi < -0.05 ? 'Undersaturated' : 'Saturated',
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
    
    if (results.ccpp < targetCcpp) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
};
