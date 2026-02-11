const { Client } = require('pg');

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';

// Category IDs from seed data
const CATS = {
  LUMBER: '39f99507-e165-491a-aed6-783ab275fee3',
  WINDOWS: '29ad07d8-214f-4a75-85e0-2bc9356e7d58',
  CABINETS: '9f460867-81bd-482c-b595-353e1b16e52e',
  FLOORING: 'f0a9acc8-3395-45c5-829c-71c5c53babe3',
  ROOFING: '7f20e25a-fb56-4135-81eb-fa71b03ba141',
  HARDWARE: '3a0a74b7-781e-4c81-bcf6-9329b2497c09',
  OTHER: '04e83728-4c40-4ceb-a6da-e809ae3cf2c5',
};

// Suppliers to create (including existing ones)
const SUPPLIERS = [
  { name: 'Advantage Lumber, LLC', existing: true, id: 'd1192471-8dce-4626-a2c5-f2111b5d1f8f' },
  { name: 'Gulf Coast Building Supply', existing: true, id: '35d246fa-1ec1-4d1d-8601-d4b0ef243f37' },
  { name: 'ABC Supply Co.', existing: false },
  { name: '84 Lumber', existing: false },
  { name: 'BMC Stock Holdings', existing: false },
];

// Materials to create (canonical names + category)
const MATERIALS = [
  // Lumber & Framing (some existing, add more)
  { name: 'SPF 2x4x8 #2 Kiln Dried', cat: CATS.LUMBER, existing: true, id: '52ca2435-bf57-4a5b-b35d-6800fb9613ba' },
  { name: 'SPF 2x6x10 #2 Kiln Dried', cat: CATS.LUMBER },
  { name: 'SPF 2x8x12 #2 Kiln Dried', cat: CATS.LUMBER },
  { name: 'PT Pine 2x10x16 #2', cat: CATS.LUMBER, existing: true, id: '581a9b29-aa0b-4757-87e0-60fba6a505b1' },
  { name: 'SYP 2x12x20 #1 Kiln Dried', cat: CATS.LUMBER, existing: true, id: 'd52b8895-91b2-4752-84a2-e30e6edae5e3' },
  { name: 'PT Pine 4x4x10', cat: CATS.LUMBER, existing: true, id: '0f507668-674a-4244-b3f1-5b9a430ed537' },
  { name: 'CDX Plywood 3/4 4x8', cat: CATS.LUMBER, existing: true, id: 'e2d24b45-5a4c-4391-a97b-819d9cbca26b' },
  { name: 'OSB Sheathing 7/16 4x8', cat: CATS.LUMBER, existing: true, id: '6992dcc2-7137-4a55-9291-b77c5e8696e5' },
  { name: 'LVL Beam 1-3/4x11-7/8x20', cat: CATS.LUMBER },
  // Windows & Doors
  { name: 'Andersen 400 Series Double-Hung 36x60', cat: CATS.WINDOWS },
  { name: 'Pella 250 Series Sliding Patio Door 72x80', cat: CATS.WINDOWS },
  { name: 'Therma-Tru Benchmark Fiberglass Entry Door 36x80', cat: CATS.WINDOWS },
  // Cabinets & Countertops
  { name: 'KraftMaid Base Cabinet 36in Oak', cat: CATS.CABINETS },
  { name: 'Quartz Countertop Calacatta 25.5x96', cat: CATS.CABINETS },
  // Flooring
  { name: 'Ipe Decking 5/4x6x16 S4S', cat: CATS.FLOORING, existing: true, id: '96cca886-82d4-4737-b492-ca4aff7dbc36' },
  { name: 'Red Oak Hardwood 3/4x3-1/4 Unfinished', cat: CATS.FLOORING },
  { name: 'LVP Luxury Vinyl Plank 7x48 Waterproof', cat: CATS.FLOORING },
  // Roofing
  { name: 'GAF Timberline HDZ Architectural Shingles', cat: CATS.ROOFING },
  { name: 'Grace Ice & Water Shield 36x75', cat: CATS.ROOFING },
  { name: '30# Felt Underlayment 36x144', cat: CATS.ROOFING },
  // Hardware & Fasteners
  { name: 'Simpson Strong-Tie H2.5A Hurricane Clip', cat: CATS.HARDWARE, existing: true, id: '4164d7cd-d654-4dfb-8464-6fe500649983' },
  { name: 'GRK R4 #9 x 3in Structural Screws 100pk', cat: CATS.HARDWARE },
  { name: 'Simpson Strong-Tie LUS28 Joist Hanger', cat: CATS.HARDWARE },
  // Other
  { name: 'Tyvek HomeWrap 9x150', cat: CATS.OTHER },
  { name: 'R-30 Fiberglass Batt Insulation 15x48', cat: CATS.OTHER },
];

// Quote definitions: supplier, date, project, line items
const QUOTES = [
  {
    supplier: 'Advantage Lumber, LLC',
    quoteNumber: 'AL-2026-001',
    quoteDate: '2026-01-15',
    project: 'Smith Residence Framing',
    items: [
      { material: 'SPF 2x4x8 #2 Kiln Dried', qty: 200, unit: 'pc', price: 4.25, desc: '2x4-8 SPF #2&Btr KD' },
      { material: 'SPF 2x6x10 #2 Kiln Dried', qty: 120, unit: 'pc', price: 7.89, desc: '2x6-10 SPF #2 KD' },
      { material: 'SPF 2x8x12 #2 Kiln Dried', qty: 80, unit: 'pc', price: 11.45, desc: '2x8-12 SPF #2 KD' },
      { material: 'CDX Plywood 3/4 4x8', qty: 50, unit: 'sheet', price: 42.99, desc: '3/4" CDX Plywood 4x8' },
      { material: 'OSB Sheathing 7/16 4x8', qty: 75, unit: 'sheet', price: 18.50, desc: '7/16 OSB 4x8' },
      { material: 'Simpson Strong-Tie H2.5A Hurricane Clip', qty: 200, unit: 'ea', price: 1.85, desc: 'H2.5A Hurricane Clips' },
      // Discount line
      { type: 'discount', desc: 'Volume Discount - 5% off lumber', discountPct: 5 },
    ],
    subtotal: 7325.50,
    total: 6959.23,
  },
  {
    supplier: 'Advantage Lumber, LLC',
    quoteNumber: 'AL-2026-015',
    quoteDate: '2026-02-01',
    project: 'Johnson Custom Home',
    items: [
      { material: 'SPF 2x4x8 #2 Kiln Dried', qty: 300, unit: 'pc', price: 4.15, desc: '2x4-8\' SPF #2&BTR KD' },
      { material: 'SPF 2x6x10 #2 Kiln Dried', qty: 150, unit: 'pc', price: 7.75, desc: '2x6-10 SPF #2 Kiln Dried' },
      { material: 'PT Pine 2x10x16 #2', qty: 40, unit: 'pc', price: 22.50, desc: '2x10-16 PT Pine #2' },
      { material: 'LVL Beam 1-3/4x11-7/8x20', qty: 6, unit: 'ea', price: 189.00, desc: 'LVL 1-3/4x11-7/8x20 Beam' },
      { material: 'Tyvek HomeWrap 9x150', qty: 3, unit: 'roll', price: 165.00, desc: 'Tyvek HomeWrap 9\'x150\'' },
      { type: 'discount', desc: 'Contractor Loyalty Discount', discountAmt: 150.00 },
      { type: 'fee', desc: 'Fuel Surcharge', price: 75.00 },
    ],
    subtotal: 3952.50,
    total: 3877.50,
  },
  {
    supplier: 'Gulf Coast Building Supply',
    quoteNumber: 'GCBS-4421',
    quoteDate: '2026-01-20',
    project: 'Smith Residence Framing',
    items: [
      { material: 'SPF 2x4x8 #2 Kiln Dried', qty: 200, unit: 'pc', price: 4.49, desc: '2x4 8ft SPF #2 KD HT' },
      { material: 'SPF 2x6x10 #2 Kiln Dried', qty: 120, unit: 'pc', price: 8.15, desc: '2x6 10ft SPF #2 KD' },
      { material: 'SPF 2x8x12 #2 Kiln Dried', qty: 80, unit: 'pc', price: 12.10, desc: '2x8 12ft SPF #2 Kiln-Dried' },
      { material: 'CDX Plywood 3/4 4x8', qty: 50, unit: 'sheet', price: 44.75, desc: 'CDX PLY 3/4" 4\'x8\'' },
      { material: 'OSB Sheathing 7/16 4x8', qty: 75, unit: 'sheet', price: 19.25, desc: 'OSB 7/16" Structural Sheathing' },
      { material: 'GRK R4 #9 x 3in Structural Screws 100pk', qty: 10, unit: 'box', price: 42.99, desc: 'GRK R4 #9x3" Screws 100ct' },
    ],
    subtotal: 5905.40,
    total: 5905.40,
  },
  {
    supplier: 'Gulf Coast Building Supply',
    quoteNumber: 'GCBS-4489',
    quoteDate: '2026-02-05',
    project: 'Johnson Custom Home',
    items: [
      { material: 'SPF 2x4x8 #2 Kiln Dried', qty: 300, unit: 'pc', price: 4.39, desc: '2x4 8\' SPF #2 KD' },
      { material: 'PT Pine 4x4x10', qty: 20, unit: 'pc', price: 18.75, desc: 'PT 4x4-10 SYP #2' },
      { material: 'GAF Timberline HDZ Architectural Shingles', qty: 30, unit: 'bundle', price: 38.99, desc: 'GAF HDZ Shingles Charcoal' },
      { material: 'Grace Ice & Water Shield 36x75', qty: 4, unit: 'roll', price: 115.00, desc: 'Grace Ice/Water Shield 36"x75\'' },
      { material: '30# Felt Underlayment 36x144', qty: 6, unit: 'roll', price: 28.50, desc: '30# Felt Paper 36"x144\'' },
      { material: 'Simpson Strong-Tie LUS28 Joist Hanger', qty: 50, unit: 'ea', price: 3.45, desc: 'Simpson LUS28 2x8 Joist Hanger' },
      { type: 'subtotal_line', desc: 'Subtotal' },
      { type: 'note', desc: 'Prices valid for 30 days. Subject to availability.' },
    ],
    subtotal: 3247.20,
    total: 3247.20,
  },
  {
    supplier: 'ABC Supply Co.',
    quoteNumber: 'ABC-90012',
    quoteDate: '2026-01-25',
    project: 'Smith Residence Exterior',
    items: [
      { material: 'GAF Timberline HDZ Architectural Shingles', qty: 35, unit: 'bundle', price: 36.50, desc: 'GAF Timberline HDZ - Weathered Wood' },
      { material: 'Grace Ice & Water Shield 36x75', qty: 5, unit: 'roll', price: 109.99, desc: 'Grace I&W Shield 75\' Roll' },
      { material: '30# Felt Underlayment 36x144', qty: 8, unit: 'roll', price: 26.75, desc: '#30 Roofing Felt 4sq Roll' },
      { material: 'Tyvek HomeWrap 9x150', qty: 4, unit: 'roll', price: 155.00, desc: 'Tyvek HomeWrap 9x150' },
      { material: 'R-30 Fiberglass Batt Insulation 15x48', qty: 20, unit: 'bag', price: 52.99, desc: 'R-30 Unfaced Fiberglass Batt 15"' },
      { type: 'fee', desc: 'Delivery Fee - Crane Required', price: 250.00 },
    ],
    subtotal: 3632.55,
    total: 3882.55,
  },
  {
    supplier: 'ABC Supply Co.',
    quoteNumber: 'ABC-90088',
    quoteDate: '2026-02-08',
    project: 'Johnson Custom Home',
    items: [
      { material: 'GAF Timberline HDZ Architectural Shingles', qty: 40, unit: 'bundle', price: 37.25, desc: 'GAF HDZ Architectural - Slate' },
      { material: 'Grace Ice & Water Shield 36x75', qty: 6, unit: 'roll', price: 112.50, desc: 'Grace Ice & Water Shield' },
      { material: '30# Felt Underlayment 36x144', qty: 10, unit: 'roll', price: 27.50, desc: '30# Felt Underlayment 4sq' },
      { material: 'R-30 Fiberglass Batt Insulation 15x48', qty: 25, unit: 'bag', price: 51.50, desc: 'R-30 Fiberglass Batt Insulation' },
    ],
    subtotal: 3437.50,
    total: 3437.50,
  },
  {
    supplier: '84 Lumber',
    quoteNumber: '84L-2026-0331',
    quoteDate: '2026-01-28',
    project: 'Smith Residence Framing',
    items: [
      { material: 'SPF 2x4x8 #2 Kiln Dried', qty: 200, unit: 'pc', price: 4.35, desc: '2X4-8 SPF STUD GRADE' },
      { material: 'SPF 2x6x10 #2 Kiln Dried', qty: 120, unit: 'pc', price: 7.99, desc: '2X6-10 #2 SPF KD-HT' },
      { material: 'CDX Plywood 3/4 4x8', qty: 50, unit: 'sheet', price: 43.50, desc: '3/4 CDX PLYWOOD 48X96' },
      { material: 'LVL Beam 1-3/4x11-7/8x20', qty: 6, unit: 'ea', price: 195.00, desc: 'LVL 1.75X11.875X20 BEAM' },
      { material: 'PT Pine 2x10x16 #2', qty: 40, unit: 'pc', price: 21.89, desc: '2X10-16 #2 PT SYP' },
      { material: 'Simpson Strong-Tie H2.5A Hurricane Clip', qty: 200, unit: 'ea', price: 1.79, desc: 'SIMPSON H2.5A CLIP' },
      { material: 'GRK R4 #9 x 3in Structural Screws 100pk', qty: 8, unit: 'box', price: 44.50, desc: 'GRK R4 #9 X 3" 100CT' },
      { type: 'discount', desc: 'New Customer Discount - 3%', discountPct: 3 },
    ],
    subtotal: 5320.10,
    total: 5160.50,
  },
  {
    supplier: 'BMC Stock Holdings',
    quoteNumber: 'BMC-FL-8891',
    quoteDate: '2026-02-03',
    project: 'Smith Residence Interior',
    items: [
      { material: 'Andersen 400 Series Double-Hung 36x60', qty: 12, unit: 'ea', price: 485.00, desc: 'Andersen 400 DH Window 36x60 White' },
      { material: 'Pella 250 Series Sliding Patio Door 72x80', qty: 2, unit: 'ea', price: 1250.00, desc: 'Pella 250 Sliding Door 6\' White' },
      { material: 'Therma-Tru Benchmark Fiberglass Entry Door 36x80', qty: 1, unit: 'ea', price: 895.00, desc: 'Therma-Tru Benchmark Entry Door 3/0' },
      { material: 'KraftMaid Base Cabinet 36in Oak', qty: 8, unit: 'ea', price: 425.00, desc: 'KraftMaid 36" Base Cabinet Natural Oak' },
      { material: 'Quartz Countertop Calacatta 25.5x96', qty: 3, unit: 'slab', price: 1850.00, desc: 'Calacatta Quartz 96" Slab Polished' },
      { material: 'Red Oak Hardwood 3/4x3-1/4 Unfinished', qty: 800, unit: 'sqft', price: 4.89, desc: 'Red Oak 3/4x3-1/4 Solid Unfinished' },
      { material: 'LVP Luxury Vinyl Plank 7x48 Waterproof', qty: 600, unit: 'sqft', price: 3.25, desc: 'LVP 7"x48" Waterproof Click-Lock' },
      { type: 'discount', desc: 'Builder Program Discount 7%', discountPct: 7 },
      { type: 'note', desc: 'All cabinets custom order. Lead time 6-8 weeks. Prices subject to change.' },
    ],
    subtotal: 20347.00,
    total: 18922.71,
  },
  {
    supplier: 'BMC Stock Holdings',
    quoteNumber: 'BMC-FL-8945',
    quoteDate: '2026-02-10',
    project: 'Johnson Custom Home',
    items: [
      { material: 'Andersen 400 Series Double-Hung 36x60', qty: 18, unit: 'ea', price: 475.00, desc: 'Andersen 400 Series DH 3060 White' },
      { material: 'Pella 250 Series Sliding Patio Door 72x80', qty: 3, unit: 'ea', price: 1195.00, desc: 'Pella 250 Sliding Patio 72x80' },
      { material: 'KraftMaid Base Cabinet 36in Oak', qty: 12, unit: 'ea', price: 415.00, desc: 'KraftMaid 36" Base Cab Honey Oak' },
      { material: 'Quartz Countertop Calacatta 25.5x96', qty: 4, unit: 'slab', price: 1795.00, desc: 'Calacatta Classique Quartz Slab' },
      { material: 'Red Oak Hardwood 3/4x3-1/4 Unfinished', qty: 1200, unit: 'sqft', price: 4.75, desc: 'Red Oak 3/4"x3.25" Solid HW Unfinished' },
      { material: 'LVP Luxury Vinyl Plank 7x48 Waterproof', qty: 900, unit: 'sqft', price: 3.15, desc: 'LVP Waterproof 7x48 Click' },
      { type: 'discount', desc: 'Contractor Volume Discount', discountAmt: 1200.00 },
    ],
    subtotal: 23685.00,
    total: 22485.00,
  },
  {
    supplier: '84 Lumber',
    quoteNumber: '84L-2026-0412',
    quoteDate: '2026-02-07',
    project: 'Johnson Custom Home',
    items: [
      { material: 'SPF 2x4x8 #2 Kiln Dried', qty: 300, unit: 'pc', price: 4.29, desc: '2X4-8 SPF #2&BTR KD-HT' },
      { material: 'SPF 2x6x10 #2 Kiln Dried', qty: 150, unit: 'pc', price: 7.85, desc: '2X6-10 SPF #2 KD' },
      { material: 'SPF 2x8x12 #2 Kiln Dried', qty: 80, unit: 'pc', price: 11.75, desc: '2X8-12 SPF #2 KD' },
      { material: 'SYP 2x12x20 #1 Kiln Dried', qty: 24, unit: 'pc', price: 38.50, desc: '2X12-20 SYP #1 KD' },
      { material: 'PT Pine 4x4x10', qty: 30, unit: 'pc', price: 17.95, desc: '4X4-10 PT SYP #2 GC' },
      { material: 'CDX Plywood 3/4 4x8', qty: 60, unit: 'sheet', price: 43.25, desc: '3/4 CDX PLY 4X8' },
      { material: 'OSB Sheathing 7/16 4x8', qty: 90, unit: 'sheet', price: 18.25, desc: '7/16 OSB 4X8 STRUCT' },
      { material: 'Simpson Strong-Tie LUS28 Joist Hanger', qty: 60, unit: 'ea', price: 3.35, desc: 'SIMPSON LUS28 HANGER' },
      { type: 'fee', desc: 'Rush Order Processing', price: 125.00 },
      { type: 'subtotal_line', desc: 'Material Total' },
    ],
    subtotal: 8149.50,
    total: 8274.50,
  },
];

async function run() {
  const client = new Client({
    host: 'aws-0-us-west-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.xgpjwpwhtfmbvoqtvete',
    password: '20VnRqOshqfKfKRU',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected!');

  // 1. Create new suppliers
  const supplierMap = {};
  for (const s of SUPPLIERS) {
    if (s.existing) {
      supplierMap[s.name] = s.id;
    } else {
      const res = await client.query(
        `INSERT INTO suppliers (organization_id, name, normalized_name) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING RETURNING id`,
        [ORG_ID, s.name, s.name.toLowerCase().trim()]
      );
      if (res.rows.length > 0) {
        supplierMap[s.name] = res.rows[0].id;
        console.log(`Created supplier: ${s.name} -> ${res.rows[0].id}`);
      } else {
        // Already exists, look up
        const lookup = await client.query(
          'SELECT id FROM suppliers WHERE name = $1 AND organization_id = $2',
          [s.name, ORG_ID]
        );
        supplierMap[s.name] = lookup.rows[0].id;
        console.log(`Supplier exists: ${s.name} -> ${lookup.rows[0].id}`);
      }
    }
  }

  // 2. Create new materials
  const materialMap = {};
  for (const m of MATERIALS) {
    if (m.existing) {
      materialMap[m.name] = m.id;
    } else {
      const res = await client.query(
        `INSERT INTO materials (organization_id, canonical_name, category_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING RETURNING id`,
        [ORG_ID, m.name, m.cat]
      );
      if (res.rows.length > 0) {
        materialMap[m.name] = res.rows[0].id;
        console.log(`Created material: ${m.name}`);
      } else {
        const lookup = await client.query(
          'SELECT id FROM materials WHERE canonical_name = $1 AND organization_id = $2',
          [m.name, ORG_ID]
        );
        if (lookup.rows.length > 0) {
          materialMap[m.name] = lookup.rows[0].id;
        }
      }
    }
  }

  // 3. Create documents, quotes, and line items for each quote
  let quoteCount = 0;
  for (const q of QUOTES) {
    const supplierId = supplierMap[q.supplier];
    if (!supplierId) {
      console.error(`Supplier not found: ${q.supplier}`);
      continue;
    }

    // Create document record (simulates uploaded PDF)
    const docRes = await client.query(
      `INSERT INTO documents (organization_id, file_name, file_size_bytes, file_type, file_path, source, status, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
      [ORG_ID, `${q.quoteNumber}.pdf`, 150000, 'pdf', `${ORG_ID}/test_${q.quoteNumber}.pdf`, 'upload', 'approved']
    );
    const docId = docRes.rows[0].id;

    // Create quote (verified = true so it shows in reports)
    const quoteRes = await client.query(
      `INSERT INTO quotes (organization_id, document_id, supplier_id, quote_number, quote_date,
       project_name, subtotal, total_amount, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING id`,
      [ORG_ID, docId, supplierId, q.quoteNumber, q.quoteDate, q.project, q.subtotal, q.total]
    );
    const quoteId = quoteRes.rows[0].id;

    // Update document with quote_id
    await client.query('UPDATE documents SET quote_id = $1 WHERE id = $2', [quoteId, docId]);

    // Create line items
    let sortOrder = 0;
    for (const item of q.items) {
      const lineType = item.type || 'material';
      const materialId = item.material ? (materialMap[item.material] || null) : null;

      let unitPrice = item.price || null;
      let qty = item.qty || null;
      let unit = item.unit || null;
      let extendedPrice = (unitPrice && qty) ? unitPrice * qty : null;
      let lineTotal = extendedPrice;
      let discountPct = item.discountPct || null;
      let discountAmt = item.discountAmt || null;
      let effectiveUnitPrice = unitPrice;

      // For discount lines
      if (lineType === 'discount') {
        unitPrice = null;
        qty = null;
        unit = null;
        extendedPrice = null;
        if (discountAmt) lineTotal = -discountAmt;
        else lineTotal = null;
        effectiveUnitPrice = null;
      }

      // For fee lines
      if (lineType === 'fee') {
        qty = 1;
        unit = 'ea';
        extendedPrice = unitPrice;
        lineTotal = unitPrice;
        effectiveUnitPrice = unitPrice;
      }

      // For subtotal/note lines
      if (lineType === 'subtotal_line' || lineType === 'note') {
        unitPrice = null;
        qty = null;
        unit = null;
        extendedPrice = null;
        lineTotal = lineType === 'subtotal_line' ? q.subtotal : null;
        effectiveUnitPrice = null;
      }

      await client.query(
        `INSERT INTO line_items (quote_id, raw_description, quantity, unit, unit_price,
         extended_price, discount_pct, discount_amount, line_total, sort_order,
         material_id, line_type, effective_unit_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [quoteId, item.desc, qty, unit, unitPrice, extendedPrice,
         discountPct, discountAmt, lineTotal, sortOrder,
         materialId, lineType, effectiveUnitPrice]
      );
      sortOrder++;
    }

    quoteCount++;
    console.log(`Created quote: ${q.quoteNumber} (${q.supplier}) - ${q.items.length} items`);
  }

  console.log(`\nDone! Created ${quoteCount} quotes with test data.`);

  // Verify counts
  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM suppliers WHERE organization_id = '${ORG_ID}') AS suppliers,
      (SELECT COUNT(*) FROM materials WHERE organization_id = '${ORG_ID}' AND is_active = true) AS materials,
      (SELECT COUNT(*) FROM quotes WHERE organization_id = '${ORG_ID}') AS quotes,
      (SELECT COUNT(*) FROM line_items li JOIN quotes q ON li.quote_id = q.id WHERE q.organization_id = '${ORG_ID}') AS line_items,
      (SELECT COUNT(*) FROM line_items li JOIN quotes q ON li.quote_id = q.id WHERE q.organization_id = '${ORG_ID}' AND li.line_type = 'material') AS material_items,
      (SELECT COUNT(*) FROM line_items li JOIN quotes q ON li.quote_id = q.id WHERE q.organization_id = '${ORG_ID}' AND li.line_type != 'material') AS non_material_items
  `);
  console.log('\nDatabase counts:', counts.rows[0]);

  await client.end();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
