import type { EstimatorConfig, EstimateParams, EstimateBreakdownItem } from "./types";

// ===========================================
// Estimate Calculator
// Pure function — no side effects, no API calls.
// Takes user params + pricing config, returns breakdown.
// ===========================================

export function calculateEstimate(
  params: EstimateParams,
  config: EstimatorConfig[]
): { low: number; high: number; breakdown: EstimateBreakdownItem[] } {
  const { square_footage, stories, bedrooms, bathrooms, special_features } = params;

  // Story multiplier: 2-story adds 6%, 3-story adds 14%
  const storyMultiplier = stories === 1 ? 1.0 : stories === 2 ? 1.06 : 1.14;

  // Base calculation: sqft × $/sqft × storyMultiplier for each category
  const breakdown: EstimateBreakdownItem[] = config.map((c) => ({
    category: c.category,
    display_name: c.display_name,
    low: Math.round(square_footage * c.cost_per_sqft_low * storyMultiplier),
    high: Math.round(square_footage * c.cost_per_sqft_high * storyMultiplier),
  }));

  // Bathroom premium: each above 2 adds to plumbing + fixtures + flooring
  const extraBaths = Math.max(0, bathrooms - 2);
  if (extraBaths > 0) {
    adjustCategory(breakdown, "plumbing", extraBaths * 3500, extraBaths * 5500);
    adjustCategory(breakdown, "fixtures", extraBaths * 2000, extraBaths * 4000);
    adjustCategory(breakdown, "flooring", extraBaths * 800, extraBaths * 1500);
  }

  // Bedroom premium: each above 3 adds to electrical + flooring
  const extraBeds = Math.max(0, bedrooms - 3);
  if (extraBeds > 0) {
    adjustCategory(breakdown, "electrical", extraBeds * 800, extraBeds * 1500);
    adjustCategory(breakdown, "flooring", extraBeds * 1200, extraBeds * 2500);
  }

  // Kitchen tier premium (adds to cabinets + appliances)
  if (params.kitchen_tier === "chefs") {
    adjustCategory(breakdown, "cabinets", 8000, 15000);
    adjustCategory(breakdown, "appliances", 5000, 10000);
  } else if (params.kitchen_tier === "gourmet") {
    adjustCategory(breakdown, "cabinets", 18000, 30000);
    adjustCategory(breakdown, "appliances", 12000, 22000);
  }

  // Bath tier premium (adds to plumbing + fixtures)
  if (params.bath_tier === "spa") {
    adjustCategory(breakdown, "plumbing", 4000, 8000);
    adjustCategory(breakdown, "fixtures", 3000, 6000);
  } else if (params.bath_tier === "resort") {
    adjustCategory(breakdown, "plumbing", 10000, 18000);
    adjustCategory(breakdown, "fixtures", 8000, 15000);
  }

  // Roofing type adjustment
  if (params.roofing_type === "metal") {
    adjustCategory(breakdown, "roofing", square_footage * 2, square_footage * 4);
  } else if (params.roofing_type === "tile") {
    adjustCategory(breakdown, "roofing", square_footage * 3, square_footage * 5);
  }

  // Window grade adjustment
  if (params.window_grade === "impact") {
    adjustCategory(breakdown, "windows", square_footage * 2, square_footage * 4);
  } else if (params.window_grade === "hurricane") {
    adjustCategory(breakdown, "windows", square_footage * 4, square_footage * 7);
  }

  // Special features (fixed cost additions)
  if (special_features.includes("pool")) {
    breakdown.push({
      category: "pool",
      display_name: "Swimming Pool",
      low: 35000,
      high: 80000,
    });
  }
  if (special_features.includes("outdoor_kitchen")) {
    breakdown.push({
      category: "outdoor_kitchen",
      display_name: "Outdoor Kitchen",
      low: 15000,
      high: 40000,
    });
  }
  if (special_features.includes("smart_home")) {
    breakdown.push({
      category: "smart_home",
      display_name: "Smart Home System",
      low: 8000,
      high: 25000,
    });
  }
  if (special_features.includes("generator")) {
    breakdown.push({
      category: "generator",
      display_name: "Whole-Home Generator",
      low: 8000,
      high: 18000,
    });
  }
  if (special_features.includes("elevator")) {
    breakdown.push({
      category: "elevator",
      display_name: "Residential Elevator",
      low: 25000,
      high: 50000,
    });
  }

  const low = breakdown.reduce((sum, item) => sum + item.low, 0);
  const high = breakdown.reduce((sum, item) => sum + item.high, 0);

  return { low, high, breakdown };
}

function adjustCategory(
  breakdown: EstimateBreakdownItem[],
  category: string,
  addLow: number,
  addHigh: number
) {
  const item = breakdown.find((b) => b.category === category);
  if (item) {
    item.low += Math.round(addLow);
    item.high += Math.round(addHigh);
  }
}
