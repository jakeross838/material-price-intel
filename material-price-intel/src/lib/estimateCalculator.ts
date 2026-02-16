// ===========================================
// Estimate Calculator
// Pure functions -- no side effects, no API calls.
//
// Two modes:
//   1. calculateRoomEstimate()  -- NEW room-by-room selections
//   2. calculateEstimate()      -- LEGACY global finish-level approach
// ===========================================

import type {
  FinishLevel,
  EstimatorConfig,
  EstimateParams,
  EstimateBreakdownItem,
} from "./types";
import { ROOM_TEMPLATES } from "./roomEstimatorData";

// -------------------------------------------
// Room-based types
// -------------------------------------------

/** Selections for a single room instance. */
export type RoomSelections = {
  roomId: string;
  roomName: string;
  sqftAllocation: number; // actual sqft for this room
  categories: { category: string; finishLevel: FinishLevel }[];
};

/** Breakdown for a single room showing per-category line items and totals. */
export type RoomBreakdown = {
  roomId: string;
  roomName: string;
  items: EstimateBreakdownItem[];
  roomLow: number;
  roomHigh: number;
};

/** Full estimate result with room-level detail and a flat breakdown. */
export type RoomEstimateResult = {
  low: number;
  high: number;
  roomBreakdowns: RoomBreakdown[];
  /** Flat list combining all rooms -- used by LeadCaptureForm and summary views. */
  breakdown: EstimateBreakdownItem[];
};

// -------------------------------------------
// Room-based calculator (NEW)
// -------------------------------------------

/**
 * Calculate a home estimate based on room-by-room finish selections.
 *
 * For each room:
 *   - For each category the user selected a finish level for,
 *     find the matching estimator_config row (category + finishLevel).
 *   - Multiply the config's cost_per_sqft range by the room's sqft allocation.
 *   - Aggregate into a per-room breakdown and overall totals.
 *
 * @param rooms   Array of room selections with sqft and per-category finish levels.
 * @param allConfig  All estimator_config rows (all categories, all finish levels).
 * @returns Estimate with room breakdowns and a flattened overall breakdown.
 */
export function calculateRoomEstimate(
  rooms: RoomSelections[],
  allConfig: EstimatorConfig[]
): RoomEstimateResult {
  // Build a lookup map: "category|finishLevel" -> EstimatorConfig
  const configMap = new Map<string, EstimatorConfig>();
  for (const cfg of allConfig) {
    configMap.set(`${cfg.category}|${cfg.finish_level}`, cfg);
  }

  const roomBreakdowns: RoomBreakdown[] = [];
  // Track combined totals per category across all rooms for the flat breakdown.
  const categoryTotals = new Map<
    string,
    { display_name: string; low: number; high: number }
  >();

  for (const room of rooms) {
    const items: EstimateBreakdownItem[] = [];

    for (const selection of room.categories) {
      const key = `${selection.category}|${selection.finishLevel}`;
      const cfg = configMap.get(key);

      if (!cfg) {
        // No matching config row -- skip silently.
        // This can happen if the DB is missing a category/level combo.
        continue;
      }

      const low = Math.round(room.sqftAllocation * cfg.cost_per_sqft_low);
      const high = Math.round(room.sqftAllocation * cfg.cost_per_sqft_high);

      // Per-room line item (labeled with room context)
      items.push({
        category: selection.category,
        display_name: cfg.display_name,
        finishLevel: selection.finishLevel,
        low,
        high,
      });

      // Accumulate into flat category totals
      const existing = categoryTotals.get(selection.category);
      if (existing) {
        existing.low += low;
        existing.high += high;
      } else {
        categoryTotals.set(selection.category, {
          display_name: cfg.display_name,
          low,
          high,
        });
      }
    }

    const roomLow = items.reduce((sum, item) => sum + item.low, 0);
    const roomHigh = items.reduce((sum, item) => sum + item.high, 0);

    roomBreakdowns.push({
      roomId: room.roomId,
      roomName: room.roomName,
      items,
      roomLow,
      roomHigh,
    });
  }

  // Build the flat breakdown from aggregated category totals.
  const breakdown: EstimateBreakdownItem[] = Array.from(
    categoryTotals.entries()
  ).map(([category, totals]) => ({
    category,
    display_name: totals.display_name,
    low: totals.low,
    high: totals.high,
  }));

  const low = breakdown.reduce((sum, item) => sum + item.low, 0);
  const high = breakdown.reduce((sum, item) => sum + item.high, 0);

  return { low, high, roomBreakdowns, breakdown };
}

// -------------------------------------------
// Location multipliers (Bradenton/Sarasota FL market)
// -------------------------------------------

export const LOCATION_MULTIPLIERS: Record<string, { label: string; multiplier: number }> = {
  bradenton: { label: "Bradenton", multiplier: 1.0 },
  sarasota: { label: "Sarasota", multiplier: 1.08 },
  lakewood_ranch: { label: "Lakewood Ranch", multiplier: 1.12 },
  siesta_key: { label: "Siesta Key", multiplier: 1.18 },
  longboat_key: { label: "Longboat Key", multiplier: 1.22 },
};

// -------------------------------------------
// Special feature fixed costs
// -------------------------------------------

export type SpecialFeatureDef = {
  id: string;
  label: string;
  low: number;
  high: number;
};

export const SPECIAL_FEATURES: SpecialFeatureDef[] = [
  { id: "pool", label: "Swimming Pool", low: 35000, high: 80000 },
  { id: "outdoor_kitchen", label: "Outdoor Kitchen", low: 15000, high: 40000 },
  { id: "generator", label: "Whole-Home Generator", low: 8000, high: 18000 },
  { id: "elevator", label: "Residential Elevator", low: 25000, high: 50000 },
  { id: "wine_cellar", label: "Wine Cellar", low: 10000, high: 30000 },
  { id: "outdoor_fireplace", label: "Outdoor Fireplace", low: 5000, high: 15000 },
];

// -------------------------------------------
// Simplified calculator (NEW — single finish level)
// -------------------------------------------

export type SimplifiedEstimateInput = {
  sqft: number;
  stories: number;
  bedrooms: number;
  bathrooms: number;
  finishLevel: FinishLevel;
  location: string;
  specialFeatures: string[];
};

/**
 * Calculate a home estimate from a single finish level applied to all rooms.
 *
 * 1. Auto-generates rooms from bed/bath counts using ROOM_TEMPLATES.
 * 2. Applies the chosen finish level to every category in every room.
 * 3. Feeds into calculateRoomEstimate() for room-level breakdowns.
 * 4. Applies a location multiplier.
 * 5. Appends special feature line items.
 */
export function calculateSimplifiedEstimate(
  input: SimplifiedEstimateInput,
  allConfig: EstimatorConfig[]
): RoomEstimateResult {
  const { sqft, bedrooms, bathrooms, finishLevel, location, specialFeatures } = input;

  // 1. Build room list from templates
  const rooms: RoomSelections[] = [];

  // Helper: add a room from a template
  function addRoom(templateId: string, displayName: string) {
    const template = ROOM_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const sqftAllocation = Math.round((template.defaultSqftPercent / 100) * sqft);
    rooms.push({
      roomId: templateId + (rooms.filter((r) => r.roomId.startsWith(templateId)).length > 0
        ? `_${rooms.filter((r) => r.roomId.startsWith(templateId)).length + 1}` : ""),
      roomName: displayName,
      sqftAllocation,
      categories: template.categories.map((cat) => ({
        category: cat,
        finishLevel,
      })),
    });
  }

  // Always: kitchen, great room, master bedroom, master bath, exterior
  addRoom("kitchen", "Kitchen");
  addRoom("great_room", "Great Room");
  addRoom("master_bedroom", "Master Bedroom");
  addRoom("master_bath", "Master Bath");

  // Guest bedrooms
  const guestBeds = Math.max(0, bedrooms - 1);
  for (let i = 1; i <= guestBeds; i++) {
    addRoom("guest_bedroom", guestBeds === 1 ? "Guest Bedroom" : `Guest Bedroom ${i}`);
  }

  // Guest bathrooms
  const guestBaths = Math.max(0, bathrooms - 1);
  for (let i = 1; i <= guestBaths; i++) {
    addRoom("guest_bath", guestBaths === 1 ? "Guest Bath" : `Guest Bath ${i}`);
  }

  // Default optional rooms
  addRoom("dining_room", "Dining Room");
  addRoom("laundry", "Laundry");
  addRoom("garage", "Garage");
  addRoom("exterior", "Exterior");

  // 2. Deduplicate room IDs (the helper above handles this)
  // Fix roomIds to be unique
  const idCounts = new Map<string, number>();
  for (const room of rooms) {
    const base = room.roomId.replace(/_\d+$/, "");
    const count = (idCounts.get(base) ?? 0) + 1;
    idCounts.set(base, count);
    if (count > 1) {
      room.roomId = `${base}_${count}`;
    }
  }

  // 3. Calculate using room-based calculator
  const result = calculateRoomEstimate(rooms, allConfig);

  // 4. Apply location multiplier
  const mult = LOCATION_MULTIPLIERS[location]?.multiplier ?? 1.0;
  if (mult !== 1.0) {
    for (const rb of result.roomBreakdowns) {
      rb.roomLow = Math.round(rb.roomLow * mult);
      rb.roomHigh = Math.round(rb.roomHigh * mult);
      for (const item of rb.items) {
        item.low = Math.round(item.low * mult);
        item.high = Math.round(item.high * mult);
      }
    }
    for (const item of result.breakdown) {
      item.low = Math.round(item.low * mult);
      item.high = Math.round(item.high * mult);
    }
    result.low = Math.round(result.low * mult);
    result.high = Math.round(result.high * mult);
  }

  // 5. Append special features
  for (const featureId of specialFeatures) {
    const def = SPECIAL_FEATURES.find((f) => f.id === featureId);
    if (!def) continue;

    const featureItem: EstimateBreakdownItem = {
      category: def.id,
      display_name: def.label,
      low: def.low,
      high: def.high,
    };

    // Add as its own "room" breakdown for visibility
    result.roomBreakdowns.push({
      roomId: def.id,
      roomName: def.label,
      items: [featureItem],
      roomLow: def.low,
      roomHigh: def.high,
    });

    result.breakdown.push(featureItem);
    result.low += def.low;
    result.high += def.high;
  }

  return result;
}

// -------------------------------------------
// Legacy calculator
// -------------------------------------------

/**
 * @deprecated Use `calculateRoomEstimate` for the new room-by-room estimator.
 * Kept for backward compatibility with the original 4-step wizard and
 * any existing leads that reference the old EstimateParams shape.
 */
export function calculateEstimate(
  params: EstimateParams,
  config: EstimatorConfig[]
): { low: number; high: number; breakdown: EstimateBreakdownItem[] } {
  const { square_footage, stories, bedrooms, bathrooms, special_features } =
    params;

  // Story multiplier: 2-story adds 6%, 3-story adds 14%
  const storyMultiplier = stories === 1 ? 1.0 : stories === 2 ? 1.06 : 1.14;

  // Base calculation: sqft x $/sqft x storyMultiplier for each category
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
    adjustCategory(
      breakdown,
      "fixtures",
      extraBaths * 2000,
      extraBaths * 4000
    );
    adjustCategory(
      breakdown,
      "flooring",
      extraBaths * 800,
      extraBaths * 1500
    );
  }

  // Bedroom premium: each above 3 adds to electrical + flooring
  const extraBeds = Math.max(0, bedrooms - 3);
  if (extraBeds > 0) {
    adjustCategory(
      breakdown,
      "electrical",
      extraBeds * 800,
      extraBeds * 1500
    );
    adjustCategory(
      breakdown,
      "flooring",
      extraBeds * 1200,
      extraBeds * 2500
    );
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
    adjustCategory(
      breakdown,
      "windows",
      square_footage * 2,
      square_footage * 4
    );
  } else if (params.window_grade === "hurricane") {
    adjustCategory(
      breakdown,
      "windows",
      square_footage * 4,
      square_footage * 7
    );
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

// -------------------------------------------
// Internal helpers
// -------------------------------------------

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
