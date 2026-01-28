
import { WaterParameters, CalculationResults } from '../types';

/**
 * Thermodynamic Constants using standard temperature-dependent equations
 */
const getConstants = (tempC: number, tds: number) => {
  const TK = tempC + 273.15;
  const IS = 2.5e-5 * tds; // Ionic Strength approximation
  const sqrtIS = Math.sqrt(IS);
  
  // Debye-Huckel A parameter (approximate temperature dependence)
  const A_DH = 0.4918 + 0.0006614 * tempC + 0.000004975 * Math.pow(tempC, 2);
  
  // Activity coefficients (Davies Equation for monovalent and divalent)
  const logGamma1 = -A_DH * (sqrtIS / (1 + sqrtIS) - 0.3 * IS);
  const logGamma2 = 4 * logGamma1;
  
  const g1 = Math.pow(10, logGamma1);
  const g2 = Math.pow(10, logGamma2);

  // Equilibrium constants (pK values)
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
    g2,
    IS
  };
};

/**
 * Solves for pH given Alkalinity and Total Inorganic Carbon (CT)
 * Uses Newton-Raphson to find [H+] such that:
 * Alk = CT * (alpha1 + 2*alpha2) + [OH-] - [H+]
 */
const solvePhFromAlkAndCt = (alk_mol: number, ct_mol: number, constants: any): number => {
  const { K1, K2, Kw, g1, g2 } = constants;
  let h = Math.pow(10, -8); // Initial guess pH 8
  
  for (let i = 0; i < 20; i++) {
    const d = (h * h / (g1 * g1)) + (K1 * h / (g1 * g2)) + (K1 * K2 / (g2 * g2));
    const alpha1 = (K1 * h / (g1 * g2)) / d;
    const alpha2 = (K1 * K2 / (g2 * g2)) / d;
    
    // Function: Alk_calc - Alk_target = 0
    const f = ct_mol * (alpha1 + 2 * alpha2) + (Kw / (h * g1 * g1)) - (h / g1) - alk_mol;
    
    // Derivative approximation (numerical)
    const step = h * 0.001;
    const h_next = h + step;
    const d_next = (h_next * h_next / (g1 * g1)) + (K1 * h_next / (g1 * g2)) + (K1 * K2 / (g2 * g2));
    const a1_next = (K1 * h_next / (g1 * g2)) / d_next;
    const a2_next = (K1 * K2 / (g2 * g2)) / d_next;
    const f_next = ct_mol * (a1_next + 2 * a2_next) + (Kw / (h_next * g1 * g1)) - (h_next / g1) - alk_mol;
    
    const df = (f_next - f) / step;
    h = h - f / df;
    
    if (Math.abs(f) < 1e-10) break;
  }
  
  return -Math.log10(h);
};

export const calculateWaterQuality = (params: WaterParameters): CalculationResults => {
  const { pH, temp, tds, calcium, alkalinity } = params;
  const c = getConstants(temp, tds);
  
  // Convert mg/L as CaCO3 to molarity
  // Calcium: 100.08 g/mol. Alkalinity: 50.04 g/eq (but as CaCO3, it's 2 equivalents per 100g)
  const ca_mol = calcium / 100080;
  const alk_mol = alkalinity / 50044; // alkalinity in eq/L
  const h = Math.pow(10, -pH);

  // Initial CT calculation
  const d = (h * h / (c.g1 * c.g1)) + (c.K1 * h / (c.g1 * c.g2)) + (c.K1 * c.K2 / (c.g2 * c.g2));
  const alpha1 = (c.K1 * h / (c.g1 * c.g2)) / d;
  const alpha2 = (c.K1 * c.K2 / (c.g2 * c.g2)) / d;
  const ct_init = (alk_mol - (c.Kw / (h * c.g1 * c.g1)) + (h / c.g1)) / (alpha1 + 2 * alpha2);

  // LSI Calculation (pH - pHs)
  // pHs is pH at which solution is in equilibrium with CaCO3
  // [Ca][CO3]*g2*g2 = Ks  => [CO3] = Ks / ([Ca]*g2*g2)
  // [CO3] = CT * alpha2
  // Simplified pHs for output: pHs = pK2 - pKs + pCa + pAlk (with corrections)
  const pCa = -Math.log10(ca_mol * c.g2);
  const pAlk = -Math.log10(alk_mol * c.g1); // Simplified for reporting
  const phS = (Math.log10(c.K2) - Math.log10(c.Ks)) + pCa + pAlk; // Rough estimate for display
  const lsi = pH - phS;

  // CCPP Solver (Bisection)
  // We want to find x (moles of CaCO3) such that Saturation Index = 0
  let low = -0.01; // Dissolving 1000 mg/L
  let high = 0.01; // Precipitating 1000 mg/L
  let ccpp_mol = 0;

  for (let i = 0; i < 40; i++) {
    const x = (low + high) / 2;
    const ca_x = ca_mol - x;
    const alk_x = alk_mol - 2 * x;
    const ct_x = ct_init - x;

    if (ca_x <= 0 || alk_x <= 0 || ct_x <= 0) {
      if (x > 0) high = x; else low = x;
      continue;
    }

    const ph_x = solvePhFromAlkAndCt(alk_x, ct_x, c);
    const h_x = Math.pow(10, -ph_x);
    const d_x = (h_x * h_x / (c.g1 * c.g1)) + (c.K1 * h_x / (c.g1 * c.g2)) + (c.K1 * c.K2 / (c.g2 * c.g2));
    const a2_x = (c.K1 * c.K2 / (c.g2 * c.g2)) / d_x;
    const co3_x = ct_x * a2_x;

    // Ion Activity Product / Solubility Product
    const iap = ca_x * c.g2 * co3_x * c.g2;
    const si = Math.log10(iap / c.Ks);

    if (si > 0) low = x;
    else high = x;

    if (Math.abs(high - low) < 1e-9) {
      ccpp_mol = x;
      break;
    }
  }

  const ccpp_mg = ccpp_mol * 100080;
  const eq_alk = (alk_mol - 2 * ccpp_mol) * 50044;
  const eq_ca = (ca_mol - ccpp_mol) * 100080;
  const eq_ph = solvePhFromAlkAndCt(alk_mol - 2 * ccpp_mol, ct_init - ccpp_mol, c);

  return {
    lsi,
    ccpp: ccpp_mg,
    phS,
    saturationCondition: lsi > 0.2 ? 'Oversaturated' : lsi < -0.2 ? 'Undersaturated' : 'Saturated',
    equilibriumPh: eq_ph,
    equilibriumAlk: Math.max(0, eq_alk),
    equilibriumCa: Math.max(0, eq_ca)
  };
};

export const solveForTarget = (
  params: WaterParameters, 
  targetCcpp: number, 
  mode: 'pH' | 'calcium'
): number | null => {
  let low = mode === 'pH' ? 6 : 5;
  let high = mode === 'pH' ? 10 : 1000;
  
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    const testParams = { ...params, [mode === 'pH' ? 'pH' : 'calcium']: mid };
    const results = calculateWaterQuality(testParams);
    
    // CCPP increases with pH and Calcium
    if (results.ccpp < targetCcpp) low = mid;
    else high = mid;
    
    if (Math.abs(results.ccpp - targetCcpp) < 0.01) return mid;
  }
  return null;
};
