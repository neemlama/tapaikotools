/**
 * Nepal salary income-tax engine (FY-locked, config-driven).
 *
 * Why config-driven: IRD slabs change in the annual Finance Act. The math
 * never changes (progressive bands), only the numbers do. A new FY = a new
 * entry in NEPAL_TAX_CONFIGS + new tests, no logic edits.
 *
 * Scope: FY 2082/83 only (Finance Act 2082, unchanged from 2081/82).
 * FY 2083/84 uses a different uniform slab and is NOT included until the
 * Act text is verified — see tool UI banner (fail closed, never guess).
 *
 * Sources: Finance Act 2082 First Schedule, IRD slab summaries
 * (single 5L/7L/10L/20L/50L, couple 6L/8L/11L/20L/50L at 1/10/20/30/36/39).
 * This file is an estimate aid, not tax advice — see /disclaimer.
 */

export type NepalFilingStatus = "single" | "couple";
export type NepalFY = "2082-83";

export interface NepalTaxBand {
  /** Inclusive upper bound of taxable income in NPR, null = no cap (top band). */
  upTo: number | null;
  rate: number; // percent, e.g. 10 = 10%
  label: string;
}

export interface NepalTaxConfig {
  fy: NepalFY;
  label: string;
  source: string;
  verifiedOn: string;
  singleBands: NepalTaxBand[];
  coupleBands: NepalTaxBand[];
  /** First band is 1% Social Security Tax, waived in full for SSF contributors. */
  sstWaivedForSsf: boolean;
  retirementCapAbsolute: number;
  retirementCapFraction: number; // 1/3 of assessable
  lifeCap: number;
  healthCap: number;
  femaleRebatePercent: number; // 10, sole filer + employment income only
}

export const NEPAL_TAX_2082_83: NepalTaxConfig = {
  fy: "2082-83",
  label: "FY 2082/83 (Shrawan 2082 – Ashad 2083)",
  source: "Finance Act 2082, First Schedule",
  verifiedOn: "2026-05-20",
  singleBands: [
    { upTo: 500_000, rate: 1, label: "up to 5L" },
    { upTo: 700_000, rate: 10, label: "5L–7L" },
    { upTo: 1_000_000, rate: 20, label: "7L–10L" },
    { upTo: 2_000_000, rate: 30, label: "10L–20L" },
    { upTo: 5_000_000, rate: 36, label: "20L–50L" },
    { upTo: null, rate: 39, label: "above 50L" },
  ],
  coupleBands: [
    { upTo: 600_000, rate: 1, label: "up to 6L" },
    { upTo: 800_000, rate: 10, label: "6L–8L" },
    { upTo: 1_100_000, rate: 20, label: "8L–11L" },
    { upTo: 2_000_000, rate: 30, label: "11L–20L" },
    { upTo: 5_000_000, rate: 36, label: "20L–50L" },
    { upTo: null, rate: 39, label: "above 50L" },
  ],
  sstWaivedForSsf: true,
  retirementCapAbsolute: 500_000,
  retirementCapFraction: 1 / 3,
  lifeCap: 40_000,
  healthCap: 20_000,
  femaleRebatePercent: 10,
};

export const NEPAL_TAX_CONFIGS: Record<NepalFY, NepalTaxConfig> = {
  "2082-83": NEPAL_TAX_2082_83,
};

export interface NepalTaxInput {
  annualGross: number;
  filingStatus: NepalFilingStatus;
  isSsf: boolean;
  retirementContrib: number;
  lifePremium: number;
  healthPremium: number;
  isFemaleSole: boolean;
}

export interface NepalBandBreakdown {
  label: string;
  rate: number;
  taxableInBand: number;
  tax: number;
}

export interface NepalTaxResult {
  fy: NepalFY;
  taxableIncome: number;
  retirementDeductible: number;
  lifeDeductible: number;
  healthDeductible: number;
  bands: NepalBandBreakdown[];
  annualTaxBeforeRebate: number;
  rebate: number;
  annualTax: number;
  monthlyTds: number;
}

export function calculateNepalSalaryTax(input: NepalTaxInput, fy: NepalFY = "2082-83"): NepalTaxResult {
  const config = NEPAL_TAX_CONFIGS[fy];
  if (!config) throw new Error(`No verified config for FY ${fy} (fail closed — add config + tests first)`);

  const gross = Math.max(0, input.annualGross || 0);
  const retirementDeductible = Math.min(
    Math.max(0, input.retirementContrib || 0),
    config.retirementCapAbsolute,
    Math.floor(gross * config.retirementCapFraction),
  );
  const lifeDeductible = Math.min(Math.max(0, input.lifePremium || 0), config.lifeCap);
  const healthDeductible = Math.min(Math.max(0, input.healthPremium || 0), config.healthCap);
  const taxableIncome = Math.max(0, gross - retirementDeductible - lifeDeductible - healthDeductible);

  const bands = input.filingStatus === "single" ? config.singleBands : config.coupleBands;
  const breakdown: NepalBandBreakdown[] = [];
  let prevCap = 0;
  let annualTaxBeforeRebate = 0;

  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    if (taxableIncome <= prevCap) break;
    const cap = band.upTo ?? Number.POSITIVE_INFINITY;
    const taxableInBand = Math.max(0, Math.min(taxableIncome, cap) - prevCap);
    const isFirstBand = i === 0;
    const effectiveRate = isFirstBand && input.isSsf && config.sstWaivedForSsf ? 0 : band.rate;
    const tax = (taxableInBand * effectiveRate) / 100;
    annualTaxBeforeRebate += tax;
    breakdown.push({ label: band.label, rate: effectiveRate, taxableInBand, tax });
    prevCap = cap;
  }

  const rebate =
    input.isFemaleSole && input.filingStatus === "single"
      ? (annualTaxBeforeRebate * config.femaleRebatePercent) / 100
      : 0;
  const annualTax = Math.max(0, annualTaxBeforeRebate - rebate);

  return {
    fy,
    taxableIncome,
    retirementDeductible,
    lifeDeductible,
    healthDeductible,
    bands: breakdown,
    annualTaxBeforeRebate,
    rebate,
    annualTax,
    monthlyTds: annualTax / 12,
  };
}
