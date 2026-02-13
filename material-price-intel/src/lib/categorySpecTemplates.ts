// ===========================================
// Category-Aware Spec Templates
// ===========================================
// Maps material_categories.name to an ordered
// list of spec keys to highlight at the top of
// the product specs display. These are just
// display hints — all specs from Claude are shown.
// ===========================================

export type SpecTemplate = {
  key: string;
  label: string;
};

export const CATEGORY_SPEC_TEMPLATES: Record<string, SpecTemplate[]> = {
  appliances: [
    { key: "voltage", label: "Voltage" },
    { key: "wattage", label: "Wattage" },
    { key: "btu", label: "BTU Rating" },
    { key: "capacity", label: "Capacity" },
    { key: "dimensions", label: "Dimensions" },
    { key: "energy", label: "Energy Rating" },
    { key: "finish", label: "Finish/Color" },
    { key: "weight", label: "Weight" },
  ],
  flooring: [
    { key: "wear", label: "Wear Layer" },
    { key: "thickness", label: "Thickness" },
    { key: "width", label: "Plank Width" },
    { key: "length", label: "Plank Length" },
    { key: "install", label: "Install Method" },
    { key: "ac rating", label: "AC Rating" },
    { key: "species", label: "Wood Species" },
    { key: "finish", label: "Finish" },
    { key: "waterproof", label: "Waterproof" },
  ],
  fixtures: [
    { key: "lumen", label: "Lumens" },
    { key: "watt", label: "Wattage" },
    { key: "color temp", label: "Color Temperature" },
    { key: "mounting", label: "Mounting Type" },
    { key: "dimensions", label: "Dimensions" },
    { key: "finish", label: "Finish" },
    { key: "bulb", label: "Bulb Type" },
    { key: "dimmable", label: "Dimmable" },
    { key: "ul", label: "UL/ETL Listing" },
  ],
  plumbing: [
    { key: "flow", label: "Flow Rate" },
    { key: "rough-in", label: "Rough-In Size" },
    { key: "finish", label: "Finish" },
    { key: "dimensions", label: "Dimensions" },
    { key: "material", label: "Material" },
    { key: "certification", label: "Certifications" },
    { key: "valve", label: "Valve Type" },
  ],
  cabinets: [
    { key: "material", label: "Material" },
    { key: "construction", label: "Construction" },
    { key: "finish", label: "Finish" },
    { key: "dimensions", label: "Dimensions" },
    { key: "soft-close", label: "Soft-Close" },
    { key: "overlay", label: "Door Overlay" },
    { key: "shelf", label: "Adjustable Shelves" },
  ],
  tile: [
    { key: "material", label: "Material" },
    { key: "size", label: "Tile Size" },
    { key: "thickness", label: "Thickness" },
    { key: "finish", label: "Surface Finish" },
    { key: "pei", label: "PEI Rating" },
    { key: "water absorption", label: "Water Absorption" },
    { key: "frost", label: "Frost Resistant" },
  ],
  roofing: [
    { key: "material", label: "Material" },
    { key: "wind", label: "Wind Rating" },
    { key: "impact", label: "Impact Rating" },
    { key: "warranty", label: "Warranty" },
    { key: "color", label: "Color" },
    { key: "fire", label: "Fire Rating" },
  ],
  windows: [
    { key: "frame", label: "Frame Material" },
    { key: "glass", label: "Glass Type" },
    { key: "u-factor", label: "U-Factor" },
    { key: "shgc", label: "SHGC" },
    { key: "dp", label: "Design Pressure" },
    { key: "impact", label: "Impact Rated" },
    { key: "dimensions", label: "Dimensions" },
  ],
  lumber: [
    { key: "species", label: "Species" },
    { key: "grade", label: "Grade" },
    { key: "treatment", label: "Treatment" },
    { key: "dimensions", label: "Dimensions" },
    { key: "moisture", label: "Moisture Content" },
  ],
  paint: [
    { key: "finish", label: "Finish/Sheen" },
    { key: "coverage", label: "Coverage" },
    { key: "voc", label: "VOC Level" },
    { key: "dry time", label: "Dry Time" },
    { key: "color", label: "Color" },
  ],
};

// ===========================================
// Helper: get prioritized specs for display
// ===========================================

export function getPrioritizedSpecs(
  specs: Record<string, string>,
  categoryName: string | null
): { key: string; label: string; value: string; isHighlighted: boolean }[] {
  const template = CATEGORY_SPEC_TEMPLATES[categoryName ?? ""] ?? [];
  const result: { key: string; label: string; value: string; isHighlighted: boolean }[] = [];
  const usedKeys = new Set<string>();

  // First: match template keys (case-insensitive substring)
  for (const tmpl of template) {
    for (const [specKey, specValue] of Object.entries(specs)) {
      if (usedKeys.has(specKey)) continue;
      if (specKey.toLowerCase().includes(tmpl.key.toLowerCase())) {
        result.push({
          key: specKey,
          label: tmpl.label,
          value: specValue,
          isHighlighted: true,
        });
        usedKeys.add(specKey);
        break;
      }
    }
  }

  // Second: remaining specs alphabetically
  const remaining = Object.entries(specs)
    .filter(([k]) => !usedKeys.has(k))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of remaining) {
    result.push({ key, label: key, value, isHighlighted: false });
  }

  return result;
}
