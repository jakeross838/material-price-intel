// ===========================================
// Room Estimator Data
// Static selection options for the Dream Home Designer.
// Provides room templates and per-category finish options
// with representative imagery (Unsplash) until real
// material images are populated in the database.
// ===========================================

import type { FinishLevel } from "./types";

// -------------------------------------------
// Types
// -------------------------------------------

export type RoomTemplate = {
  id: string;
  displayName: string;
  icon: string; // lucide icon name
  defaultSqftPercent: number; // percentage of total home sqft
  categories: string[]; // keys matching estimator_config.category
  defaultCount: number; // how many of this room in a typical home
};

export type SelectionOption = {
  finishLevel: FinishLevel;
  label: string;
  description: string;
  imageUrl: string;
};

// -------------------------------------------
// Room Templates
// -------------------------------------------
// Percentages are for a SINGLE instance of each room.
// guest_bedroom (24%) assumes 3 bedrooms at ~8% each.
// guest_bath (4%) assumes 2 baths at ~2% each.
// Total for a typical home: ~100%.

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: "kitchen",
    displayName: "Kitchen",
    icon: "ChefHat",
    defaultSqftPercent: 10,
    categories: ["cabinets", "countertops", "appliances", "flooring", "lighting"],
    defaultCount: 1,
  },
  {
    id: "master_bath",
    displayName: "Master Bath",
    icon: "Bath",
    defaultSqftPercent: 5,
    categories: ["plumbing", "fixtures", "flooring", "lighting"],
    defaultCount: 1,
  },
  {
    id: "master_bedroom",
    displayName: "Master Bedroom",
    icon: "Bed",
    defaultSqftPercent: 12,
    categories: ["flooring", "lighting", "paint"],
    defaultCount: 1,
  },
  {
    id: "guest_bedroom",
    displayName: "Guest Bedroom",
    icon: "BedDouble",
    defaultSqftPercent: 8,
    categories: ["flooring", "lighting", "paint"],
    defaultCount: 3,
  },
  {
    id: "guest_bath",
    displayName: "Guest Bath",
    icon: "ShowerHead",
    defaultSqftPercent: 2,
    categories: ["plumbing", "fixtures", "flooring"],
    defaultCount: 2,
  },
  {
    id: "great_room",
    displayName: "Great Room",
    icon: "Sofa",
    defaultSqftPercent: 18,
    categories: ["flooring", "lighting", "windows", "paint"],
    defaultCount: 1,
  },
  {
    id: "dining_room",
    displayName: "Dining Room",
    icon: "UtensilsCrossed",
    defaultSqftPercent: 6,
    categories: ["flooring", "lighting", "paint"],
    defaultCount: 1,
  },
  {
    id: "office",
    displayName: "Office",
    icon: "Monitor",
    defaultSqftPercent: 5,
    categories: ["flooring", "lighting", "paint"],
    defaultCount: 1,
  },
  {
    id: "laundry",
    displayName: "Laundry",
    icon: "WashingMachine",
    defaultSqftPercent: 3,
    categories: ["cabinets", "plumbing", "flooring"],
    defaultCount: 1,
  },
  {
    id: "garage",
    displayName: "Garage",
    icon: "Car",
    defaultSqftPercent: 10,
    categories: ["flooring", "paint"],
    defaultCount: 1,
  },
  {
    id: "exterior",
    displayName: "Exterior",
    icon: "Home",
    defaultSqftPercent: 8,
    categories: ["roofing", "windows", "siding", "landscaping"],
    defaultCount: 1,
  },
  {
    id: "outdoor_living",
    displayName: "Outdoor Living",
    icon: "TreePalm",
    defaultSqftPercent: 5,
    categories: ["landscaping"],
    defaultCount: 1,
  },
];

// -------------------------------------------
// Selection Options by Category
// -------------------------------------------
// Each category has 4 tiers: builder, standard, premium, luxury.
// Image URLs use real Unsplash photo IDs for relevant visuals.

export const SELECTION_OPTIONS: Record<string, SelectionOption[]> = {
  // ----- CABINETS -----
  cabinets: [
    {
      finishLevel: "builder",
      label: "Stock Laminate Cabinets",
      description:
        "Pre-made laminate cabinets in standard sizes and finishes. Functional and durable with basic hardware. Available in white, oak, or espresso and ready for quick installation.",
      imageUrl:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Semi-Custom Wood Cabinets",
      description:
        "Solid wood-front cabinets with soft-close hinges and dovetail drawers. Available in maple, cherry, or hickory with a range of stain colors. Includes upgraded brushed nickel hardware.",
      imageUrl:
        "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Custom Painted Cabinets",
      description:
        "Fully custom cabinetry with hand-painted finishes and premium soft-close mechanisms. Features pull-out organizers, lazy susans, and built-in spice racks. Crafted from select hardwoods with mortise-and-tenon joinery.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Handcrafted Inset Cabinets",
      description:
        "Bespoke inset-door cabinetry built by master craftsmen with hand-applied glazes and custom molding profiles. Includes integrated LED lighting, motorized shelving, and exotic wood interiors. Every detail is tailored to your exact specifications.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
    },
  ],

  // ----- COUNTERTOPS -----
  countertops: [
    {
      finishLevel: "builder",
      label: "Laminate Countertops",
      description:
        "Post-form laminate countertops in a selection of colors and patterns. Budget-friendly and easy to maintain with seamless backsplash options. Ideal for practical everyday use.",
      imageUrl:
        "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Granite Countertops",
      description:
        "Natural granite slab countertops with polished edges and sealed finish. Each piece is unique with natural stone veining and coloring. Includes standard undermount sink cutout.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Quartz Countertops",
      description:
        "Engineered quartz surfaces with consistent patterning and superior stain resistance. Non-porous and maintenance-free with a wide palette of colors and finishes. Includes waterfall edge and integrated backsplash options.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Marble Slab Countertops",
      description:
        "Imported marble slabs with book-matched veining for a dramatic, one-of-a-kind surface. Features mitered edges, full-height backsplashes, and professional-grade sealing. The timeless choice for a statement kitchen or bath.",
      imageUrl:
        "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400&h=300&fit=crop",
    },
  ],

  // ----- APPLIANCES -----
  appliances: [
    {
      finishLevel: "builder",
      label: "Standard Appliance Package",
      description:
        "Reliable name-brand appliances including range, dishwasher, microwave, and refrigerator in stainless or white finish. Energy Star rated for efficiency. Backed by standard manufacturer warranties.",
      imageUrl:
        "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Upgraded Appliance Suite",
      description:
        "Mid-range stainless steel appliance suite with gas range, French-door refrigerator, and quiet dishwasher. Includes convection oven and built-in microwave. Wi-Fi enabled for smart home integration.",
      imageUrl:
        "https://images.unsplash.com/photo-1556909114-ecbb6b72e6b4?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Professional Appliance Package",
      description:
        "Professional-grade appliances from brands like KitchenAid or Bosch. Includes 36-inch gas rangetop, wall oven, built-in refrigerator, and panel-ready dishwasher. Superior cooking performance with commercial-style aesthetics.",
      imageUrl:
        "https://images.unsplash.com/photo-1556909172-bd5315ff1569?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Chef's Dream Appliance Suite",
      description:
        "Top-tier appliances from Sub-Zero, Wolf, and Miele. Features a 48-inch dual-fuel range, integrated column refrigeration, steam oven, and warming drawer. Panel-integrated with custom cabinetry for a seamless look.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop",
    },
  ],

  // ----- FLOORING -----
  flooring: [
    {
      finishLevel: "builder",
      label: "Luxury Vinyl Plank (LVP)",
      description:
        "Waterproof luxury vinyl plank flooring with realistic wood-grain textures. Scratch-resistant and easy to clean, perfect for high-traffic areas. Click-lock installation in a range of on-trend colors.",
      imageUrl:
        "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Engineered Hardwood",
      description:
        "Multi-layer engineered hardwood with a genuine wood veneer top. Available in oak, hickory, and walnut species with matte or satin finishes. Dimensionally stable and suitable for Florida's humidity.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Solid Hardwood",
      description:
        "3/4-inch solid hardwood flooring in select-grade planks. Hand-scraped or wire-brushed textures add character and depth. Site-finished with multiple coats of commercial-grade polyurethane for lasting beauty.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Wide-Plank European Oak",
      description:
        "Premium 8-inch wide European white oak planks with custom stain matching. Features fumed or lime-washed finishes for a distinctly refined look. Installed with precision over a premium sound-dampening underlayment.",
      imageUrl:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop",
    },
  ],

  // ----- LIGHTING -----
  lighting: [
    {
      finishLevel: "builder",
      label: "Standard LED Fixtures",
      description:
        "Builder-grade LED recessed cans and basic flush-mount fixtures. Energy-efficient with warm white light output. Includes standard toggle switches and cover plates throughout.",
      imageUrl:
        "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Decorative Fixture Package",
      description:
        "Curated selection of pendant lights, semi-flush mounts, and wall sconces in brushed nickel or matte black. Includes dimmer switches in living spaces and under-cabinet LED strips in the kitchen.",
      imageUrl:
        "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Designer Lighting Collection",
      description:
        "Statement chandeliers, linear pendants, and architectural sconces from designer brands. Full smart dimming system with programmable scenes. Includes landscape lighting design for curb appeal.",
      imageUrl:
        "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Artisan Lighting",
      description:
        "Hand-blown glass pendants, custom metalwork chandeliers, and integrated cove lighting designed by a lighting architect. Includes a whole-home Lutron automation system with keypad controls and circadian rhythm programming.",
      imageUrl:
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=300&fit=crop",
    },
  ],

  // ----- PLUMBING -----
  plumbing: [
    {
      finishLevel: "builder",
      label: "Standard Chrome Fixtures",
      description:
        "Polished chrome faucets and valves from trusted manufacturers like Moen or Delta. Single-handle operation with ceramic disc cartridges. Includes standard supply lines and drain assemblies.",
      imageUrl:
        "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Brushed Nickel Fixtures",
      description:
        "Brushed nickel faucets with pull-down sprayers and widespread lavatory sets. Includes pressure-balanced shower valves and a dual-flush toilet. Clean lines with fingerprint-resistant finishes.",
      imageUrl:
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Thermostatic Shower Systems",
      description:
        "Thermostatic valve systems with rain shower heads, hand showers, and body sprays. Wall-mounted faucets in matte black or polished nickel. Includes comfort-height toilets with bidet functionality.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566752584-e8c4eb4f7e44?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Spa-Grade Plumbing Suite",
      description:
        "Kohler or Waterworks fixtures with digital temperature control and custom valve trims in unlacquered brass or champagne gold. Steam shower system, soaking tub filler, and hands-free sensor faucets throughout.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
    },
  ],

  // ----- FIXTURES -----
  fixtures: [
    {
      finishLevel: "builder",
      label: "Standard Porcelain Fixtures",
      description:
        "White porcelain pedestal sink or vanity-top basin with a fiberglass tub/shower combo. Framed mirror and basic bath accessories. Functional and clean with traditional styling.",
      imageUrl:
        "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Vanity & Tile Shower",
      description:
        "Furniture-style vanity with an undermount ceramic sink and stone top. Tiled shower surround with glass door and built-in niche. Frameless mirror with integrated LED backlighting.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566752447-f4e219bfc648?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Freestanding Tub & Custom Shower",
      description:
        "Freestanding soaking tub with floor-mounted filler and curbless tiled shower with linear drain. Custom double vanity with quartz top and undermount sinks. Heated towel bars and fog-free mirrors.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Resort-Style Bath Suite",
      description:
        "Japanese soaking tub or sculpted stone vessel, zero-entry steam shower with body jets and chromotherapy lighting. Floating vanities with vessel sinks in natural stone. Radiant floor heating and integrated sound system.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
    },
  ],

  // ----- PAINT -----
  paint: [
    {
      finishLevel: "builder",
      label: "Flat Latex Interior Paint",
      description:
        "Contractor-grade flat latex paint in builder white or light neutral. Two coats on walls with semi-gloss on trim and doors. Basic prep and standard coverage throughout.",
      imageUrl:
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Eggshell Designer Colors",
      description:
        "Premium eggshell-finish paint with designer color consultation. Includes accent walls and two-tone schemes. Low-VOC formula with superior washability and coverage.",
      imageUrl:
        "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Benjamin Moore Advance",
      description:
        "Benjamin Moore Advance or Sherwin-Williams Emerald in a curated whole-home palette. Includes specialty finishes on accent features, detailed trim work, and ceiling treatment. Professional color matching to your design scheme.",
      imageUrl:
        "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Venetian Plaster & Specialty Finishes",
      description:
        "Hand-applied Venetian plaster, lime wash, or Portola Paint in signature rooms. Metallic and suede accent treatments with custom murals or wallcoverings. Artisan-level finishes that transform walls into works of art.",
      imageUrl:
        "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=400&h=300&fit=crop",
    },
  ],

  // ----- WINDOWS -----
  windows: [
    {
      finishLevel: "builder",
      label: "Single-Hung Vinyl Windows",
      description:
        "Energy Star rated single-hung vinyl windows with standard grille patterns. Double-pane insulated glass with basic weatherstripping. Meets Florida building code for wind resistance.",
      imageUrl:
        "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Impact-Rated Vinyl Windows",
      description:
        "Impact-rated vinyl windows with laminated glass meeting Miami-Dade protocols. Casement and awning styles with multi-point locking hardware. Low-E coating for UV protection and energy savings.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Impact Aluminum-Clad Windows",
      description:
        "Hurricane-rated aluminum-clad wood windows with custom color exteriors. Triple-pane glass option with argon fill for superior insulation. Includes architectural shapes and transom configurations.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Full-Wall Window Systems",
      description:
        "Floor-to-ceiling impact-rated window walls and multi-slide pocket doors. Thermally broken steel or slim-profile aluminum frames for maximum glass area. Automated shading systems with motorized blinds integrated into the frame.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
  ],

  // ----- ROOFING -----
  roofing: [
    {
      finishLevel: "builder",
      label: "Architectural Shingles",
      description:
        "30-year architectural asphalt shingles in popular colors. Algae-resistant and wind-rated to 130 mph. Includes synthetic underlayment and standard ridge ventilation.",
      imageUrl:
        "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Premium Dimensional Shingles",
      description:
        "50-year premium dimensional shingles with enhanced wind and impact ratings. Deeper shadow lines for a more dramatic roof profile. Includes ice and water shield at all penetrations and valleys.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Standing Seam Metal Roof",
      description:
        "26-gauge standing seam metal roof with concealed fasteners and factory-applied Kynar finish. 40-year warranty with superior wind uplift resistance. Energy-efficient reflective coating reduces cooling costs significantly.",
      imageUrl:
        "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Concrete or Clay Tile Roof",
      description:
        "Premium concrete barrel tiles or hand-made clay tiles in custom colors. Hurricane-rated with foam-adhesion installation system. Lifetime material warranty with the classic Florida Mediterranean aesthetic.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
  ],

  // ----- SIDING -----
  siding: [
    {
      finishLevel: "builder",
      label: "Vinyl Siding",
      description:
        "Low-maintenance vinyl siding in a range of neutral colors. Fade-resistant and easy to clean with standard trim and soffit. Provides a clean finished look with minimal upkeep.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Fiber Cement Siding",
      description:
        "James Hardie fiber cement lap siding with ColorPlus factory finish. Termite-proof and fire-resistant, ideal for Florida's climate. 15-year color and 30-year substrate warranty.",
      imageUrl:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Stucco with Accent Stone",
      description:
        "Three-coat stucco system with elastomeric finish coat in custom colors. Includes natural or manufactured stone accent areas on entry and key facades. Crack-resistant with integrated moisture barrier.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Natural Stone & Cedar",
      description:
        "Full natural stone veneer, tongue-and-groove cedar, or custom stucco artistry. Mixed-material facades designed by an architect for visual drama. Includes specialty trim, corbels, and custom entry surrounds.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
  ],

  // ----- LANDSCAPING -----
  landscaping: [
    {
      finishLevel: "builder",
      label: "Basic Sod & Shrubs",
      description:
        "St. Augustine sod front and back with foundation plantings and basic mulch beds. Includes a simple irrigation system with timer. Meets HOA and municipal landscaping requirements.",
      imageUrl:
        "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Designed Landscape Package",
      description:
        "Professional landscape design with native Florida plantings, decorative borders, and accent lighting. Drip irrigation zones with rain sensor. Includes paver walkway from driveway to front entry.",
      imageUrl:
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Tropical Resort Landscape",
      description:
        "Lush tropical plantings with specimen palms, flowering trees, and a curated garden design. Full outdoor lighting package with path lights, uplights, and moon lighting. Paver patio, fire pit area, and screen-enclosed pool deck landscaping.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Estate Grounds Design",
      description:
        "Landscape architect-designed grounds with mature specimen trees, water features, and sculptural elements. Automated smart irrigation with soil moisture sensors. Includes outdoor kitchen hardscape, pergola structures, and resort-style pool surround.",
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
  ],
};

// -------------------------------------------
// Helpers
// -------------------------------------------

/**
 * Get the selection options for a specific category.
 * Returns empty array if category has no options defined.
 */
export function getOptionsForCategory(category: string): SelectionOption[] {
  return SELECTION_OPTIONS[category] ?? [];
}

/**
 * Get a specific option by category and finish level.
 * Returns undefined if not found.
 */
export function getOption(
  category: string,
  finishLevel: FinishLevel
): SelectionOption | undefined {
  return SELECTION_OPTIONS[category]?.find(
    (opt) => opt.finishLevel === finishLevel
  );
}

/**
 * Get all categories referenced across all room templates (deduplicated).
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  for (const room of ROOM_TEMPLATES) {
    for (const cat of room.categories) {
      categories.add(cat);
    }
  }
  return Array.from(categories);
}

/**
 * Build default room list for a given home configuration.
 * Expands rooms with defaultCount > 1 into individual entries.
 * Example: guest_bedroom with defaultCount=3 becomes
 * "Guest Bedroom 1", "Guest Bedroom 2", "Guest Bedroom 3".
 */
export function buildDefaultRoomList(
  overrides?: Partial<Record<string, number>>
): Array<{ roomId: string; displayName: string; templateId: string }> {
  const rooms: Array<{
    roomId: string;
    displayName: string;
    templateId: string;
  }> = [];

  for (const template of ROOM_TEMPLATES) {
    const count = overrides?.[template.id] ?? template.defaultCount;
    if (count <= 0) continue;

    if (count === 1) {
      rooms.push({
        roomId: template.id,
        displayName: template.displayName,
        templateId: template.id,
      });
    } else {
      for (let i = 1; i <= count; i++) {
        rooms.push({
          roomId: `${template.id}_${i}`,
          displayName: `${template.displayName} ${i}`,
          templateId: template.id,
        });
      }
    }
  }

  return rooms;
}
