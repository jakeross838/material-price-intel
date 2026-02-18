// ===========================================
// V2 Estimate Calculator
// Iterates cost database, applies quantities, finish levels,
// location multiplier, builder fee → full breakdown
// ===========================================

import type {
  EstimatorV2Input,
  V2EstimateResult,
  V2LineItem,
  CsiDivision,
  FinishTier,
} from './types';
import { CSI_DIVISION_LABELS, calculateMonthlyPayment } from './types';
import { COST_DATABASE } from './costDatabase';
import { getLocationMultiplier, getLocationLabel } from './locations';
import { evaluateAchievements } from './achievementEngine';
import { calculateSchedule } from './scheduleEngine';

// -------------------------------------------
// Overhead rates
// -------------------------------------------

const TAX_RATE = 0.07; // FL sales tax on materials (~50% of cost is materials)
const MATERIAL_RATIO = 0.50; // approximate material vs labor split
const PERMIT_RATE = 0.015;
const INSURANCE_RATE = 0.025;

/** Builder fee scales with finish level */
const BUILDER_FEE: Record<FinishTier, number> = {
  builder: 0.15,
  standard: 0.18,
  premium: 0.20,
  luxury: 0.22,
};

// -------------------------------------------
// Finish tier resolution
// -------------------------------------------

/**
 * Determine the effective finish tier for a cost item.
 * Most items use the global finishLevel. Some items have
 * tier overrides (e.g., cladding, roofing, windows have their
 * own tier implied by selection type).
 */
function resolveFinishTier(
  itemId: string,
  input: EstimatorV2Input,
): FinishTier {
  // Items whose finish tier is driven by specific selections
  switch (itemId) {
    case 'kitchen_countertops':
    case 'kitchen_cabinets':
    case 'kitchen_appliances':
      return input.kitchenTier;

    case 'bath_countertops':
    case 'bath_vanities':
    case 'plumbing_fixtures':
      return input.bathroomTier;

    default:
      return input.finishLevel;
  }
}

// -------------------------------------------
// Main calculator
// -------------------------------------------

export function calculateV2Estimate(input: EstimatorV2Input): V2EstimateResult {
  const locationMultiplier = getLocationMultiplier(input.location);
  const locationName = getLocationLabel(input.location);
  const builderFeePercent = BUILDER_FEE[input.finishLevel];

  // Calculate line items
  const lineItems: V2LineItem[] = [];

  for (const item of COST_DATABASE) {
    const quantity = item.quantityFn(input);
    if (quantity <= 0) continue;

    const tier = resolveFinishTier(item.id, input);
    const [unitLow, unitHigh] = item.costPerUnit[tier];

    // Apply location multiplier to unit costs
    const adjUnitLow = unitLow * locationMultiplier;
    const adjUnitHigh = unitHigh * locationMultiplier;

    const totalLow = Math.round(quantity * adjUnitLow);
    const totalHigh = Math.round(quantity * adjUnitHigh);

    lineItems.push({
      id: item.id,
      displayName: item.displayName,
      csiDivision: item.csiDivision,
      quantity: Math.round(quantity),
      unit: item.unit,
      unitCostLow: Math.round(adjUnitLow * 100) / 100,
      unitCostHigh: Math.round(adjUnitHigh * 100) / 100,
      totalLow,
      totalHigh,
      tags: item.tags,
    });
  }

  // Sum base construction cost
  const baseLow = lineItems.reduce((sum, li) => sum + li.totalLow, 0);
  const baseHigh = lineItems.reduce((sum, li) => sum + li.totalHigh, 0);

  // Builder fee
  const builderFeeLow = Math.round(baseLow * builderFeePercent);
  const builderFeeHigh = Math.round(baseHigh * builderFeePercent);

  // Tax (on material portion only)
  const taxLow = Math.round(baseLow * MATERIAL_RATIO * TAX_RATE);
  const taxHigh = Math.round(baseHigh * MATERIAL_RATIO * TAX_RATE);

  // Permits
  const permitLow = Math.round(baseLow * PERMIT_RATE);
  const permitHigh = Math.round(baseHigh * PERMIT_RATE);

  // Insurance
  const insuranceLow = Math.round(baseLow * INSURANCE_RATE);
  const insuranceHigh = Math.round(baseHigh * INSURANCE_RATE);

  // Out-the-door total
  const totalLow = baseLow + builderFeeLow + taxLow + permitLow + insuranceLow;
  const totalHigh = baseHigh + builderFeeHigh + taxHigh + permitHigh + insuranceHigh;

  // Per sqft
  const perSqftLow = Math.round(totalLow / input.sqft);
  const perSqftHigh = Math.round(totalHigh / input.sqft);

  // Monthly payment (midpoint)
  const monthlyLow = Math.round(calculateMonthlyPayment(totalLow));
  const monthlyHigh = Math.round(calculateMonthlyPayment(totalHigh));

  // Division totals
  const divisionTotals = {} as Record<CsiDivision, { low: number; high: number }>;
  for (const key of Object.keys(CSI_DIVISION_LABELS) as CsiDivision[]) {
    divisionTotals[key] = { low: 0, high: 0 };
  }
  for (const li of lineItems) {
    divisionTotals[li.csiDivision].low += li.totalLow;
    divisionTotals[li.csiDivision].high += li.totalHigh;
  }

  // Achievements
  const achievements = evaluateAchievements(input);

  // Schedule
  const schedule = calculateSchedule(input);

  return {
    baseLow,
    baseHigh,
    builderFeeLow,
    builderFeeHigh,
    builderFeePercent,
    taxLow,
    taxHigh,
    taxRate: TAX_RATE,
    permitLow,
    permitHigh,
    permitRate: PERMIT_RATE,
    insuranceLow,
    insuranceHigh,
    insuranceRate: INSURANCE_RATE,
    totalLow,
    totalHigh,
    perSqftLow,
    perSqftHigh,
    monthlyLow,
    monthlyHigh,
    locationMultiplier,
    locationName,
    lineItems,
    divisionTotals,
    achievements,
    schedule,
    input,
  };
}

/**
 * Calculate the monthly payment impact of adding a dollar amount to the estimate.
 */
export function monthlyImpact(additionalCost: number): number {
  return Math.round(calculateMonthlyPayment(additionalCost));
}
