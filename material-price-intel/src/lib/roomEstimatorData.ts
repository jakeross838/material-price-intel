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
  isUpgrade?: boolean;
  upgradeDescription?: string;
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
  // --- Core rooms ---
  {
    id: "kitchen",
    displayName: "Kitchen",
    icon: "ChefHat",
    defaultSqftPercent: 10,
    categories: ["cabinets", "countertops", "backsplash", "appliances", "flooring", "lighting", "hardware", "plumbing", "fixtures", "tile", "paint", "trim", "baseboard", "doors", "windows", "ceiling", "electrical", "drywall"],
    defaultCount: 1,
  },
  {
    id: "master_bedroom",
    displayName: "Master Bedroom",
    icon: "Bed",
    defaultSqftPercent: 12,
    categories: ["flooring", "lighting", "paint", "closets", "ceiling", "trim", "baseboard", "doors", "windows", "hardware", "electrical", "drywall", "smart_home", "hvac"],
    defaultCount: 1,
  },
  {
    id: "master_bath",
    displayName: "Master Bath",
    icon: "Bath",
    defaultSqftPercent: 5,
    categories: ["plumbing", "fixtures", "tile", "flooring", "lighting", "hardware", "toilets", "shower_enclosure", "vanity", "paint", "trim", "baseboard", "doors", "ceiling", "electrical", "windows"],
    defaultCount: 1,
  },
  {
    id: "guest_bedroom",
    displayName: "Guest Bedroom",
    icon: "BedDouble",
    defaultSqftPercent: 8,
    categories: ["flooring", "lighting", "paint", "closets", "doors", "trim", "baseboard", "windows", "hardware", "ceiling", "electrical", "drywall"],
    defaultCount: 3,
  },
  {
    id: "guest_bath",
    displayName: "Guest Bath",
    icon: "ShowerHead",
    defaultSqftPercent: 2,
    categories: ["plumbing", "fixtures", "tile", "flooring", "hardware", "toilets", "shower_enclosure", "vanity", "paint", "trim", "baseboard", "doors", "lighting"],
    defaultCount: 2,
  },
  {
    id: "great_room",
    displayName: "Great Room",
    icon: "Sofa",
    defaultSqftPercent: 18,
    categories: ["flooring", "lighting", "windows", "paint", "fireplace", "ceiling", "trim", "baseboard", "doors", "hardware", "electrical", "drywall", "insulation", "smart_home", "hvac"],
    defaultCount: 1,
  },
  {
    id: "dining_room",
    displayName: "Dining Room",
    icon: "UtensilsCrossed",
    defaultSqftPercent: 6,
    categories: ["flooring", "lighting", "paint", "ceiling", "trim", "baseboard", "windows", "doors", "hardware", "electrical", "drywall"],
    defaultCount: 1,
  },
  {
    id: "laundry",
    displayName: "Laundry",
    icon: "WashingMachine",
    defaultSqftPercent: 3,
    categories: ["cabinets", "countertops", "plumbing", "flooring", "lighting", "tile", "doors", "hardware", "electrical", "baseboard"],
    defaultCount: 1,
  },
  {
    id: "garage",
    displayName: "Garage",
    icon: "Car",
    defaultSqftPercent: 10,
    categories: ["flooring", "paint", "garage_door", "lighting", "electrical", "doors", "drywall", "smart_home"],
    defaultCount: 1,
  },
  {
    id: "exterior",
    displayName: "Exterior & Structure",
    icon: "Home",
    defaultSqftPercent: 8,
    categories: ["roofing", "windows", "siding", "front_door", "driveway", "landscaping", "smart_home", "exterior_paint", "structural_framing", "foundation", "insulation", "electrical", "hvac", "outdoor_lighting"],
    defaultCount: 1,
  },
  // --- Upgrade rooms ---
  {
    id: "pool_bath",
    displayName: "Pool Bath",
    icon: "ShowerHead",
    defaultSqftPercent: 2,
    categories: ["plumbing", "fixtures", "tile", "flooring", "hardware", "toilets", "shower_enclosure", "vanity", "paint", "lighting", "doors"],
    defaultCount: 1,
    isUpgrade: true,
    upgradeDescription: "Dedicated bathroom for the pool area",
  },
  {
    id: "media_room",
    displayName: "Media Room",
    icon: "Tv",
    defaultSqftPercent: 6,
    categories: ["flooring", "lighting", "paint", "ceiling", "trim", "baseboard", "doors", "windows", "hardware", "electrical", "drywall", "smart_home"],
    defaultCount: 1,
    isUpgrade: true,
    upgradeDescription: "Home theater & entertainment space",
  },
  {
    id: "wine_cellar",
    displayName: "Wine Cellar",
    icon: "Wine",
    defaultSqftPercent: 2,
    categories: ["flooring", "lighting", "paint", "doors", "ceiling", "trim", "baseboard", "hardware", "electrical", "hvac"],
    defaultCount: 1,
    isUpgrade: true,
    upgradeDescription: "Climate-controlled wine storage",
  },
  {
    id: "spa_room",
    displayName: "Spa / Wellness",
    icon: "Sparkles",
    defaultSqftPercent: 4,
    categories: ["plumbing", "fixtures", "tile", "flooring", "lighting", "hardware", "paint", "ceiling", "doors", "electrical", "hvac", "smart_home"],
    defaultCount: 1,
    isUpgrade: true,
    upgradeDescription: "Steam room, sauna, or wellness suite",
  },
  {
    id: "home_gym",
    displayName: "Home Gym",
    icon: "Dumbbell",
    defaultSqftPercent: 5,
    categories: ["flooring", "lighting", "paint", "ceiling", "doors", "windows", "electrical", "hvac", "drywall", "smart_home"],
    defaultCount: 1,
    isUpgrade: true,
    upgradeDescription: "Dedicated fitness & exercise room",
  },
  {
    id: "outdoor_kitchen",
    displayName: "Outdoor Kitchen",
    icon: "Flame",
    defaultSqftPercent: 3,
    categories: ["cabinets", "countertops", "appliances", "plumbing", "flooring", "lighting", "electrical", "outdoor_lighting", "hardware", "landscaping"],
    defaultCount: 1,
    isUpgrade: true,
    upgradeDescription: "Full outdoor cooking & dining area",
  },
  {
    id: "pool",
    displayName: "Swimming Pool",
    icon: "Waves",
    defaultSqftPercent: 5,
    categories: ["pool", "landscaping", "lighting", "outdoor_lighting", "electrical", "plumbing"],
    defaultCount: 1,
    isUpgrade: true,
    upgradeDescription: "In-ground pool with equipment",
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
        "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Professional Appliance Package",
      description:
        "Professional-grade appliances from brands like KitchenAid or Bosch. Includes 36-inch gas rangetop, wall oven, built-in refrigerator, and panel-ready dishwasher. Superior cooking performance with commercial-style aesthetics.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=300&fit=crop",
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
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=300&fit=crop",
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

  // ----- BACKSPLASH -----
  backsplash: [
    {
      finishLevel: "builder",
      label: "Ceramic Subway Tile",
      description:
        "Classic 3x6 ceramic subway tile in white or neutral tones. Clean, timeless look with standard grout lines. Easy to maintain and pairs well with any countertop material.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Glass Mosaic Tile",
      description:
        "Glass mosaic backsplash with a blend of colors and textures. Adds depth and shimmer to the kitchen with light-catching surfaces. Available in herringbone, stacked, or traditional patterns.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Natural Stone Backsplash",
      description:
        "Honed marble, travertine, or slate backsplash with natural veining and texture. Available in full-height slab or patterned tile layouts. Sealed for durability with a sophisticated organic look.",
      imageUrl:
        "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Artisan Backsplash",
      description:
        "Hand-crafted zellige tiles, book-matched marble slabs, or bespoke metallic mosaic designs. Each piece is individually placed for a one-of-a-kind statement wall. Includes integrated lighting behind translucent materials.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
    },
  ],

  // ----- HARDWARE -----
  hardware: [
    {
      finishLevel: "builder",
      label: "Basic Chrome Pulls",
      description:
        "Simple chrome bar pulls and knobs in standard sizes. Durable plated finish that resists tarnishing. Functional and clean with universal mounting patterns for easy installation.",
      imageUrl:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Brushed Nickel Hardware",
      description:
        "Coordinated brushed nickel cabinet pulls, knobs, and hinges. Fingerprint-resistant satin finish with solid zinc construction. Modern transitional style that complements most cabinet finishes.",
      imageUrl:
        "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Matte Black Designer Hardware",
      description:
        "Matte black or champagne bronze pulls in architectural profiles. Solid brass or stainless steel construction with premium weight and feel. Includes matching appliance pulls and specialty cabinet hardware.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Artisan Hardware",
      description:
        "Hand-forged or custom-cast hardware in unlacquered brass, oil-rubbed bronze, or burnished copper. Each piece develops a unique patina over time. Includes leather-wrapped pulls, crystal knobs, and integrated finger pulls.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
    },
  ],

  // ----- TILE (Bathroom) -----
  tile: [
    {
      finishLevel: "builder",
      label: "Ceramic Wall & Floor Tile",
      description:
        "Standard ceramic tile in 12x12 or 12x24 format for shower walls and bathroom floors. Clean white or neutral options with basic bullnose trim. Includes standard shower niche and simple grout patterns.",
      imageUrl:
        "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Porcelain Tile Package",
      description:
        "Large-format porcelain tiles with realistic stone or wood-look patterns. Includes accent border tiles and coordinating floor and wall designs. Features a tiled shower niche with decorative liner and minimal grout lines.",
      imageUrl:
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Natural Stone Tile",
      description:
        "Marble, travertine, or slate tile with custom patterns and layouts. Floor-to-ceiling shower tile with linear drain and curbless entry option. Heated tile floors with multiple accent features and decorative inlays.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Mosaic & Slab Tile",
      description:
        "Book-matched marble slabs, hand-cut mosaics, or artisan-crafted tile murals. Waterjet-cut geometric patterns with precious stone inlays. Includes radiant floor heating, steam shower tile work, and bespoke niche designs with integrated lighting.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566752584-e8c4eb4f7e44?w=400&h=300&fit=crop",
    },
  ],

  // ----- TRIM & MOLDING -----
  trim: [
    {
      finishLevel: "builder",
      label: "MDF Colonial Trim",
      description:
        "Pre-primed MDF baseboards (3.25-inch) and colonial door casings. Clean paint-grade finish with simple profiles. Standard throughout all rooms with basic corner blocking.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Craftsman Style Trim",
      description:
        "5.25-inch baseboards with matching craftsman-style door and window casings. Includes chair rail in dining areas and wainscoting in bathrooms. Poplar or pine with a smooth painted finish throughout.",
      imageUrl:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Crown Molding Package",
      description:
        "Full crown molding throughout with 7-inch baseboards and layered casing profiles. Includes wainscoting, picture rail, and window sills in select rooms. Hardwood trim with detailed paint or stain finishing.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Millwork Package",
      description:
        "Hand-milled profiles, applied wall moldings, and architectural panel systems. Includes library-style built-ins, arched doorway casings, and custom rosettes at every intersection. Master-crafted from select hardwoods with museum-quality finishing.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
  ],

  // ----- INTERIOR DOORS -----
  doors: [
    {
      finishLevel: "builder",
      label: "Hollow-Core Panel Doors",
      description:
        "6-panel hollow-core interior doors in pre-hung frames. Lightweight and cost-effective with standard passage knobs. Pre-primed and ready for a coat of white paint. Available in standard 6'8\" height.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Solid-Core Shaker Doors",
      description:
        "Solid-core doors in clean Shaker or 2-panel contemporary profiles. Superior sound dampening and solid feel. Includes satin nickel lever-style handles and adjustable hinges. Available in 7'0\" or 8'0\" heights.",
      imageUrl:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Solid Wood Panel Doors",
      description:
        "True solid wood doors in alder, maple, or mahogany with raised or flat panel designs. Includes barn door hardware for select openings and pocket doors where space is tight. Premium matte black or brass hardware throughout.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Architectural Doors",
      description:
        "Hand-crafted doors with glass inserts, iron detailing, or reclaimed wood panels. Includes oversized 10-foot pivot doors, hidden pocket doors, and custom arched openings. Each door is individually designed to complement the architectural style of the home.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
  ],

  // ----- CLOSET SYSTEMS -----
  closets: [
    {
      finishLevel: "builder",
      label: "Wire Shelf System",
      description:
        "Ventilated wire shelving with a single hang rod and top shelf. Chrome-plated steel for durability with standard wall-mount brackets. Functional and easy to reconfigure as needs change.",
      imageUrl:
        "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Laminate Closet Organizer",
      description:
        "Modular laminate closet system with double and single hang sections, built-in drawers, and adjustable shelving. Clean white or espresso finish with soft-close drawer glides. Designed for walk-in or reach-in closets.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Wood Built-In Closet",
      description:
        "Custom-built closet system in painted or stained wood with premium hardware. Features include pull-out valet rods, jewelry drawers, shoe cubbies, and integrated LED strip lighting. Designed specifically for your wardrobe and space.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Boutique Dressing Room",
      description:
        "Full boutique-style closet with island seating, lighted display cases, and floor-to-ceiling cabinetry in exotic woods. Includes automated garment carousels, climate-controlled sections for furs and leather, and a built-in vanity with Hollywood lighting.",
      imageUrl:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop",
    },
  ],

  // ----- FIREPLACE -----
  fireplace: [
    {
      finishLevel: "builder",
      label: "Electric Fireplace Insert",
      description:
        "Linear electric fireplace insert with realistic flame effects and adjustable heat output. Simple wall-mount or recessed installation with standard drywall surround. Remote-controlled with multiple flame color options.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Direct-Vent Gas Fireplace",
      description:
        "Direct-vent gas fireplace with ceramic log set and adjustable flame. Includes simple stone or tile surround with painted wood mantel. Energy-efficient sealed combustion with remote control and thermostat.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Linear Gas Fireplace",
      description:
        "Wide-format linear gas fireplace with crushed glass or river rock media bed. Floor-to-ceiling natural stone surround with floating wood beam mantel. Smart home integrated with app control and ambient lighting.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Masonry Fireplace",
      description:
        "Full masonry fireplace with hand-laid stone or custom-designed metal surround. Includes Rumford-style firebox for open-burning, custom iron doors, and reclaimed barn beam mantel. May include see-through design connecting two rooms or an outdoor extension.",
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
  ],

  // ----- GARAGE DOOR -----
  garage_door: [
    {
      finishLevel: "builder",
      label: "Steel Raised-Panel Door",
      description:
        "Single-layer steel garage door with raised panel design in white or almond. Standard torsion spring system with basic chain-drive opener. Meets wind code requirements for the region.",
      imageUrl:
        "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Insulated Steel Door",
      description:
        "Double-layer insulated steel garage door with woodgrain embossed finish. R-12 insulation value for climate control and noise reduction. Includes belt-drive opener with smart home connectivity and LED lighting.",
      imageUrl:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Carriage House Style Door",
      description:
        "Premium carriage house design with decorative hardware and window inserts. Triple-layer construction with R-18 insulation in faux wood or textured steel. Includes battery backup opener and MyQ smart technology.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Wood Garage Door",
      description:
        "Real wood carriage doors in cedar, mahogany, or reclaimed barn wood. Custom glass panel designs with architectural detailing to match the home. Includes fully concealed jackshaft opener and integrated lighting with smart home automation.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
  ],

  // ----- DRIVEWAY -----
  driveway: [
    {
      finishLevel: "builder",
      label: "Brushed Concrete Driveway",
      description:
        "Standard 4-inch reinforced concrete with broom finish. Includes expansion joints and proper drainage slope. Clean, durable surface that meets all code requirements for residential driveways.",
      imageUrl:
        "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Stamped Concrete Driveway",
      description:
        "Stamped and colored concrete with patterns mimicking stone, brick, or slate. Integral color with surface-applied release agent for depth. Sealed finish for enhanced color retention and stain resistance.",
      imageUrl:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Paver Driveway",
      description:
        "Interlocking concrete pavers or natural stone pavers in herringbone or running bond pattern. Includes proper base preparation with compacted aggregate and polymeric sand joints. Available in endless color and pattern combinations.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Stone Motor Court",
      description:
        "Full-depth natural stone, imported European pavers, or custom-designed motor court with decorative borders and medallions. Includes heated driveway option, LED border lighting, and integrated drainage systems. Designed by a landscape architect for maximum curb appeal.",
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
  ],

  // ----- FRONT/ENTRY DOOR -----
  front_door: [
    {
      finishLevel: "builder",
      label: "Fiberglass Entry Door",
      description:
        "Smooth or textured fiberglass entry door with standard sidelite. Pre-finished in white or common colors with basic deadbolt and lever handle. Energy-efficient with insulated core and weatherstripping.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Decorative Glass Entry Door",
      description:
        "Fiberglass or steel entry door with decorative glass inserts and matching sidelites. Wood-grain texture with gel-stained finish for a natural look. Includes smart lock with keypad and app control.",
      imageUrl:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Solid Wood Entry Door",
      description:
        "Solid mahogany or knotty alder entry door with hand-applied stain finish. Includes wrought iron or leaded glass details with full surround sidelites and transom. Multi-point locking system with premium oil-rubbed bronze hardware.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Pivot Entry Door",
      description:
        "Oversized pivot entry door in solid wood, bronze-clad, or steel with custom glass art panels. Engineered pivot hinge system supports doors up to 12 feet tall and 500+ lbs. Each door is a commissioned architectural statement piece designed to match your home.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
  ],

  // ----- CEILING TREATMENTS -----
  ceiling: [
    {
      finishLevel: "builder",
      label: "Flat Painted Ceiling",
      description:
        "Standard flat-white painted ceiling at 9-foot height. Smooth drywall finish with basic flush-mount lighting provisions. Clean and bright with standard knockdown texture option available.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Tray Ceiling",
      description:
        "Tray ceiling with recessed center and perimeter crown molding. Includes rope lighting in the tray for ambient uplighting effect. Accent paint color in the recessed area for added visual depth. 10-foot ceiling height in main living areas.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Coffered Ceiling",
      description:
        "Full coffered ceiling with detailed beam work and recessed panels. Painted in coordinating colors with integrated LED lighting in each coffer. Adds architectural gravitas to great rooms, dining rooms, and master bedrooms.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Beam & Vault Ceiling",
      description:
        "Hand-hewn reclaimed wood beams, barrel-vaulted plaster, or tongue-and-groove planked ceilings at dramatic heights. May include hand-painted murals, gold-leaf accents, or artisan plaster textures. Each ceiling is a unique architectural feature of the home.",
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
  ],

  // ----- SMART HOME -----
  smart_home: [
    {
      finishLevel: "builder",
      label: "Smart Thermostat & Locks",
      description:
        "Smart thermostat (Nest or Ecobee), smart deadbolt on the front door, and pre-wired CAT6 to main living areas. Basic Wi-Fi coverage with a single router. Ready for future expansion with smart-home-compatible wiring.",
      imageUrl:
        "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Connected Home Package",
      description:
        "Whole-home smart system including thermostat, door locks, video doorbell, and smart garage door. Mesh Wi-Fi for complete coverage. Smart switches and dimmers in main living areas with voice assistant integration (Alexa/Google).",
      imageUrl:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Full Smart Home System",
      description:
        "Comprehensive Control4 or Savant system with touchscreen panels, whole-home audio, motorized shades, and smart lighting scenes. Includes security cameras, motion sensors, and professional monitoring. Enterprise-grade networking with dedicated access points per zone.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Integrated Home Automation",
      description:
        "Crestron or Savant whole-home automation with custom programming, dedicated equipment rack, and 24/7 remote support. Includes circadian lighting, climate zoning, motorized everything (shades, mirrors, TV lifts), and biometric entry. Full home theater with Dolby Atmos and 4K laser projection.",
      imageUrl:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop",
    },
  ],

  // ----- TOILETS -----
  toilets: [
    {
      finishLevel: "builder",
      label: "Standard Elongated Toilet",
      description:
        "ADA-height elongated bowl toilet with standard flush mechanism. Chrome trip lever with durable vitreous china construction. Reliable 1.6 GPF single-flush with basic slow-close seat.",
      imageUrl:
        "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Comfort Height Toilet",
      description:
        "Comfort-height elongated toilet with dual-flush technology (1.1/1.6 GPF). Skirted trapway for easy cleaning and modern look. Includes soft-close seat with quick-release hinges.",
      imageUrl:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "One-Piece with Bidet Seat",
      description:
        "Sleek one-piece toilet with integrated bidet seat featuring heated water, adjustable spray, and warm air dryer. Low-profile design with concealed trapway. Includes night light and deodorizer.",
      imageUrl:
        "https://images.unsplash.com/photo-1564540586988-aa4e53ab3394?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Smart Toilet",
      description:
        "TOTO Neorest or Kohler Veil intelligent toilet with auto open/close lid, heated seat, UV sanitization, and hands-free flush. Integrated bidet with oscillating and pulsating wash modes. Self-cleaning with electrolyzed water technology.",
      imageUrl:
        "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    },
  ],

  // ----- BASEBOARDS -----
  baseboard: [
    {
      finishLevel: "builder",
      label: "MDF Baseboard 3.25\"",
      description:
        "Pre-primed MDF baseboard in standard 3.25-inch height with simple rounded profile. Paint-grade material that installs quickly with brad nails. Clean, functional finish for every room.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Pine Baseboard 5.25\"",
      description:
        "Solid pine baseboard at 5.25-inch height with classic ogee or colonial profile. Stain or paint-grade with smooth finish. Includes coordinating shoe molding at the floor line.",
      imageUrl:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Hardwood Baseboard 7\"",
      description:
        "Select hardwood baseboard in oak, maple, or poplar at 7-inch height with stepped or layered profile detail. Site-finished to match door casing and crown molding for a unified millwork package.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Millwork Baseboard",
      description:
        "Hand-milled baseboard with multi-piece built-up profiles reaching 9+ inches. Features integrated cable management channels and custom router-cut details. Each profile is designed to match the architectural period of the home.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
  ],

  // ----- STRUCTURAL FRAMING -----
  structural_framing: [
    {
      finishLevel: "builder",
      label: "Wood Stick Frame",
      description:
        "Conventional 2x4 or 2x6 wood stick framing with standard spacing. Engineered trusses for the roof system. Meets all Florida building code requirements for wind resistance and structural loads.",
      imageUrl:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Engineered Wood Frame",
      description:
        "Engineered lumber (LVL beams, I-joists, LSL headers) combined with advanced wood framing techniques. Reduced thermal bridging with better insulation performance. Straighter walls and fewer callbacks.",
      imageUrl:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "CMU Block Construction",
      description:
        "Concrete masonry unit (CMU) block walls with reinforced concrete fill and rebar. Superior wind and impact resistance ideal for Florida hurricane zones. Excellent thermal mass and sound dampening properties.",
      imageUrl:
        "https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Steel & ICF Hybrid",
      description:
        "Insulated Concrete Form (ICF) walls with structural steel beams for long spans and open floor plans. Highest wind and flood resistance available. Superior energy efficiency with continuous insulation and virtually airtight construction.",
      imageUrl:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
    },
  ],

  // ----- FOUNDATION -----
  foundation: [
    {
      finishLevel: "builder",
      label: "Monolithic Slab",
      description:
        "Standard monolithic slab-on-grade foundation with thickened edges and wire mesh reinforcement. 4-inch concrete over vapor barrier with standard compaction. Meets code for most residential applications.",
      imageUrl:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Stem Wall Foundation",
      description:
        "Stem wall foundation with separate footing and slab pour. Elevated above grade for better moisture protection and ventilation. Includes termite pre-treatment and moisture barrier with French drain system.",
      imageUrl:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Deep Pilings",
      description:
        "Driven or augured concrete pilings reaching stable soil or bedrock. Required for waterfront, elevated, or challenging soil conditions. Includes grade beams and engineered pile cap connections for superior structural support.",
      imageUrl:
        "https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Post-Tension Slab",
      description:
        "Post-tensioned concrete slab with high-strength steel tendons for crack-free performance on expansive or variable soils. Allows thinner slabs with longer spans. Premium waterproofing membrane and under-slab insulation for maximum durability.",
      imageUrl:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
    },
  ],

  // ----- EXTERIOR PAINT -----
  exterior_paint: [
    {
      finishLevel: "builder",
      label: "Basic Latex Exterior",
      description:
        "100% acrylic latex exterior paint in standard body and trim colors. Two coats over primer with basic prep and caulking. 10-year warranty with fade-resistant formula for Florida sun.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Premium Acrylic Exterior",
      description:
        "Sherwin-Williams Duration or Benjamin Moore Aura exterior with advanced color technology. Full prep including power washing, scraping, and priming. Three-color scheme with accent trim and architectural detail highlighting.",
      imageUrl:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Elastomeric Coating",
      description:
        "High-build elastomeric coating that bridges hairline cracks and expands with the substrate. Superior waterproofing and UV protection with 20-year warranty. Ideal for stucco homes in Florida's harsh sun and rain conditions.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Lime Wash / Venetian Plaster",
      description:
        "Traditional lime wash or exterior Venetian plaster finish with depth and character that improves with age. Hand-applied by artisan plasterers for a unique, European-inspired aesthetic. Self-healing micro-cracks and breathable for superior moisture management.",
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
  ],

  // ----- SHOWER ENCLOSURE -----
  shower_enclosure: [
    {
      finishLevel: "builder",
      label: "Framed Glass Slider",
      description:
        "Aluminum-framed sliding glass shower door with clear tempered glass. Chrome finish on frame and handle hardware. Standard bypass design for tub/shower combos with towel bar handle.",
      imageUrl:
        "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Semi-Frameless Pivot Door",
      description:
        "Semi-frameless pivot or hinged glass shower door with minimal hardware. 3/8-inch clear tempered glass with brushed nickel or matte black frame accents. Clean modern look with easy-clean glass coating.",
      imageUrl:
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Frameless Glass Enclosure",
      description:
        "Full frameless shower enclosure with 1/2-inch clear tempered glass panels. Heavy-duty stainless steel hinges and clamps in matte black or brushed gold. Includes fixed panel, hinged door, and optional return panel.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Custom Steam Shower Glass",
      description:
        "Floor-to-ceiling frameless glass steam shower enclosure with transom panel for full height sealing. Includes integrated steam generator, aromatherapy port, and chromotherapy LED lighting. Low-iron ultra-clear glass with custom etching or frosted privacy zones.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
    },
  ],

  // ----- VANITY -----
  vanity: [
    {
      finishLevel: "builder",
      label: "Stock Vanity Cabinet",
      description:
        "Pre-assembled stock vanity in standard widths (30/36/48-inch) with laminate countertop and white ceramic sink. Basic chrome faucet included. Available in white, espresso, or gray finishes.",
      imageUrl:
        "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Furniture-Style Vanity",
      description:
        "Furniture-style vanity cabinet with soft-close drawers, stone top, and undermount ceramic sink. Available in single or double configurations. Coordinated brushed nickel or matte black hardware included.",
      imageUrl:
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Custom Built-In Vanity",
      description:
        "Custom-built vanity cabinetry designed to fit your exact space and storage needs. Quartz or marble top with undermount rectangular sinks. Features include pull-out organizers, built-in hamper, and integrated electrical outlets.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Floating Stone Vanity",
      description:
        "Wall-mounted floating vanity with integrated natural stone vessel basin carved from a single block. Custom exotic wood or lacquered finish with concealed drawer mechanisms. Includes wall-mounted faucet with separate hot/cold handles in unlacquered brass.",
      imageUrl:
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
    },
  ],

  // ----- OUTDOOR LIGHTING -----
  outdoor_lighting: [
    {
      finishLevel: "builder",
      label: "Basic Path & Porch Lights",
      description:
        "Solar-powered path lights along walkways and standard porch ceiling fixture. Motion-sensor flood lights at garage and rear entry. Basic security lighting coverage meeting code requirements.",
      imageUrl:
        "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Landscape Lighting Package",
      description:
        "Professional low-voltage LED landscape lighting with up-lights on specimen trees, path lights, and accent wash lighting on facade. Includes transformer and photocell timer. Designed for curb appeal and safety.",
      imageUrl:
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Full LED Lighting Design",
      description:
        "Comprehensive outdoor LED lighting design with color-temperature tuning, step lights, pool lighting, and hardscape integration. Includes smart controls with scheduling, dimming, and color scenes. Illuminated address markers and driveway bollards.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Architectural Lighting Design",
      description:
        "Custom-designed architectural lighting scheme by a lighting designer. Features include fiber-optic starfield effects, underwater pool lighting choreography, and facade grazing with hidden fixtures. Integrated with home automation for theatrical scene programming.",
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
  ],

  // ----- ELECTRICAL -----
  electrical: [
    {
      finishLevel: "builder",
      label: "Code Minimum Electrical",
      description:
        "Standard electrical service (200A panel) with code-minimum outlet and circuit layout. Basic toggle switches and white cover plates throughout. Includes standard smoke detectors and GFCI protection in wet areas.",
      imageUrl:
        "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Upgraded Electrical Package",
      description:
        "200A panel with dedicated circuits for kitchen, garage, and office. USB outlets in kitchen and bedrooms, decora-style switches throughout. Includes whole-home surge protector and pre-wired for EV charger in garage.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Smart Electrical System",
      description:
        "400A service with sub-panels for major zones. Smart switches and dimmers throughout with scene programming. Includes whole-home generator transfer switch, EV charger, and structured wiring for networking and A/V distribution.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Fully Automated Electrical",
      description:
        "Commercial-grade electrical system with redundant panels, battery backup (Tesla Powerwall or similar), and solar-ready inverter. Automated load management, occupancy-sensing outlets, and flush-mounted designer switches. Complete home automation wiring with dedicated equipment closet.",
      imageUrl:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop",
    },
  ],

  // ----- HVAC -----
  hvac: [
    {
      finishLevel: "builder",
      label: "Central Air Conditioning",
      description:
        "Standard 14 SEER central air conditioning with single-zone thermostat. Gas or electric furnace/air handler with basic ductwork. Programmable thermostat with standard filter system. Meets current energy code requirements.",
      imageUrl:
        "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Zoned HVAC System",
      description:
        "16 SEER high-efficiency system with two-zone damper control for upstairs/downstairs comfort. Smart thermostat with Wi-Fi and learning capabilities. Includes UV air purifier and upgraded MERV-13 filtration for improved indoor air quality.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Variable Speed Heat Pump",
      description:
        "20+ SEER variable-speed heat pump with inverter-driven compressor for precise temperature control. Multi-zone with individual room thermostats. Includes whole-home dehumidifier, HEPA filtration, and fresh air ventilation with energy recovery.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Geothermal / VRF System",
      description:
        "Geothermal ground-source heat pump or variable refrigerant flow (VRF) system for ultimate efficiency (30+ EER). Individual room control with concealed ceiling cassettes or ducted units. Virtually silent operation with 50%+ energy savings. Includes radiant floor heating in bathrooms and master bedroom.",
      imageUrl:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop",
    },
  ],

  // ----- INSULATION -----
  insulation: [
    {
      finishLevel: "builder",
      label: "Blown Fiberglass",
      description:
        "Blown-in fiberglass insulation in attic spaces and batt insulation in walls. Meets code-minimum R-values (R-30 attic, R-13 walls). Cost-effective thermal barrier with standard vapor retarder where required.",
      imageUrl:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Batt + Radiant Barrier",
      description:
        "High-density fiberglass batt insulation (R-19 walls, R-38 attic) with radiant barrier roof decking. Significantly reduces attic heat gain in Florida summers. Includes proper air sealing at penetrations and rim joists.",
      imageUrl:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Open-Cell Spray Foam",
      description:
        "Open-cell spray foam insulation throughout creating a complete air seal. R-3.7 per inch with excellent sound dampening. Creates a semi-conditioned attic space when applied to roof deck, protecting ductwork and reducing energy costs.",
      imageUrl:
        "https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Closed-Cell Spray Foam",
      description:
        "Closed-cell spray foam insulation (R-6.5 per inch) providing both air and vapor barrier in a single application. Adds structural rigidity to wall assemblies and qualifies for hurricane insurance discounts. Combined with continuous exterior insulation for a thermal-bridge-free building envelope.",
      imageUrl:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
    },
  ],

  // ----- DRYWALL -----
  drywall: [
    {
      finishLevel: "builder",
      label: "Standard Knockdown Texture",
      description:
        "1/2-inch regular drywall with standard knockdown texture finish. Level 3 finish on walls with basic taping, mudding, and sanding. Clean and consistent texture that hides minor imperfections.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Smooth Finish Drywall",
      description:
        "1/2-inch drywall with Level 4 smooth finish throughout. No texture — clean modern walls that look great with any paint finish. Includes moisture-resistant greenboard in wet areas and fire-rated Type X where required.",
      imageUrl:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Level 5 Premium Finish",
      description:
        "Level 5 drywall finish with skim coat over entire surface for perfectly flat walls. Required for glossy paint finishes and critical lighting conditions. Includes sound-dampening QuietRock in bedroom and media room walls.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Venetian Plaster Walls",
      description:
        "Hand-applied Venetian plaster or specialty wall finishes throughout main living areas. Multi-layer technique creates depth, movement, and a luminous quality unique to each wall. Includes moisture-resistant plaster systems in wet areas and sound-isolated wall assemblies in bedrooms.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
  ],

  // ----- SWIMMING POOL -----
  pool: [
    {
      finishLevel: "builder",
      label: "Fiberglass Pool",
      description:
        "Pre-formed fiberglass pool shell in standard shapes and sizes (12x24 to 16x32). Quick installation with smooth gel-coat finish. Includes basic pool pump, filter, and single-speed equipment. Standard safety fence and basic concrete deck.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Vinyl Liner Pool",
      description:
        "Custom-shaped vinyl liner pool with pattern selection and upgraded equipment. Variable-speed pump with cartridge filter for energy savings. Includes paver or stamped concrete deck, LED pool light, and automatic chlorinator.",
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Concrete Gunite Pool",
      description:
        "Custom-designed gunite/shotcrete pool with pebble or quartz aggregate finish. Includes spa/hot tub, water features (sheer descent or scuppers), and color-changing LED lighting. Salt chlorine generator with automation system for remote control.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Infinity Edge Resort Pool",
      description:
        "Architect-designed infinity edge or perimeter overflow pool with vanishing edge, built-in grotto, and swim-up bar. Glass tile finish with fire and water features. Full automation with app control, in-floor cleaning, and heated spa with spillover. Includes cabana and outdoor shower.",
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    },
  ],

  // ----- OUTDOOR KITCHEN EQUIPMENT -----
  outdoor_kitchen_equip: [
    {
      finishLevel: "builder",
      label: "Built-In Grill Station",
      description:
        "Stainless steel built-in gas grill (36-inch) on a simple masonry or stucco island. Includes side burner and basic storage cabinet. Granite or concrete countertop with standard electrical outlet.",
      imageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "standard",
      label: "Outdoor Island with Sink",
      description:
        "L-shaped outdoor kitchen island with built-in grill, sink with hot/cold water, and under-counter refrigerator. Tile or stone facade with granite countertops. Includes task lighting and overhead ventilation hood.",
      imageUrl:
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "premium",
      label: "Full Outdoor Kitchen",
      description:
        "Complete outdoor kitchen with 42-inch professional grill, smoker, pizza oven, sink, dishwasher, and beverage center. Custom cabinetry with marine-grade stainless steel. Includes bar seating, TV mount, and ceiling fan.",
      imageUrl:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    },
    {
      finishLevel: "luxury",
      label: "Resort-Style Outdoor Kitchen",
      description:
        "Magazine-worthy outdoor kitchen pavilion with Kalamazoo or Lynx professional-grade appliances. Includes teppanyaki grill, wood-fired pizza oven, rotisserie, wine cooler, and ice maker. Full outdoor dining room with custom lighting and sound system under a timber or aluminum pergola.",
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
 *
 * Upgrade rooms are excluded by default. Pass their IDs in
 * upgradeRoomIds to include them.
 */
export function buildDefaultRoomList(
  overrides?: Partial<Record<string, number>>,
  upgradeRoomIds?: string[]
): Array<{ roomId: string; displayName: string; templateId: string }> {
  const rooms: Array<{
    roomId: string;
    displayName: string;
    templateId: string;
  }> = [];

  for (const template of ROOM_TEMPLATES) {
    // Skip upgrade rooms unless explicitly included
    if (template.isUpgrade && !upgradeRoomIds?.includes(template.id)) continue;

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

/**
 * Get all upgrade room templates (rooms that can be toggled on/off).
 */
export function getUpgradeRoomTemplates(): RoomTemplate[] {
  return ROOM_TEMPLATES.filter((t) => t.isUpgrade);
}
