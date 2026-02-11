const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  "https://xgpjwpwhtfmbvoqtvete.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncGp3cHdodGZtYnZvcXR2ZXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDI3NjcsImV4cCI6MjA4NjIxODc2N30.Iixv6S3VGZF2VOuJ-gkUubm2JTbE9pCAvKQvLtTKnJ8"
);

async function seed() {
  // Auth
  const { error: authErr } = await sb.auth.signInWithPassword({
    email: "jake@rossbuilt.com",
    password: "password",
  });
  if (authErr) throw new Error("Auth failed: " + authErr.message);
  const { data: user } = await sb.auth.getUser();
  const { data: profile } = await sb
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.user.id)
    .single();
  const orgId = profile.organization_id;
  console.log("Authenticated. org_id:", orgId);

  // Load reference data
  const { data: materials } = await sb
    .from("materials")
    .select("id, canonical_name, category_id, material_categories(id, name)")
    .eq("is_active", true);
  const { data: suppliers } = await sb.from("suppliers").select("id, name");
  const { data: categories } = await sb
    .from("material_categories")
    .select("id, name");
  const { data: lineItems } = await sb
    .from("line_items")
    .select("id, raw_description, material_id, unit_price, effective_unit_price, quantity, unit, quote_id")
    .eq("line_type", "material")
    .not("material_id", "is", null);
  const { data: quotes } = await sb
    .from("quotes")
    .select("id, quote_number, supplier_id");

  // Helper to find material by partial name
  const findMat = (partial) =>
    materials.find((m) =>
      m.canonical_name.toLowerCase().includes(partial.toLowerCase())
    );
  const findSup = (partial) =>
    suppliers.find((s) =>
      s.name.toLowerCase().includes(partial.toLowerCase())
    );
  const findCat = (name) =>
    categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  const findLineItem = (matId) =>
    lineItems.find((li) => li.material_id === matId);
  const findQuote = (supId) =>
    quotes.find((q) => q.supplier_id === supId);

  // Clean up any existing test projects
  const { data: existing } = await sb.from("projects").select("id");
  for (const p of existing || []) {
    await sb.from("projects").delete().eq("id", p.id);
  }
  console.log("Cleaned up", (existing || []).length, "existing projects");

  // ============================================================
  // PROJECT 1: Lakewood Ranch Estate (in-progress, most data)
  // ============================================================
  const { data: proj1, error: p1Err } = await sb
    .from("projects")
    .insert({
      organization_id: orgId,
      name: "Lakewood Ranch Estate",
      address: "14520 Blue Bay Circle",
      city: "Lakewood Ranch",
      state: "FL",
      square_footage: 5800,
      client_name: "Michael & Sarah Thompson",
      client_email: "mthompson@gmail.com",
      client_phone: "(941) 555-0142",
      target_budget: 1250000,
      status: "in_progress",
      start_date: "2026-01-15",
      estimated_completion: "2026-08-30",
      notes:
        "Custom Mediterranean-style estate on lakefront lot. Client wants high-end finishes throughout. Pool and outdoor kitchen included.",
    })
    .select()
    .single();
  if (p1Err) throw new Error("Project 1: " + p1Err.message);
  console.log("\nCreated Project 1:", proj1.name);

  // Rooms for Project 1
  const p1Rooms = [
    { project_id: proj1.id, name: "Kitchen", room_type: "interior", sort_order: 1 },
    { project_id: proj1.id, name: "Master Bath", room_type: "interior", sort_order: 2 },
    { project_id: proj1.id, name: "Master Bedroom", room_type: "interior", sort_order: 3 },
    { project_id: proj1.id, name: "Guest Bath 1", room_type: "interior", sort_order: 4 },
    { project_id: proj1.id, name: "Guest Bath 2", room_type: "interior", sort_order: 5 },
    { project_id: proj1.id, name: "Great Room", room_type: "common", sort_order: 6 },
    { project_id: proj1.id, name: "Dining Room", room_type: "common", sort_order: 7 },
    { project_id: proj1.id, name: "Laundry", room_type: "utility", sort_order: 8 },
    { project_id: proj1.id, name: "Garage", room_type: "utility", sort_order: 9 },
    { project_id: proj1.id, name: "Pool/Lanai", room_type: "exterior", sort_order: 10 },
    { project_id: proj1.id, name: "Outdoor Kitchen", room_type: "exterior", sort_order: 11 },
    { project_id: proj1.id, name: "Framing Package", room_type: "common", sort_order: 12 },
  ];
  const { data: rooms1, error: r1Err } = await sb
    .from("project_rooms")
    .insert(p1Rooms)
    .select();
  if (r1Err) throw new Error("Rooms 1: " + r1Err.message);
  console.log("  Rooms:", rooms1.length);

  const roomMap1 = {};
  rooms1.forEach((r) => (roomMap1[r.name] = r.id));

  // Selections for Project 1 — realistic Florida custom home
  const ipe = findMat("Ipe");
  const trex = findMat("Trex");
  const quartz = findMat("Quartz");
  const redOak = findMat("Red Oak");
  const lvp = findMat("LVP");
  const spf2x4 = findMat("SPF 2x4");
  const spf2x6 = findMat("SPF 2x6");
  const spf2x8 = findMat("SPF 2x8");
  const syp2x12 = findMat("SYP 2x12");
  const cdx = findMat("CDX");
  const osb = findMat("OSB");
  const lvl = findMat("LVL");
  const ptPine2x10 = findMat("PT Pine 2x10");
  const ptPine4x4 = findMat("PT Pine 4x4");
  const andersen = findMat("Andersen");
  const pella = findMat("Pella");
  const thermaTru = findMat("Therma-Tru");
  const kraftMaid = findMat("KraftMaid");
  const shingles = findMat("Timberline");
  const felt = findMat("Felt");
  const iceShield = findMat("Ice & Water");
  const tyvek = findMat("Tyvek");
  const insulation = findMat("R-30");
  const hurricaneClip = findMat("Hurricane");
  const joistHanger = findMat("Joist Hanger");
  const screws = findMat("GRK");

  const sup84 = findSup("84 Lumber");
  const supGulf = findSup("Gulf Coast");
  const supAdv = findSup("Advantage");
  const supBMC = findSup("BMC");
  const supABC = findSup("ABC");

  const catLumber = findCat("lumber");
  const catWindows = findCat("windows");
  const catCabinets = findCat("cabinets");
  const catFlooring = findCat("flooring");
  const catRoofing = findCat("roofing");
  const catHardware = findCat("hardware");
  const catOther = findCat("other");

  const p1Selections = [
    // Kitchen
    { room_id: roomMap1["Kitchen"], selection_name: "Kitchen Cabinets", description: "KraftMaid maple shaker cabinets, full overlay", category_id: catCabinets?.id, material_id: kraftMaid?.id, supplier_id: supBMC?.id, allowance_amount: 42000, quantity: 45, unit: "ea", estimated_unit_price: 850, estimated_total: 38250, actual_unit_price: 920, actual_total: 41400, upgrade_status: "standard", sort_order: 1 },
    { room_id: roomMap1["Kitchen"], selection_name: "Kitchen Countertops", description: "Calacatta quartz, waterfall island", category_id: catCabinets?.id, material_id: quartz?.id, supplier_id: supABC?.id, allowance_amount: 18000, quantity: 85, unit: "sqft", estimated_unit_price: 125, estimated_total: 10625, actual_unit_price: 145, actual_total: 13340, upgrade_status: "downgrade", sort_order: 2 },
    { room_id: roomMap1["Kitchen"], selection_name: "Kitchen Flooring", description: "Red oak hardwood 3/4x3-1/4", category_id: catFlooring?.id, material_id: redOak?.id, supplier_id: supGulf?.id, allowance_amount: 12000, quantity: 380, unit: "sqft", estimated_unit_price: 8.50, estimated_total: 3230, actual_unit_price: 9.25, actual_total: 3654, upgrade_status: "downgrade", sort_order: 3 },
    { room_id: roomMap1["Kitchen"], selection_name: "Kitchen Entry Door", description: "Therma-Tru fiberglass entry, craftsman style", category_id: catWindows?.id, material_id: thermaTru?.id, supplier_id: sup84?.id, allowance_amount: 3500, quantity: 1, unit: "ea", estimated_unit_price: 1850, estimated_total: 1850, actual_unit_price: 2100, actual_total: 2100, upgrade_status: "downgrade", sort_order: 4 },

    // Master Bath
    { room_id: roomMap1["Master Bath"], selection_name: "Master Bath Flooring", description: "LVP waterproof plank - marble look", category_id: catFlooring?.id, material_id: lvp?.id, supplier_id: supGulf?.id, allowance_amount: 8000, quantity: 220, unit: "sqft", estimated_unit_price: 4.50, estimated_total: 990, actual_unit_price: 5.25, actual_total: 1181, upgrade_status: "downgrade", sort_order: 1 },
    { room_id: roomMap1["Master Bath"], selection_name: "Master Bath Vanity Countertop", description: "Quartz double vanity top 72in", category_id: catCabinets?.id, material_id: quartz?.id, supplier_id: supABC?.id, allowance_amount: 4500, quantity: 24, unit: "sqft", estimated_unit_price: 125, estimated_total: 3000, actual_unit_price: 135, actual_total: 3240, upgrade_status: "downgrade", sort_order: 2 },
    { room_id: roomMap1["Master Bath"], selection_name: "Master Bath Cabinets", description: "KraftMaid bathroom vanity 72in double", category_id: catCabinets?.id, material_id: kraftMaid?.id, supplier_id: supBMC?.id, allowance_amount: 6500, quantity: 1, unit: "ea", estimated_unit_price: 2800, estimated_total: 2800, upgrade_status: "pending", sort_order: 3 },

    // Master Bedroom
    { room_id: roomMap1["Master Bedroom"], selection_name: "Master Bedroom Flooring", description: "Red oak hardwood throughout master suite", category_id: catFlooring?.id, material_id: redOak?.id, supplier_id: supGulf?.id, allowance_amount: 9500, quantity: 480, unit: "sqft", estimated_unit_price: 8.50, estimated_total: 4080, actual_unit_price: 8.75, actual_total: 4288, upgrade_status: "downgrade", sort_order: 1 },
    { room_id: roomMap1["Master Bedroom"], selection_name: "Master Windows", description: "Andersen 400 series double-hung x6", category_id: catWindows?.id, material_id: andersen?.id, supplier_id: sup84?.id, allowance_amount: 12000, quantity: 6, unit: "ea", estimated_unit_price: 485, estimated_total: 2910, actual_unit_price: 525, actual_total: 3150, upgrade_status: "downgrade", sort_order: 2 },

    // Guest Bath 1
    { room_id: roomMap1["Guest Bath 1"], selection_name: "Guest Bath 1 Flooring", description: "LVP waterproof plank", category_id: catFlooring?.id, material_id: lvp?.id, supplier_id: supGulf?.id, allowance_amount: 3500, quantity: 85, unit: "sqft", estimated_unit_price: 4.50, estimated_total: 383, upgrade_status: "pending", sort_order: 1 },
    { room_id: roomMap1["Guest Bath 1"], selection_name: "Guest Bath 1 Vanity", description: "KraftMaid 36in single vanity", category_id: catCabinets?.id, material_id: kraftMaid?.id, supplier_id: supBMC?.id, allowance_amount: 3200, quantity: 1, unit: "ea", estimated_unit_price: 1400, estimated_total: 1400, upgrade_status: "pending", sort_order: 2 },

    // Guest Bath 2
    { room_id: roomMap1["Guest Bath 2"], selection_name: "Guest Bath 2 Flooring", description: "LVP waterproof plank", category_id: catFlooring?.id, material_id: lvp?.id, supplier_id: supGulf?.id, allowance_amount: 3500, quantity: 75, unit: "sqft", estimated_unit_price: 4.50, estimated_total: 338, upgrade_status: "pending", sort_order: 1 },

    // Great Room
    { room_id: roomMap1["Great Room"], selection_name: "Great Room Flooring", description: "Red oak hardwood - open to kitchen", category_id: catFlooring?.id, material_id: redOak?.id, supplier_id: supGulf?.id, allowance_amount: 15000, quantity: 650, unit: "sqft", estimated_unit_price: 8.50, estimated_total: 5525, actual_unit_price: 9.25, actual_total: 6105, upgrade_status: "downgrade", sort_order: 1 },
    { room_id: roomMap1["Great Room"], selection_name: "Great Room Windows", description: "Pella 250 series sliding doors + Andersen windows", category_id: catWindows?.id, material_id: pella?.id, supplier_id: sup84?.id, allowance_amount: 28000, quantity: 8, unit: "ea", estimated_unit_price: 1250, estimated_total: 10000, actual_unit_price: 1450, actual_total: 11600, upgrade_status: "downgrade", sort_order: 2 },
    { room_id: roomMap1["Great Room"], selection_name: "Great Room Insulation", description: "R-30 fiberglass batt for cathedral ceiling", category_id: catOther?.id, material_id: insulation?.id, supplier_id: sup84?.id, allowance_amount: 4500, quantity: 2400, unit: "sqft", estimated_unit_price: 1.25, estimated_total: 3000, upgrade_status: "pending", sort_order: 3 },

    // Dining Room
    { room_id: roomMap1["Dining Room"], selection_name: "Dining Room Flooring", description: "Red oak hardwood - continuous from great room", category_id: catFlooring?.id, material_id: redOak?.id, supplier_id: supGulf?.id, allowance_amount: 6000, quantity: 280, unit: "sqft", estimated_unit_price: 8.50, estimated_total: 2380, actual_unit_price: 9.25, actual_total: 2636, upgrade_status: "downgrade", sort_order: 1 },

    // Laundry
    { room_id: roomMap1["Laundry"], selection_name: "Laundry Flooring", description: "LVP waterproof - utility grade", category_id: catFlooring?.id, material_id: lvp?.id, supplier_id: supGulf?.id, allowance_amount: 2500, quantity: 110, unit: "sqft", estimated_unit_price: 3.75, estimated_total: 413, upgrade_status: "pending", sort_order: 1 },

    // Garage
    { room_id: roomMap1["Garage"], selection_name: "Garage Entry Door", description: "Therma-Tru fiberglass, fire-rated", category_id: catWindows?.id, material_id: thermaTru?.id, supplier_id: sup84?.id, allowance_amount: 1800, quantity: 1, unit: "ea", estimated_unit_price: 950, estimated_total: 950, upgrade_status: "pending", sort_order: 1 },

    // Pool/Lanai
    { room_id: roomMap1["Pool/Lanai"], selection_name: "Lanai Decking", description: "Ipe hardwood decking 5/4x6x16 around pool", category_id: catFlooring?.id, material_id: ipe?.id, supplier_id: supAdv?.id, allowance_amount: 35000, quantity: 180, unit: "pc", estimated_unit_price: 158, estimated_total: 28440, actual_unit_price: 162, actual_total: 29970, upgrade_status: "downgrade", sort_order: 1 },
    { room_id: roomMap1["Pool/Lanai"], selection_name: "Lanai Railing Posts", description: "PT Pine 4x4x10 for railing system", category_id: catLumber?.id, material_id: ptPine4x4?.id, supplier_id: supGulf?.id, allowance_amount: 3000, quantity: 48, unit: "pc", estimated_unit_price: 18.75, estimated_total: 900, actual_unit_price: 19.50, actual_total: 1014, upgrade_status: "downgrade", sort_order: 2 },

    // Outdoor Kitchen
    { room_id: roomMap1["Outdoor Kitchen"], selection_name: "Outdoor Countertop", description: "Quartz outdoor-rated countertop", category_id: catCabinets?.id, material_id: quartz?.id, supplier_id: supABC?.id, allowance_amount: 8000, quantity: 36, unit: "sqft", estimated_unit_price: 145, estimated_total: 5220, upgrade_status: "pending", sort_order: 1 },
    { room_id: roomMap1["Outdoor Kitchen"], selection_name: "Outdoor Decking", description: "Trex Transcend composite for outdoor kitchen area", category_id: catFlooring?.id, material_id: trex?.id, supplier_id: supAdv?.id, allowance_amount: 12000, quantity: 120, unit: "pc", estimated_unit_price: 78.50, estimated_total: 9420, actual_unit_price: 82, actual_total: 10250, upgrade_status: "downgrade", sort_order: 2 },

    // Framing Package
    { room_id: roomMap1["Framing Package"], selection_name: "Wall Studs 2x4", description: "SPF 2x4x8 #2 KD for wall framing", category_id: catLumber?.id, material_id: spf2x4?.id, supplier_id: sup84?.id, allowance_amount: 15000, quantity: 2800, unit: "pc", estimated_unit_price: 4.50, estimated_total: 12600, actual_unit_price: 4.87, actual_total: 13880, upgrade_status: "standard", sort_order: 1 },
    { room_id: roomMap1["Framing Package"], selection_name: "Floor Joists 2x8", description: "SPF 2x8x12 #2 for floor system", category_id: catLumber?.id, material_id: spf2x8?.id, supplier_id: sup84?.id, allowance_amount: 8000, quantity: 420, unit: "pc", estimated_unit_price: 11.45, estimated_total: 4809, actual_unit_price: 11.89, actual_total: 5113, upgrade_status: "downgrade", sort_order: 2 },
    { room_id: roomMap1["Framing Package"], selection_name: "Rafters 2x6", description: "SPF 2x6x10 #2 for roof framing", category_id: catLumber?.id, material_id: spf2x6?.id, supplier_id: sup84?.id, allowance_amount: 6000, quantity: 380, unit: "pc", estimated_unit_price: 7.89, estimated_total: 2998, actual_unit_price: 8.15, actual_total: 3179, upgrade_status: "downgrade", sort_order: 3 },
    { room_id: roomMap1["Framing Package"], selection_name: "Ridge Beams", description: "SYP 2x12x20 #1 for ridge beams", category_id: catLumber?.id, material_id: syp2x12?.id, supplier_id: supGulf?.id, allowance_amount: 5000, quantity: 24, unit: "pc", estimated_unit_price: 38.50, estimated_total: 924, actual_unit_price: 42, actual_total: 1092, upgrade_status: "downgrade", sort_order: 4 },
    { room_id: roomMap1["Framing Package"], selection_name: "LVL Beams", description: "LVL 1-3/4x11-7/8x20 for headers and spans", category_id: catLumber?.id, material_id: lvl?.id, supplier_id: supGulf?.id, allowance_amount: 12000, quantity: 18, unit: "pc", estimated_unit_price: 185, estimated_total: 3330, actual_unit_price: 195, actual_total: 3900, upgrade_status: "downgrade", sort_order: 5 },
    { room_id: roomMap1["Framing Package"], selection_name: "Sheathing CDX", description: "3/4 CDX plywood for subfloor", category_id: catLumber?.id, material_id: cdx?.id, supplier_id: sup84?.id, allowance_amount: 18000, quantity: 320, unit: "pc", estimated_unit_price: 42.50, estimated_total: 13600, actual_unit_price: 44, actual_total: 14520, upgrade_status: "standard", sort_order: 6 },
    { room_id: roomMap1["Framing Package"], selection_name: "Wall Sheathing OSB", description: "7/16 OSB for exterior walls", category_id: catLumber?.id, material_id: osb?.id, supplier_id: sup84?.id, allowance_amount: 8000, quantity: 280, unit: "pc", estimated_unit_price: 18.90, estimated_total: 5292, actual_unit_price: 19.25, actual_total: 5583, upgrade_status: "downgrade", sort_order: 7 },
    { room_id: roomMap1["Framing Package"], selection_name: "PT Deck Joists", description: "PT Pine 2x10x16 for lanai framing", category_id: catLumber?.id, material_id: ptPine2x10?.id, supplier_id: supGulf?.id, allowance_amount: 6000, quantity: 85, unit: "pc", estimated_unit_price: 22.15, estimated_total: 1883, actual_unit_price: 23.50, actual_total: 2115, upgrade_status: "downgrade", sort_order: 8 },
    { room_id: roomMap1["Framing Package"], selection_name: "Hurricane Clips", description: "Simpson H2.5A clips for roof-to-wall", category_id: catHardware?.id, material_id: hurricaneClip?.id, supplier_id: sup84?.id, allowance_amount: 2000, quantity: 480, unit: "ea", estimated_unit_price: 1.85, estimated_total: 888, actual_unit_price: 1.92, actual_total: 960, upgrade_status: "downgrade", sort_order: 9 },
    { room_id: roomMap1["Framing Package"], selection_name: "Joist Hangers", description: "Simpson LUS28 for floor system", category_id: catHardware?.id, material_id: joistHanger?.id, supplier_id: sup84?.id, allowance_amount: 1500, quantity: 210, unit: "ea", estimated_unit_price: 3.45, estimated_total: 725, actual_unit_price: 3.60, actual_total: 792, upgrade_status: "downgrade", sort_order: 10 },
    { room_id: roomMap1["Framing Package"], selection_name: "Structural Screws", description: "GRK R4 #9x3in for framing connections", category_id: catHardware?.id, material_id: screws?.id, supplier_id: sup84?.id, allowance_amount: 1200, quantity: 15, unit: "ea", estimated_unit_price: 58, estimated_total: 870, upgrade_status: "pending", sort_order: 11 },
    { room_id: roomMap1["Framing Package"], selection_name: "Housewrap", description: "Tyvek HomeWrap 9x150 rolls", category_id: catOther?.id, material_id: tyvek?.id, supplier_id: sup84?.id, allowance_amount: 3000, quantity: 12, unit: "ea", estimated_unit_price: 185, estimated_total: 2220, actual_unit_price: 192, actual_total: 2496, upgrade_status: "downgrade", sort_order: 12 },
    { room_id: roomMap1["Framing Package"], selection_name: "Roofing Shingles", description: "GAF Timberline HDZ Architectural", category_id: catRoofing?.id, material_id: shingles?.id, supplier_id: supABC?.id, allowance_amount: 22000, quantity: 380, unit: "ea", estimated_unit_price: 42, estimated_total: 15960, actual_unit_price: 44.50, actual_total: 17355, upgrade_status: "standard", sort_order: 13 },
    { room_id: roomMap1["Framing Package"], selection_name: "Roofing Underlayment", description: "30# felt + Grace Ice Shield at eaves", category_id: catRoofing?.id, material_id: felt?.id, supplier_id: supABC?.id, allowance_amount: 4000, quantity: 85, unit: "ea", estimated_unit_price: 28, estimated_total: 2380, actual_unit_price: 29.50, actual_total: 2596, upgrade_status: "downgrade", sort_order: 14 },
  ];

  const { data: sels1, error: s1Err } = await sb
    .from("project_selections")
    .insert(p1Selections)
    .select();
  if (s1Err) throw new Error("Selections 1: " + s1Err.message);
  console.log("  Selections:", sels1.length);

  // Procurement items for Project 1 — various stages
  const procurementData1 = [];
  for (const sel of sels1) {
    if (sel.actual_total) {
      // Items that have actual pricing — some ordered, some delivered, some installed
      const roll = Math.random();
      let status, ordered_date, expected_delivery, actual_delivery;
      if (roll < 0.25) {
        status = "awarded";
        ordered_date = null;
      } else if (roll < 0.5) {
        status = "ordered";
        ordered_date = "2026-02-01";
        expected_delivery = "2026-02-15";
      } else if (roll < 0.75) {
        status = "delivered";
        ordered_date = "2026-01-20";
        expected_delivery = "2026-02-05";
        actual_delivery = "2026-02-03";
      } else {
        status = "installed";
        ordered_date = "2026-01-15";
        expected_delivery = "2026-01-28";
        actual_delivery = "2026-01-27";
      }

      // Try to find a matching quote line item
      const matchingLine = findLineItem(sel.material_id);
      const matchingQuote = matchingLine
        ? quotes.find((q) => q.id === matchingLine.quote_id)
        : null;

      procurementData1.push({
        selection_id: sel.id,
        status,
        committed_price: sel.actual_total,
        po_number: `PO-LRE-${String(procurementData1.length + 1).padStart(3, "0")}`,
        ordered_date,
        expected_delivery,
        actual_delivery,
        quote_id: matchingQuote?.id || null,
        line_item_id: matchingLine?.id || null,
        notes:
          status === "installed"
            ? "Installed and verified on site"
            : status === "delivered"
            ? "Received at job site, awaiting install"
            : null,
      });
    }
  }

  const { data: proc1, error: pr1Err } = await sb
    .from("procurement_items")
    .insert(procurementData1)
    .select();
  if (pr1Err) throw new Error("Procurement 1: " + pr1Err.message);
  console.log("  Procurement items:", proc1.length);

  // ============================================================
  // PROJECT 2: Siesta Key Beach House (estimating phase)
  // ============================================================
  const { data: proj2, error: p2Err } = await sb
    .from("projects")
    .insert({
      organization_id: orgId,
      name: "Siesta Key Beach House",
      address: "8750 Midnight Pass Road",
      city: "Siesta Key",
      state: "FL",
      square_footage: 3200,
      client_name: "David & Jennifer Walsh",
      client_email: "dwalsh@coastal.net",
      client_phone: "(941) 555-0298",
      target_budget: 680000,
      status: "estimating",
      start_date: "2026-03-01",
      estimated_completion: "2026-10-15",
      notes:
        "Coastal contemporary on stilts. Hurricane-rated windows required. Composite decking for salt air. Budget is tight — client wants value engineering options.",
    })
    .select()
    .single();
  if (p2Err) throw new Error("Project 2: " + p2Err.message);
  console.log("\nCreated Project 2:", proj2.name);

  const p2Rooms = [
    { project_id: proj2.id, name: "Kitchen", room_type: "interior", sort_order: 1 },
    { project_id: proj2.id, name: "Master Suite", room_type: "interior", sort_order: 2 },
    { project_id: proj2.id, name: "Living Room", room_type: "common", sort_order: 3 },
    { project_id: proj2.id, name: "Guest Bedroom", room_type: "interior", sort_order: 4 },
    { project_id: proj2.id, name: "Bathroom", room_type: "interior", sort_order: 5 },
    { project_id: proj2.id, name: "Exterior Deck", room_type: "exterior", sort_order: 6 },
    { project_id: proj2.id, name: "Framing", room_type: "common", sort_order: 7 },
  ];
  const { data: rooms2, error: r2Err } = await sb
    .from("project_rooms")
    .insert(p2Rooms)
    .select();
  if (r2Err) throw new Error("Rooms 2: " + r2Err.message);
  console.log("  Rooms:", rooms2.length);

  const roomMap2 = {};
  rooms2.forEach((r) => (roomMap2[r.name] = r.id));

  const p2Selections = [
    { room_id: roomMap2["Kitchen"], selection_name: "Kitchen Cabinets", category_id: catCabinets?.id, material_id: kraftMaid?.id, allowance_amount: 28000, quantity: 35, unit: "ea", estimated_unit_price: 680, estimated_total: 23800, upgrade_status: "pending", sort_order: 1 },
    { room_id: roomMap2["Kitchen"], selection_name: "Kitchen Countertops", category_id: catCabinets?.id, material_id: quartz?.id, allowance_amount: 12000, quantity: 55, unit: "sqft", estimated_unit_price: 125, estimated_total: 6875, upgrade_status: "pending", sort_order: 2 },
    { room_id: roomMap2["Kitchen"], selection_name: "Kitchen Flooring", category_id: catFlooring?.id, material_id: lvp?.id, allowance_amount: 5000, quantity: 280, unit: "sqft", estimated_unit_price: 4.50, estimated_total: 1260, upgrade_status: "pending", sort_order: 3 },
    { room_id: roomMap2["Master Suite"], selection_name: "Master Flooring", category_id: catFlooring?.id, material_id: lvp?.id, allowance_amount: 6000, quantity: 350, unit: "sqft", estimated_unit_price: 4.50, estimated_total: 1575, upgrade_status: "pending", sort_order: 1 },
    { room_id: roomMap2["Master Suite"], selection_name: "Master Windows", category_id: catWindows?.id, material_id: andersen?.id, allowance_amount: 15000, quantity: 8, unit: "ea", estimated_unit_price: 525, estimated_total: 4200, upgrade_status: "pending", sort_order: 2 },
    { room_id: roomMap2["Living Room"], selection_name: "Living Room Flooring", category_id: catFlooring?.id, material_id: lvp?.id, allowance_amount: 8000, quantity: 520, unit: "sqft", estimated_unit_price: 4.50, estimated_total: 2340, upgrade_status: "pending", sort_order: 1 },
    { room_id: roomMap2["Living Room"], selection_name: "Sliding Glass Doors", category_id: catWindows?.id, material_id: pella?.id, allowance_amount: 18000, quantity: 3, unit: "ea", estimated_unit_price: 2800, estimated_total: 8400, upgrade_status: "pending", sort_order: 2 },
    { room_id: roomMap2["Exterior Deck"], selection_name: "Deck Surface", description: "Trex composite — salt air resistant", category_id: catFlooring?.id, material_id: trex?.id, supplier_id: supAdv?.id, allowance_amount: 22000, quantity: 240, unit: "pc", estimated_unit_price: 78.50, estimated_total: 18840, upgrade_status: "pending", sort_order: 1 },
    { room_id: roomMap2["Exterior Deck"], selection_name: "Deck Framing", category_id: catLumber?.id, material_id: ptPine2x10?.id, allowance_amount: 8000, quantity: 180, unit: "pc", estimated_unit_price: 22.15, estimated_total: 3987, upgrade_status: "pending", sort_order: 2 },
    { room_id: roomMap2["Framing"], selection_name: "Wall Studs", category_id: catLumber?.id, material_id: spf2x4?.id, allowance_amount: 8000, quantity: 1600, unit: "pc", estimated_unit_price: 4.50, estimated_total: 7200, upgrade_status: "pending", sort_order: 1 },
    { room_id: roomMap2["Framing"], selection_name: "Roof Sheathing", category_id: catLumber?.id, material_id: osb?.id, allowance_amount: 5000, quantity: 180, unit: "pc", estimated_unit_price: 18.90, estimated_total: 3402, upgrade_status: "pending", sort_order: 2 },
    { room_id: roomMap2["Framing"], selection_name: "Hurricane Hardware", category_id: catHardware?.id, material_id: hurricaneClip?.id, allowance_amount: 2500, quantity: 320, unit: "ea", estimated_unit_price: 1.85, estimated_total: 592, upgrade_status: "pending", sort_order: 3 },
  ];

  const { data: sels2, error: s2Err } = await sb
    .from("project_selections")
    .insert(p2Selections)
    .select();
  if (s2Err) throw new Error("Selections 2: " + s2Err.message);
  console.log("  Selections:", sels2.length);

  // ============================================================
  // PROJECT 3: Bradenton Ranch (planning phase, minimal data)
  // ============================================================
  const { data: proj3, error: p3Err } = await sb
    .from("projects")
    .insert({
      organization_id: orgId,
      name: "Bradenton Ranch Home",
      address: "2200 Manatee Ave W",
      city: "Bradenton",
      state: "FL",
      square_footage: 2400,
      client_name: "Robert Martinez",
      client_email: "rmartinez@yahoo.com",
      client_phone: "(941) 555-0187",
      target_budget: 425000,
      status: "planning",
      notes:
        "Single-story ranch, open floor plan. Client is flexible on finishes. Wants to keep costs down — builder-grade selections acceptable.",
    })
    .select()
    .single();
  if (p3Err) throw new Error("Project 3: " + p3Err.message);
  console.log("\nCreated Project 3:", proj3.name);

  const p3Rooms = [
    { project_id: proj3.id, name: "Kitchen", room_type: "interior", sort_order: 1 },
    { project_id: proj3.id, name: "Master Bath", room_type: "interior", sort_order: 2 },
    { project_id: proj3.id, name: "Living Area", room_type: "common", sort_order: 3 },
    { project_id: proj3.id, name: "Garage", room_type: "utility", sort_order: 4 },
  ];
  const { data: rooms3, error: r3Err } = await sb
    .from("project_rooms")
    .insert(p3Rooms)
    .select();
  if (r3Err) throw new Error("Rooms 3: " + r3Err.message);
  console.log("  Rooms:", rooms3.length, "(no selections yet — planning phase)");

  // ============================================================
  // PROJECT 4: Completed project (for historical reference)
  // ============================================================
  const { data: proj4, error: p4Err } = await sb
    .from("projects")
    .insert({
      organization_id: orgId,
      name: "Palmer Ranch Colonial",
      address: "5440 Palmer Crossing Circle",
      city: "Sarasota",
      state: "FL",
      square_footage: 4100,
      client_name: "James & Patricia Chen",
      client_email: "jchen@outlook.com",
      client_phone: "(941) 555-0334",
      target_budget: 890000,
      status: "completed",
      start_date: "2025-09-01",
      estimated_completion: "2026-03-15",
      notes: "Completed ahead of schedule. Client very satisfied. Final cost slightly under budget.",
    })
    .select()
    .single();
  if (p4Err) throw new Error("Project 4: " + p4Err.message);
  console.log("\nCreated Project 4:", proj4.name);

  const p4Rooms = [
    { project_id: proj4.id, name: "Kitchen", room_type: "interior", sort_order: 1 },
    { project_id: proj4.id, name: "Master Bath", room_type: "interior", sort_order: 2 },
    { project_id: proj4.id, name: "Great Room", room_type: "common", sort_order: 3 },
    { project_id: proj4.id, name: "Exterior", room_type: "exterior", sort_order: 4 },
    { project_id: proj4.id, name: "Framing", room_type: "common", sort_order: 5 },
  ];
  const { data: rooms4, error: r4Err } = await sb
    .from("project_rooms")
    .insert(p4Rooms)
    .select();
  if (r4Err) throw new Error("Rooms 4: " + r4Err.message);

  const roomMap4 = {};
  rooms4.forEach((r) => (roomMap4[r.name] = r.id));

  const p4Selections = [
    { room_id: roomMap4["Kitchen"], selection_name: "Kitchen Cabinets", category_id: catCabinets?.id, material_id: kraftMaid?.id, supplier_id: supBMC?.id, allowance_amount: 35000, estimated_total: 32000, actual_total: 33500, upgrade_status: "standard", sort_order: 1 },
    { room_id: roomMap4["Kitchen"], selection_name: "Kitchen Countertops", category_id: catCabinets?.id, material_id: quartz?.id, supplier_id: supABC?.id, allowance_amount: 14000, estimated_total: 11500, actual_total: 12800, upgrade_status: "downgrade", sort_order: 2 },
    { room_id: roomMap4["Kitchen"], selection_name: "Kitchen Flooring", category_id: catFlooring?.id, material_id: redOak?.id, supplier_id: supGulf?.id, allowance_amount: 10000, estimated_total: 8200, actual_total: 8750, upgrade_status: "downgrade", sort_order: 3 },
    { room_id: roomMap4["Master Bath"], selection_name: "Master Bath Flooring", category_id: catFlooring?.id, material_id: lvp?.id, supplier_id: supGulf?.id, allowance_amount: 5000, estimated_total: 3800, actual_total: 4100, upgrade_status: "downgrade", sort_order: 1 },
    { room_id: roomMap4["Great Room"], selection_name: "Great Room Flooring", category_id: catFlooring?.id, material_id: redOak?.id, supplier_id: supGulf?.id, allowance_amount: 12000, estimated_total: 9500, actual_total: 10200, upgrade_status: "downgrade", sort_order: 1 },
    { room_id: roomMap4["Great Room"], selection_name: "Windows Package", category_id: catWindows?.id, material_id: andersen?.id, supplier_id: sup84?.id, allowance_amount: 22000, estimated_total: 19000, actual_total: 20500, upgrade_status: "standard", sort_order: 2 },
    { room_id: roomMap4["Exterior"], selection_name: "Front Door", category_id: catWindows?.id, material_id: thermaTru?.id, supplier_id: sup84?.id, allowance_amount: 3500, estimated_total: 2800, actual_total: 3100, upgrade_status: "downgrade", sort_order: 1 },
    { room_id: roomMap4["Framing"], selection_name: "Lumber Package", category_id: catLumber?.id, material_id: spf2x4?.id, supplier_id: sup84?.id, allowance_amount: 65000, estimated_total: 58000, actual_total: 61200, upgrade_status: "standard", sort_order: 1 },
    { room_id: roomMap4["Framing"], selection_name: "Roofing", category_id: catRoofing?.id, material_id: shingles?.id, supplier_id: supABC?.id, allowance_amount: 18000, estimated_total: 15500, actual_total: 16800, upgrade_status: "standard", sort_order: 2 },
    { room_id: roomMap4["Framing"], selection_name: "Insulation & Wrap", category_id: catOther?.id, material_id: tyvek?.id, supplier_id: sup84?.id, allowance_amount: 8000, estimated_total: 6500, actual_total: 7100, upgrade_status: "downgrade", sort_order: 3 },
  ];

  const { data: sels4, error: s4Err } = await sb
    .from("project_selections")
    .insert(p4Selections)
    .select();
  if (s4Err) throw new Error("Selections 4: " + s4Err.message);
  console.log("  Rooms:", rooms4.length, "| Selections:", sels4.length);

  // Procurement for completed project — all installed
  const procData4 = sels4.map((sel, i) => ({
    selection_id: sel.id,
    status: "installed",
    committed_price: sel.actual_total,
    po_number: `PO-PRC-${String(i + 1).padStart(3, "0")}`,
    ordered_date: "2025-10-01",
    expected_delivery: "2025-10-15",
    actual_delivery: "2025-10-12",
  }));

  const { data: proc4, error: pr4Err } = await sb
    .from("procurement_items")
    .insert(procData4)
    .select();
  if (pr4Err) throw new Error("Procurement 4: " + pr4Err.message);
  console.log("  Procurement items:", proc4.length, "(all installed)");

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n========================================");
  console.log("SEED COMPLETE");
  console.log("========================================");
  console.log("Projects: 4");
  console.log("  1. Lakewood Ranch Estate — in_progress, 12 rooms, " + sels1.length + " selections, " + proc1.length + " procurement items");
  console.log("  2. Siesta Key Beach House — estimating, 7 rooms, " + sels2.length + " selections, 0 procurement items");
  console.log("  3. Bradenton Ranch Home — planning, 4 rooms, 0 selections");
  console.log("  4. Palmer Ranch Colonial — completed, 5 rooms, " + sels4.length + " selections, " + proc4.length + " procurement items");
  console.log("========================================");
}

seed().catch((e) => console.error("FATAL:", e.message));
