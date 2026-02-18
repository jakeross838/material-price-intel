// ===========================================
// V2 Cost Database — 55+ cost items from real bid data
// Bradenton/Sarasota FL market, 2024-2025 pricing
//
// Reference calibration point:
//   $5.26M / 3,747 SF = $1,405/SF ultra-luxury waterfront
//   $1.2M  / 2,400 SF = $500/SF standard spec
//
// Each item defines per-unit cost at 4 finish tiers
// and a quantity function deriving units from input.
// ===========================================

import type { CostItemDef, EstimatorV2Input } from './types';

// -------------------------------------------
// Helper: derived quantities
// -------------------------------------------

/** Footprint = total sqft / stories */
function footprint(i: EstimatorV2Input): number {
  return Math.round(i.sqft / i.stories);
}

/** Roof area = footprint * pitch factor (~1.15 for standard pitch) */
function roofArea(i: EstimatorV2Input): number {
  return Math.round(footprint(i) * 1.15);
}

/** Approximate perimeter in linear feet (assumes ~square footprint) */
function perimeter(i: EstimatorV2Input): number {
  const side = Math.sqrt(footprint(i));
  return Math.round(side * 4);
}

/** Exterior wall area = perimeter * story height * stories */
function wallArea(i: EstimatorV2Input): number {
  const storyHeight = i.stories >= 2 ? 9.5 : 10;
  return Math.round(perimeter(i) * storyHeight * i.stories);
}

/** Number of interior doors (~rooms * 1.5 + closets) */
function interiorDoorCount(i: EstimatorV2Input): number {
  const rooms = i.bedrooms + i.bathrooms + 3; // +kitchen, great room, dining
  const closets = i.bedrooms + 2; // each bedroom + linen + coat
  return rooms + closets;
}

/** Number of plumbing fixtures (toilets, sinks, tub/showers) */
function plumbingFixtureCount(i: EstimatorV2Input): number {
  // Each bathroom: toilet + sink + shower/tub = 3
  // Kitchen: sink + dishwasher = 2
  // Laundry: washer hookup = 1
  return i.bathrooms * 3 + 3;
}

/** Kitchen counter linear feet (scales with home size) */
function kitchenCounterLF(i: EstimatorV2Input): number {
  const base = 20;
  if (i.sqft > 3500) return base + 15;
  if (i.sqft > 2500) return base + 8;
  return base;
}

/** Total bath counter linear feet */
function bathCounterLF(i: EstimatorV2Input): number {
  // Master: 8 LF double vanity, guests: 4 LF each
  return 8 + (i.bathrooms - 1) * 4;
}

/** Garage sqft */
function garageSqft(i: EstimatorV2Input): number {
  return i.garageSpaces * 280; // ~280 SF per car
}

/** Window count (rough estimate) */
function windowCount(i: EstimatorV2Input): number {
  const base = Math.round(i.sqft / 150); // ~1 window per 150 SF
  return Math.max(base, 8);
}

// -------------------------------------------
// Cost Items — organized by CSI division
// -------------------------------------------

export const COST_DATABASE: CostItemDef[] = [
  // ==========================================
  // SITEWORK
  // ==========================================
  {
    id: 'site_prep',
    displayName: 'Site Preparation & Clearing',
    csiDivision: 'sitework',
    unit: 'sqft',
    costPerUnit: {
      builder:  [5, 7],
      standard: [8, 11],
      premium:  [12, 16],
      luxury:   [18, 24],
    },
    quantityFn: (i) => footprint(i) * 1.5, // lot area ~1.5x footprint
    tags: ['site'],
  },
  {
    id: 'driveway',
    displayName: 'Driveway & Walkways',
    csiDivision: 'sitework',
    unit: 'sqft',
    costPerUnit: {
      builder:  [6, 8],
      standard: [8, 12],
      premium:  [14, 20],
      luxury:   [22, 32],
    },
    quantityFn: (i) => 400 + i.garageSpaces * 150, // base driveway + per car
    tags: ['site', 'hardscape'],
  },
  {
    id: 'landscaping',
    displayName: 'Landscaping & Irrigation',
    csiDivision: 'sitework',
    unit: 'sqft',
    costPerUnit: {
      builder:  [4, 6],
      standard: [8, 12],
      premium:  [16, 24],
      luxury:   [28, 40],
    },
    quantityFn: (i) => footprint(i) * 2, // landscape area ~2x footprint
    tags: ['site', 'landscape'],
  },
  {
    id: 'outdoor_lighting',
    displayName: 'Outdoor & Landscape Lighting',
    csiDivision: 'sitework',
    unit: 'sqft',
    costPerUnit: {
      builder:  [0.50, 1],
      standard: [1, 2],
      premium:  [3, 5],
      luxury:   [6, 10],
    },
    quantityFn: (i) => footprint(i),
    tags: ['site', 'lighting'],
  },

  // ==========================================
  // FOUNDATION
  // ==========================================
  {
    id: 'foundation',
    displayName: 'Foundation',
    csiDivision: 'foundation',
    unit: 'sqft',
    costPerUnit: {
      builder:  [14, 18],
      standard: [22, 30],
      premium:  [35, 48],
      luxury:   [52, 72],
    },
    quantityFn: (i) => footprint(i),
    tags: ['structure'],
  },
  {
    id: 'elevated_foundation',
    displayName: 'Elevated Construction / Pilings',
    csiDivision: 'foundation',
    unit: 'sqft',
    costPerUnit: {
      builder:  [25, 35],
      standard: [35, 48],
      premium:  [48, 65],
      luxury:   [65, 85],
    },
    quantityFn: (i) => i.elevatedConstruction ? footprint(i) : 0,
    tags: ['structure', 'coastal'],
  },

  // ==========================================
  // FRAMING & STRUCTURE
  // ==========================================
  {
    id: 'framing',
    displayName: 'Structural Framing',
    csiDivision: 'framing',
    unit: 'sqft',
    costPerUnit: {
      builder:  [30, 38],
      standard: [48, 62],
      premium:  [68, 88],
      luxury:   [95, 125],
    },
    quantityFn: (i) => i.sqft,
    tags: ['structure'],
  },
  {
    id: 'roof_framing',
    displayName: 'Roof Framing & Trusses',
    csiDivision: 'framing',
    unit: 'sqft',
    costPerUnit: {
      builder:  [7, 10],
      standard: [12, 16],
      premium:  [18, 24],
      luxury:   [26, 36],
    },
    quantityFn: (i) => roofArea(i),
    tags: ['structure', 'roof'],
  },
  {
    id: 'staircase',
    displayName: 'Staircase',
    csiDivision: 'framing',
    unit: 'each',
    costPerUnit: {
      builder:  [3000, 5000],
      standard: [6000, 10000],
      premium:  [12000, 20000],
      luxury:   [25000, 45000],
    },
    quantityFn: (i) => Math.max(0, i.stories - 1),
    tags: ['structure', 'interior'],
  },

  // ==========================================
  // ROOFING
  // ==========================================
  {
    id: 'roofing',
    displayName: 'Roofing Material & Install',
    csiDivision: 'roofing',
    unit: 'sqft',
    costPerUnit: {
      builder:  [6, 8],
      standard: [10, 14],
      premium:  [18, 26],
      luxury:   [30, 42],
    },
    quantityFn: (i) => roofArea(i),
    tags: ['exterior', 'roof'],
  },
  {
    id: 'insulation',
    displayName: 'Insulation',
    csiDivision: 'roofing',
    unit: 'sqft',
    costPerUnit: {
      builder:  [2.50, 3.50],
      standard: [5, 7],
      premium:  [9, 13],
      luxury:   [15, 22],
    },
    quantityFn: (i) => i.sqft,
    tags: ['envelope'],
  },
  {
    id: 'waterproofing',
    displayName: 'Waterproofing & Moisture Barrier',
    csiDivision: 'roofing',
    unit: 'sqft',
    costPerUnit: {
      builder:  [1.50, 2],
      standard: [2.50, 4],
      premium:  [5, 7],
      luxury:   [8, 12],
    },
    quantityFn: (i) => i.sqft,
    tags: ['envelope'],
  },

  // ==========================================
  // EXTERIOR ENVELOPE
  // ==========================================
  {
    id: 'exterior_cladding',
    displayName: 'Exterior Cladding / Siding',
    csiDivision: 'exterior',
    unit: 'sqft',
    costPerUnit: {
      builder:  [10, 14],
      standard: [18, 26],
      premium:  [32, 45],
      luxury:   [52, 72],
    },
    quantityFn: (i) => wallArea(i),
    tags: ['exterior'],
  },
  {
    id: 'exterior_paint',
    displayName: 'Exterior Paint / Finish',
    csiDivision: 'exterior',
    unit: 'sqft',
    costPerUnit: {
      builder:  [2.50, 3.50],
      standard: [4, 6],
      premium:  [7, 10],
      luxury:   [12, 18],
    },
    quantityFn: (i) => wallArea(i),
    tags: ['exterior', 'paint'],
  },
  {
    id: 'soffit_fascia',
    displayName: 'Soffit, Fascia & Gutters',
    csiDivision: 'exterior',
    unit: 'lf',
    costPerUnit: {
      builder:  [14, 18],
      standard: [22, 30],
      premium:  [35, 48],
      luxury:   [52, 72],
    },
    quantityFn: (i) => perimeter(i),
    tags: ['exterior'],
  },

  // ==========================================
  // DOORS & WINDOWS
  // ==========================================
  {
    id: 'windows',
    displayName: 'Windows',
    csiDivision: 'doors_windows',
    unit: 'each',
    costPerUnit: {
      builder:  [500, 750],
      standard: [1000, 1500],
      premium:  [1800, 2800],
      luxury:   [3200, 5000],
    },
    quantityFn: (i) => windowCount(i),
    tags: ['exterior', 'window'],
  },
  {
    id: 'exterior_doors',
    displayName: 'Exterior Doors (Entry + Sliders)',
    csiDivision: 'doors_windows',
    unit: 'each',
    costPerUnit: {
      builder:  [1000, 1500],
      standard: [2200, 3500],
      premium:  [4500, 7000],
      luxury:   [8000, 15000],
    },
    quantityFn: (i) => 3 + (i.sqft > 3000 ? 1 : 0), // front, back, slider + bonus for larger
    tags: ['exterior', 'door'],
  },
  {
    id: 'interior_doors',
    displayName: 'Interior Doors',
    csiDivision: 'doors_windows',
    unit: 'each',
    costPerUnit: {
      builder:  [300, 450],
      standard: [600, 900],
      premium:  [1000, 1600],
      luxury:   [1800, 3000],
    },
    quantityFn: (i) => interiorDoorCount(i),
    tags: ['interior', 'door'],
  },
  {
    id: 'garage_doors',
    displayName: 'Garage Doors',
    csiDivision: 'doors_windows',
    unit: 'each',
    costPerUnit: {
      builder:  [1200, 1800],
      standard: [2000, 3000],
      premium:  [3500, 5500],
      luxury:   [6000, 10000],
    },
    quantityFn: (i) => i.garageSpaces > 0 ? Math.ceil(i.garageSpaces / 2) : 0, // 1 door per 2 cars
    tags: ['exterior', 'garage'],
  },

  // ==========================================
  // INTERIOR FINISHES
  // ==========================================
  {
    id: 'drywall',
    displayName: 'Drywall & Interior Walls',
    csiDivision: 'interior_finishes',
    unit: 'sqft',
    costPerUnit: {
      builder:  [7, 9],
      standard: [12, 16],
      premium:  [19, 26],
      luxury:   [30, 42],
    },
    quantityFn: (i) => i.sqft,
    tags: ['interior', 'walls'],
  },
  {
    id: 'interior_paint',
    displayName: 'Interior Paint',
    csiDivision: 'interior_finishes',
    unit: 'sqft',
    costPerUnit: {
      builder:  [3.50, 5],
      standard: [6, 9],
      premium:  [12, 18],
      luxury:   [22, 32],
    },
    quantityFn: (i) => i.sqft,
    tags: ['interior', 'paint'],
  },
  {
    id: 'flooring',
    displayName: 'Flooring',
    csiDivision: 'interior_finishes',
    unit: 'sqft',
    costPerUnit: {
      builder:  [6, 9],
      standard: [14, 20],
      premium:  [24, 36],
      luxury:   [40, 60],
    },
    quantityFn: (i) => Math.round(i.sqft * 0.75), // ~75% gets main flooring (rest is tile/garage)
    tags: ['interior', 'flooring'],
  },
  {
    id: 'tile',
    displayName: 'Tile (Bathrooms & Kitchen)',
    csiDivision: 'interior_finishes',
    unit: 'sqft',
    costPerUnit: {
      builder:  [10, 15],
      standard: [20, 30],
      premium:  [35, 52],
      luxury:   [58, 85],
    },
    quantityFn: (i) => {
      // Bathrooms: ~60 SF each (floor + walls) + kitchen backsplash ~40 SF
      return i.bathrooms * 60 + 40;
    },
    tags: ['interior', 'tile'],
  },
  {
    id: 'kitchen_countertops',
    displayName: 'Kitchen Countertops',
    csiDivision: 'interior_finishes',
    unit: 'lf',
    costPerUnit: {
      builder:  [50, 80],
      standard: [120, 180],
      premium:  [220, 340],
      luxury:   [400, 600],
    },
    quantityFn: (i) => kitchenCounterLF(i),
    tags: ['interior', 'kitchen', 'countertop'],
  },
  {
    id: 'bath_countertops',
    displayName: 'Bathroom Countertops',
    csiDivision: 'interior_finishes',
    unit: 'lf',
    costPerUnit: {
      builder:  [35, 55],
      standard: [65, 100],
      premium:  [120, 180],
      luxury:   [220, 340],
    },
    quantityFn: (i) => bathCounterLF(i),
    tags: ['interior', 'bath', 'countertop'],
  },
  {
    id: 'kitchen_cabinets',
    displayName: 'Kitchen Cabinetry',
    csiDivision: 'interior_finishes',
    unit: 'lf',
    costPerUnit: {
      builder:  [250, 380],
      standard: [500, 750],
      premium:  [850, 1300],
      luxury:   [1400, 2200],
    },
    quantityFn: (i) => kitchenCounterLF(i) + 5, // upper + lower runs
    tags: ['interior', 'kitchen', 'cabinets'],
  },
  {
    id: 'bath_vanities',
    displayName: 'Bathroom Vanities',
    csiDivision: 'interior_finishes',
    unit: 'each',
    costPerUnit: {
      builder:  [800, 1200],
      standard: [1800, 3000],
      premium:  [3500, 6000],
      luxury:   [7000, 12000],
    },
    quantityFn: (i) => i.bathrooms,
    tags: ['interior', 'bath', 'cabinets'],
  },
  {
    id: 'trim_baseboard',
    displayName: 'Trim, Baseboards & Crown Molding',
    csiDivision: 'interior_finishes',
    unit: 'sqft',
    costPerUnit: {
      builder:  [4, 6],
      standard: [8, 12],
      premium:  [15, 22],
      luxury:   [26, 38],
    },
    quantityFn: (i) => i.sqft,
    tags: ['interior', 'trim'],
  },
  {
    id: 'closets',
    displayName: 'Closet Systems',
    csiDivision: 'interior_finishes',
    unit: 'each',
    costPerUnit: {
      builder:  [600, 1000],
      standard: [1800, 3000],
      premium:  [4000, 7000],
      luxury:   [8000, 15000],
    },
    quantityFn: (i) => i.bedrooms + 2, // each bedroom + linen + coat
    tags: ['interior', 'closet'],
  },
  {
    id: 'ceiling_treatments',
    displayName: 'Ceiling Treatments',
    csiDivision: 'interior_finishes',
    unit: 'sqft',
    costPerUnit: {
      builder:  [1, 2],
      standard: [3, 5],
      premium:  [6, 10],
      luxury:   [12, 20],
    },
    quantityFn: (i) => Math.round(i.sqft * 0.4), // ~40% of home gets special ceiling
    tags: ['interior', 'ceiling'],
  },

  // ==========================================
  // MECHANICAL (Plumbing & HVAC)
  // ==========================================
  {
    id: 'plumbing_rough',
    displayName: 'Plumbing Rough-In',
    csiDivision: 'mechanical',
    unit: 'sqft',
    costPerUnit: {
      builder:  [9, 13],
      standard: [16, 22],
      premium:  [26, 36],
      luxury:   [40, 55],
    },
    quantityFn: (i) => i.sqft,
    tags: ['mechanical', 'plumbing'],
  },
  {
    id: 'plumbing_fixtures',
    displayName: 'Plumbing Fixtures (Faucets, Toilets, Showers)',
    csiDivision: 'mechanical',
    unit: 'each',
    costPerUnit: {
      builder:  [450, 700],
      standard: [900, 1400],
      premium:  [1800, 2800],
      luxury:   [3500, 6000],
    },
    quantityFn: (i) => plumbingFixtureCount(i),
    tags: ['mechanical', 'plumbing', 'fixtures'],
  },
  {
    id: 'water_heater',
    displayName: 'Water Heater System',
    csiDivision: 'mechanical',
    unit: 'each',
    costPerUnit: {
      builder:  [1200, 1800],
      standard: [2000, 3200],
      premium:  [3500, 5500],
      luxury:   [6000, 10000],
    },
    quantityFn: (i) => i.sqft > 4000 ? 2 : 1,
    tags: ['mechanical', 'plumbing'],
  },
  {
    id: 'hvac',
    displayName: 'HVAC System',
    csiDivision: 'mechanical',
    unit: 'sqft',
    costPerUnit: {
      builder:  [12, 16],
      standard: [22, 30],
      premium:  [35, 48],
      luxury:   [55, 75],
    },
    quantityFn: (i) => i.sqft,
    tags: ['mechanical', 'hvac'],
  },

  // ==========================================
  // ELECTRICAL & LIGHTING
  // ==========================================
  {
    id: 'electrical',
    displayName: 'Electrical Rough-In & Panel',
    csiDivision: 'electrical',
    unit: 'sqft',
    costPerUnit: {
      builder:  [9, 13],
      standard: [16, 22],
      premium:  [26, 36],
      luxury:   [40, 55],
    },
    quantityFn: (i) => i.sqft,
    tags: ['electrical'],
  },
  {
    id: 'lighting_fixtures',
    displayName: 'Lighting Fixtures',
    csiDivision: 'electrical',
    unit: 'sqft',
    costPerUnit: {
      builder:  [2.50, 4],
      standard: [6, 9],
      premium:  [12, 18],
      luxury:   [22, 35],
    },
    quantityFn: (i) => i.sqft,
    tags: ['electrical', 'lighting'],
  },

  // ==========================================
  // APPLIANCES
  // ==========================================
  {
    id: 'kitchen_appliances',
    displayName: 'Kitchen Appliance Package',
    csiDivision: 'interior_finishes',
    unit: 'each',
    costPerUnit: {
      builder:  [6000, 10000],
      standard: [14000, 22000],
      premium:  [28000, 45000],
      luxury:   [50000, 85000],
    },
    quantityFn: () => 1,
    tags: ['kitchen', 'appliances'],
  },
  {
    id: 'laundry_appliances',
    displayName: 'Laundry Appliances',
    csiDivision: 'interior_finishes',
    unit: 'each',
    costPerUnit: {
      builder:  [1200, 1800],
      standard: [2000, 3000],
      premium:  [3500, 5000],
      luxury:   [5000, 8000],
    },
    quantityFn: () => 1,
    tags: ['appliances'],
  },

  // ==========================================
  // GARAGE INTERIOR
  // ==========================================
  {
    id: 'garage_interior',
    displayName: 'Garage Interior (Floor Coating, Drywall)',
    csiDivision: 'interior_finishes',
    unit: 'sqft',
    costPerUnit: {
      builder:  [4, 6],
      standard: [7, 10],
      premium:  [12, 18],
      luxury:   [20, 30],
    },
    quantityFn: (i) => garageSqft(i),
    tags: ['garage'],
  },

  // ==========================================
  // SPECIALTY ITEMS
  // ==========================================
  {
    id: 'pool_standard',
    displayName: 'Swimming Pool (Gunite)',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [45000, 65000],
      standard: [65000, 90000],
      premium:  [90000, 130000],
      luxury:   [130000, 180000],
    },
    quantityFn: (i) => i.pool === 'standard' ? 1 : 0,
    tags: ['specialty', 'pool'],
  },
  {
    id: 'pool_infinity',
    displayName: 'Infinity Edge Pool',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [80000, 110000],
      standard: [110000, 150000],
      premium:  [150000, 220000],
      luxury:   [220000, 350000],
    },
    quantityFn: (i) => i.pool === 'infinity' ? 1 : 0,
    tags: ['specialty', 'pool'],
  },
  {
    id: 'elevator_2stop',
    displayName: 'Residential Elevator (2-Stop)',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [30000, 40000],
      standard: [40000, 55000],
      premium:  [55000, 75000],
      luxury:   [75000, 110000],
    },
    quantityFn: (i) => i.elevator === '2stop' ? 1 : 0,
    tags: ['specialty', 'elevator'],
  },
  {
    id: 'elevator_3stop',
    displayName: 'Residential Elevator (3-Stop)',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [45000, 60000],
      standard: [60000, 80000],
      premium:  [80000, 110000],
      luxury:   [110000, 160000],
    },
    quantityFn: (i) => i.elevator === '3stop' ? 1 : 0,
    tags: ['specialty', 'elevator'],
  },
  {
    id: 'outdoor_kitchen',
    displayName: 'Outdoor Kitchen',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [15000, 25000],
      standard: [25000, 40000],
      premium:  [40000, 70000],
      luxury:   [70000, 120000],
    },
    quantityFn: (i) => i.outdoorKitchen ? 1 : 0,
    tags: ['specialty', 'outdoor'],
  },
  {
    id: 'fireplace_linear',
    displayName: 'Linear Gas Fireplace',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [3000, 5000],
      standard: [5000, 8000],
      premium:  [10000, 16000],
      luxury:   [18000, 30000],
    },
    quantityFn: (i) => i.fireplace === 'linear' ? 1 : 0,
    tags: ['specialty', 'fireplace'],
  },
  {
    id: 'fireplace_custom',
    displayName: 'Custom Masonry Fireplace',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [8000, 12000],
      standard: [12000, 18000],
      premium:  [20000, 35000],
      luxury:   [40000, 65000],
    },
    quantityFn: (i) => i.fireplace === 'custom' ? 1 : 0,
    tags: ['specialty', 'fireplace'],
  },
  {
    id: 'smart_home_basic',
    displayName: 'Smart Home (Basic)',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [3000, 5000],
      standard: [5000, 8000],
      premium:  [8000, 12000],
      luxury:   [12000, 18000],
    },
    quantityFn: (i) => i.smartHome === 'basic' ? 1 : 0,
    tags: ['specialty', 'smart_home'],
  },
  {
    id: 'smart_home_standard',
    displayName: 'Smart Home (Full System)',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [8000, 12000],
      standard: [12000, 20000],
      premium:  [22000, 35000],
      luxury:   [35000, 55000],
    },
    quantityFn: (i) => i.smartHome === 'standard' ? 1 : 0,
    tags: ['specialty', 'smart_home'],
  },
  {
    id: 'smart_home_full',
    displayName: 'Smart Home (Integrated Automation)',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [18000, 25000],
      standard: [28000, 40000],
      premium:  [45000, 70000],
      luxury:   [75000, 120000],
    },
    quantityFn: (i) => i.smartHome === 'full' ? 1 : 0,
    tags: ['specialty', 'smart_home'],
  },
  {
    id: 'generator',
    displayName: 'Whole-Home Generator',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [8000, 12000],
      standard: [12000, 18000],
      premium:  [18000, 28000],
      luxury:   [28000, 45000],
    },
    quantityFn: (i) => i.generator ? 1 : 0,
    tags: ['specialty', 'generator'],
  },
  {
    id: 'seawall',
    displayName: 'Seawall / Bulkhead',
    csiDivision: 'specialties',
    unit: 'fixed',
    costPerUnit: {
      builder:  [30000, 50000],
      standard: [50000, 80000],
      premium:  [80000, 120000],
      luxury:   [120000, 180000],
    },
    quantityFn: (i) => i.seawall ? 1 : 0,
    tags: ['specialty', 'coastal'],
  },
  {
    id: 'deck',
    displayName: 'Deck / Patio',
    csiDivision: 'specialties',
    unit: 'sqft',
    costPerUnit: {
      builder:  [20, 30],
      standard: [30, 45],
      premium:  [50, 75],
      luxury:   [80, 120],
    },
    quantityFn: (i) => i.deckSqft,
    tags: ['specialty', 'outdoor'],
  },
  {
    id: 'screened_porch',
    displayName: 'Screened Porch / Lanai',
    csiDivision: 'specialties',
    unit: 'sqft',
    costPerUnit: {
      builder:  [25, 35],
      standard: [40, 55],
      premium:  [60, 85],
      luxury:   [90, 130],
    },
    quantityFn: (i) => i.screenedPorch ? Math.round(i.sqft * 0.1) : 0, // ~10% of home
    tags: ['specialty', 'outdoor'],
  },

  // ==========================================
  // OVERHEAD, PERMITS, INSURANCE
  // ==========================================
  {
    id: 'permits_fees',
    displayName: 'Building Permits & Impact Fees',
    csiDivision: 'overhead',
    unit: 'sqft',
    costPerUnit: {
      builder:  [5, 7],
      standard: [8, 12],
      premium:  [14, 20],
      luxury:   [22, 30],
    },
    quantityFn: (i) => i.sqft,
    tags: ['overhead'],
  },
  {
    id: 'architecture',
    displayName: 'Architecture & Engineering',
    csiDivision: 'overhead',
    unit: 'sqft',
    costPerUnit: {
      builder:  [4, 6],
      standard: [8, 12],
      premium:  [16, 24],
      luxury:   [28, 40],
    },
    quantityFn: (i) => i.sqft,
    tags: ['overhead'],
  },
  {
    id: 'survey_geotech',
    displayName: 'Survey & Geotechnical',
    csiDivision: 'overhead',
    unit: 'fixed',
    costPerUnit: {
      builder:  [3000, 5000],
      standard: [5000, 8000],
      premium:  [8000, 12000],
      luxury:   [12000, 18000],
    },
    quantityFn: () => 1,
    tags: ['overhead'],
  },
];

/**
 * Get a cost item by ID.
 */
export function getCostItem(id: string): CostItemDef | undefined {
  return COST_DATABASE.find((item) => item.id === id);
}

/**
 * Get all items in a CSI division.
 */
export function getItemsByDivision(division: string): CostItemDef[] {
  return COST_DATABASE.filter((item) => item.csiDivision === division);
}
