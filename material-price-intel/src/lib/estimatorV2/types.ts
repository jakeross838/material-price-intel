// ===========================================
// Estimator V2 Types
// Tesla/Porsche configurator-style estimator
// ===========================================

// -------------------------------------------
// Finish tiers (4 levels)
// -------------------------------------------

export type FinishTier = 'builder' | 'standard' | 'premium' | 'luxury';

export const FINISH_TIER_LABELS: Record<FinishTier, string> = {
  builder: 'Builder Grade',
  standard: 'Standard',
  premium: 'Premium',
  luxury: 'Luxury',
};

export const FINISH_TIER_ORDER: FinishTier[] = ['builder', 'standard', 'premium', 'luxury'];

// -------------------------------------------
// Step 1: Home Basics
// -------------------------------------------

export type Stories = 1 | 2 | 3;
export type GarageSpaces = 0 | 1 | 2 | 3;
export type CeilingHeight = 9 | 10 | 12;
export type SewerType = 'city' | 'septic';
export type WaterSource = 'city' | 'well';

// -------------------------------------------
// Step 2: Style & Exterior
// -------------------------------------------

export type ArchStyle =
  | 'coastal'
  | 'mediterranean'
  | 'modern'
  | 'craftsman'
  | 'colonial'
  | 'farmhouse'
  | 'tropical';

export const ARCH_STYLE_META: Record<ArchStyle, { label: string; description: string; popular?: boolean }> = {
  coastal: { label: 'Coastal Contemporary', description: 'Clean lines, open floor plans, hurricane-ready', popular: true },
  mediterranean: { label: 'Mediterranean', description: 'Stucco, tile roof, arched openings', popular: true },
  modern: { label: 'Modern', description: 'Flat roofs, floor-to-ceiling glass, minimalist' },
  craftsman: { label: 'Craftsman', description: 'Natural materials, covered porches, exposed beams' },
  colonial: { label: 'Colonial', description: 'Symmetrical, formal, classic proportions' },
  farmhouse: { label: 'Modern Farmhouse', description: 'Board and batten, metal roof, warm mix' },
  tropical: { label: 'Tropical Island', description: 'Elevated, wide verandas, lush integration' },
};

export type CladdingType =
  | 'vinyl'
  | 'fiber_cement'
  | 'stucco'
  | 'stucco_stone'
  | 'natural_stone'
  | 'cedar_stone';

export const CLADDING_META: Record<CladdingType, { label: string; tier: FinishTier; popular?: boolean }> = {
  vinyl: { label: 'Vinyl Siding', tier: 'builder' },
  fiber_cement: { label: 'Fiber Cement (Hardie)', tier: 'standard', popular: true },
  stucco: { label: 'Stucco', tier: 'standard' },
  stucco_stone: { label: 'Stucco + Accent Stone', tier: 'premium', popular: true },
  natural_stone: { label: 'Natural Stone Veneer', tier: 'luxury' },
  cedar_stone: { label: 'Cedar + Natural Stone', tier: 'luxury' },
};

export type RoofType =
  | 'shingle_arch'
  | 'shingle_premium'
  | 'metal_standing'
  | 'concrete_tile'
  | 'clay_tile';

export const ROOF_META: Record<RoofType, { label: string; tier: FinishTier; popular?: boolean }> = {
  shingle_arch: { label: 'Architectural Shingles', tier: 'builder' },
  shingle_premium: { label: 'Premium Dimensional', tier: 'standard' },
  metal_standing: { label: 'Standing Seam Metal', tier: 'premium', popular: true },
  concrete_tile: { label: 'Concrete Barrel Tile', tier: 'premium' },
  clay_tile: { label: 'Clay Tile', tier: 'luxury' },
};

export type WindowGrade = 'standard' | 'impact' | 'hurricane' | 'full_wall';

export const WINDOW_GRADE_META: Record<WindowGrade, { label: string; tier: FinishTier; popular?: boolean }> = {
  standard: { label: 'Standard Vinyl', tier: 'builder' },
  impact: { label: 'Impact-Rated', tier: 'standard', popular: true },
  hurricane: { label: 'Hurricane Aluminum-Clad', tier: 'premium' },
  full_wall: { label: 'Full-Wall Window Systems', tier: 'luxury' },
};

// -------------------------------------------
// Step 3: Interior
// -------------------------------------------

export type AppliancePackage = 'builder' | 'mid' | 'pro';

export const APPLIANCE_PACKAGE_META: Record<AppliancePackage, { label: string }> = {
  builder: { label: 'Builder Package' },
  mid: { label: 'Mid-Range' },
  pro: { label: 'Professional' },
};

export type FlooringType = 'lvp' | 'engineered' | 'solid_hardwood' | 'european_oak';

export const FLOORING_META: Record<FlooringType, { label: string; tier: FinishTier; popular?: boolean }> = {
  lvp: { label: 'Luxury Vinyl Plank', tier: 'builder' },
  engineered: { label: 'Engineered Hardwood', tier: 'standard', popular: true },
  solid_hardwood: { label: 'Solid Hardwood', tier: 'premium' },
  european_oak: { label: 'Wide-Plank European Oak', tier: 'luxury' },
};

export type CountertopMaterial = 'laminate' | 'granite' | 'quartz' | 'marble';

export const COUNTERTOP_META: Record<CountertopMaterial, { label: string; tier: FinishTier; popular?: boolean }> = {
  laminate: { label: 'Laminate', tier: 'builder' },
  granite: { label: 'Granite', tier: 'standard' },
  quartz: { label: 'Quartz', tier: 'premium', popular: true },
  marble: { label: 'Marble Slab', tier: 'luxury' },
};

// -------------------------------------------
// Step 4: Special Features
// -------------------------------------------

export type SolarOption = 'none' | 'partial' | 'full';
export type DrivewayType = 'concrete' | 'pavers' | 'shell';
export type LandscapingTier = 'sod' | 'basic' | 'full';
export type FenceType = 'none' | 'vinyl' | 'aluminum' | 'wood';

export const DRIVEWAY_META: Record<DrivewayType, { label: string }> = {
  shell: { label: 'Shell' },
  concrete: { label: 'Concrete' },
  pavers: { label: 'Pavers' },
};

export const LANDSCAPING_META: Record<LandscapingTier, { label: string }> = {
  sod: { label: 'Sod Only' },
  basic: { label: 'Basic' },
  full: { label: 'Full Design' },
};

export const FENCE_META: Record<FenceType, { label: string }> = {
  none: { label: 'None' },
  vinyl: { label: 'Vinyl' },
  aluminum: { label: 'Aluminum' },
  wood: { label: 'Wood Privacy' },
};

export type PoolType = 'none' | 'standard' | 'infinity';
export type ElevatorType = 'none' | '2stop' | '3stop';
export type FireplaceType = 'none' | 'linear' | 'custom';
export type SmartHomeLevel = 'none' | 'basic' | 'standard' | 'full';

// -------------------------------------------
// Full V2 input shape
// -------------------------------------------

export type EstimatorV2Input = {
  // Step 1: Home Basics
  sqft: number;
  stories: Stories;
  bedrooms: number;
  bathrooms: number;
  garageSpaces: GarageSpaces;
  lotSize: number;
  ceilingHeight: CeilingHeight;
  sewerType: SewerType;
  waterSource: WaterSource;
  floodZone: boolean;
  location: string;
  lotAddress: string;

  // Step 2: Style & Exterior
  archStyle: ArchStyle;
  claddingType: CladdingType;
  roofType: RoofType;
  windowGrade: WindowGrade;
  elevatedConstruction: boolean;

  // Step 3: Interior
  finishLevel: FinishTier;
  kitchenTier: FinishTier;
  flooringType: FlooringType;
  countertopMaterial: CountertopMaterial;
  bathroomTier: FinishTier;
  appliancePackage: AppliancePackage;

  // Step 4: Special Features
  pool: PoolType;
  elevator: ElevatorType;
  outdoorKitchen: boolean;
  fireplace: FireplaceType;
  smartHome: SmartHomeLevel;
  generator: boolean;
  seawall: boolean;
  deckSqft: number;
  screenedPorch: boolean;
  solarPanels: SolarOption;
  drivewayType: DrivewayType;
  landscapingTier: LandscapingTier;
  fenceType: FenceType;
  waterFiltration: boolean;
};

// -------------------------------------------
// Default input
// -------------------------------------------

export const DEFAULT_V2_INPUT: EstimatorV2Input = {
  sqft: 2500,
  stories: 1,
  bedrooms: 3,
  bathrooms: 2,
  garageSpaces: 2,
  lotSize: 0.25,
  ceilingHeight: 10,
  sewerType: 'city',
  waterSource: 'city',
  floodZone: false,
  location: 'bradenton',
  lotAddress: '',

  archStyle: 'coastal',
  claddingType: 'stucco',
  roofType: 'shingle_premium',
  windowGrade: 'impact',
  elevatedConstruction: false,

  finishLevel: 'standard',
  kitchenTier: 'standard',
  flooringType: 'engineered',
  countertopMaterial: 'granite',
  bathroomTier: 'standard',
  appliancePackage: 'mid',

  pool: 'none',
  elevator: 'none',
  outdoorKitchen: false,
  fireplace: 'none',
  smartHome: 'none',
  generator: false,
  seawall: false,
  deckSqft: 0,
  screenedPorch: false,
  solarPanels: 'none',
  drivewayType: 'concrete',
  landscapingTier: 'basic',
  fenceType: 'none',
  waterFiltration: false,
};

// -------------------------------------------
// CSI Divisions (for grouping line items)
// -------------------------------------------

export type CsiDivision =
  | 'sitework'
  | 'foundation'
  | 'framing'
  | 'exterior'
  | 'roofing'
  | 'doors_windows'
  | 'interior_finishes'
  | 'mechanical'
  | 'electrical'
  | 'specialties'
  | 'overhead';

export const CSI_DIVISION_LABELS: Record<CsiDivision, string> = {
  sitework: 'Site Work',
  foundation: 'Foundation',
  framing: 'Framing & Structure',
  exterior: 'Exterior Envelope',
  roofing: 'Roofing',
  doors_windows: 'Doors & Windows',
  interior_finishes: 'Interior Finishes',
  mechanical: 'Mechanical (Plumbing & HVAC)',
  electrical: 'Electrical & Lighting',
  specialties: 'Specialty Items',
  overhead: 'Permits, Fees & Insurance',
};

// -------------------------------------------
// Cost item definition (for cost database)
// -------------------------------------------

export type CostItemDef = {
  id: string;
  displayName: string;
  csiDivision: CsiDivision;
  unit: string;
  /** Cost per unit at each finish tier [low, high] */
  costPerUnit: Record<FinishTier, [number, number]>;
  /** Returns quantity based on inputs. If 0, item is skipped. */
  quantityFn: (input: EstimatorV2Input) => number;
  /** Tags for filtering and grouping */
  tags: string[];
};

// -------------------------------------------
// Calculated line item (output)
// -------------------------------------------

export type V2LineItem = {
  id: string;
  displayName: string;
  csiDivision: CsiDivision;
  quantity: number;
  unit: string;
  unitCostLow: number;
  unitCostHigh: number;
  totalLow: number;
  totalHigh: number;
  tags: string[];
};

// -------------------------------------------
// Full V2 estimate result
// -------------------------------------------

export type V2EstimateResult = {
  /** Base construction cost (before overhead) */
  baseLow: number;
  baseHigh: number;

  /** Builder fee (percentage-based) */
  builderFeeLow: number;
  builderFeeHigh: number;
  builderFeePercent: number;

  /** Sales tax */
  taxLow: number;
  taxHigh: number;
  taxRate: number;

  /** Permits & fees */
  permitLow: number;
  permitHigh: number;
  permitRate: number;

  /** Builder's risk insurance */
  insuranceLow: number;
  insuranceHigh: number;
  insuranceRate: number;

  /** Out-the-door total */
  totalLow: number;
  totalHigh: number;

  /** Per square foot */
  perSqftLow: number;
  perSqftHigh: number;

  /** Monthly payment estimate (30yr at assumed rate) */
  monthlyLow: number;
  monthlyHigh: number;

  /** Location multiplier applied */
  locationMultiplier: number;
  locationName: string;

  /** Line items by CSI division */
  lineItems: V2LineItem[];

  /** Grouped totals by division */
  divisionTotals: Record<CsiDivision, { low: number; high: number }>;

  /** Achievements earned */
  achievements: Achievement[];

  /** Schedule estimate */
  schedule: ScheduleResult;

  /** Input that produced this estimate */
  input: EstimatorV2Input;
};

// -------------------------------------------
// Achievement badges
// -------------------------------------------

export type AchievementId =
  | 'island_ready'
  | 'eco_warrior'
  | 'chefs_paradise'
  | 'resort_living'
  | 'smart_estate'
  | 'hurricane_proof'
  | 'entertainer'
  | 'sky_high';

export type Achievement = {
  id: AchievementId;
  label: string;
  description: string;
  icon: string; // emoji
};

// -------------------------------------------
// Schedule types
// -------------------------------------------

export type SchedulePhase = {
  id: string;
  name: string;
  durationWeeks: number;
  description: string;
};

export type ScheduleResult = {
  phases: SchedulePhase[];
  totalWeeks: number;
  totalMonths: number;
};

// -------------------------------------------
// Financing helper
// -------------------------------------------

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number = 0.0699,
  years: number = 30,
): number {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

/**
 * Format as compact currency: "$1.2M" or "$450K"
 */
export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

/**
 * Format as full currency: "$1,234,567"
 */
export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
