const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://xgpjwpwhtfmbvoqtvete.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncGp3cHdodGZtYnZvcXR2ZXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0Mjc2NywiZXhwIjoyMDg2MjE4NzY3fQ.iSxBuZ_sXiVB5frP8SOur3_U2_GSzHfTDTEQEStl8Fs'
);

const QUOTE_ID = 'dbba9629-211f-42b8-8258-28a78dffa54e';

async function run() {
  // STEP 1: Approve the quote
  console.log('=== STEP 1: APPROVING QUOTE ===');
  const { error: approveErr } = await sb
    .from('quotes')
    .update({ is_verified: true })
    .eq('id', QUOTE_ID);

  if (approveErr) { console.error('Approve failed:', approveErr.message); return; }
  console.log('Quote approved! is_verified = true');
  console.log('>> pg_net trigger fires -> calls normalize-materials Edge Function');

  // Also mark the document as approved
  await sb.from('documents').update({ status: 'approved' }).eq('quote_id', QUOTE_ID);
  console.log('Document status set to approved');

  // STEP 2: Wait for normalization (~10-20s)
  console.log('\n=== STEP 2: WAITING FOR NORMALIZATION ===');
  const startTime = Date.now();

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

    // Check if any line items have material_id set
    const { data: linked } = await sb
      .from('line_items')
      .select('id, material_id')
      .eq('quote_id', QUOTE_ID)
      .not('material_id', 'is', null);

    const linkedCount = linked?.length ?? 0;
    console.log(`[${elapsed}s] ${linkedCount}/10 line items linked to materials...`);

    if (linkedCount >= 8) {
      console.log('Normalization complete!');
      break;
    }
  }

  // STEP 3: Show line items with their matched materials
  console.log('\n=== STEP 3: LINE ITEMS WITH MATERIAL MATCHES ===');
  const { data: items } = await sb
    .from('line_items')
    .select('raw_description, quantity, unit, unit_price, material_id, materials(canonical_name, species, dimensions, grade, treatment)')
    .eq('quote_id', QUOTE_ID)
    .order('sort_order');

  items.forEach((item, i) => {
    const mat = item.materials;
    const match = mat ? `-> ${mat.canonical_name}` : '(no match)';
    console.log(`${i + 1}. ${item.raw_description}`);
    console.log(`   ${item.quantity} ${item.unit} @ $${item.unit_price?.toFixed(2)}`);
    console.log(`   Material: ${match}`);
    if (mat) {
      const details = [
        mat.species && `Species: ${mat.species}`,
        mat.dimensions && `Dims: ${mat.dimensions}`,
        mat.grade && `Grade: ${mat.grade}`,
        mat.treatment && `Treatment: ${mat.treatment}`,
      ].filter(Boolean).join(' | ');
      if (details) console.log(`   ${details}`);
    }
    console.log('');
  });

  // STEP 4: Show all canonical materials in the system
  console.log('=== STEP 4: ALL CANONICAL MATERIALS ===');
  const { data: materials } = await sb
    .from('materials')
    .select('canonical_name, species, dimensions, grade, treatment, unit_of_measure, material_aliases(alias)')
    .eq('is_active', true)
    .order('canonical_name');

  console.log(`Total materials: ${materials.length}\n`);
  materials.forEach((m, i) => {
    const aliases = m.material_aliases?.map(a => a.alias) ?? [];
    console.log(`${i + 1}. ${m.canonical_name}`);
    const details = [
      m.species && `Species: ${m.species}`,
      m.dimensions && `Dims: ${m.dimensions}`,
      m.grade && `Grade: ${m.grade}`,
      m.treatment && `Treatment: ${m.treatment}`,
      `UOM: ${m.unit_of_measure}`,
    ].filter(Boolean).join(' | ');
    console.log(`   ${details}`);
    if (aliases.length > 0) {
      console.log(`   Aliases: ${aliases.join(', ')}`);
    }
    console.log('');
  });

  // STEP 5: Price comparison - Ipe from both suppliers
  console.log('=== STEP 5: PRICE COMPARISON (Ipe Decking) ===');
  const { data: ipeItems } = await sb
    .from('line_items')
    .select('raw_description, unit_price, quantity, unit, quotes(quote_date, suppliers(name))')
    .ilike('raw_description', '%ipe%')
    .order('unit_price');

  if (ipeItems && ipeItems.length > 0) {
    console.log('Ipe pricing across all quotes:\n');
    ipeItems.forEach(item => {
      const q = item.quotes;
      const supplier = q?.suppliers?.name ?? 'Unknown';
      console.log(`  ${supplier} (${q?.quote_date ?? 'no date'})`);
      console.log(`    ${item.raw_description}`);
      console.log(`    $${item.unit_price?.toFixed(2)}/${item.unit} x ${item.quantity} = $${(item.unit_price * item.quantity).toFixed(2)}`);
      console.log('');
    });

    if (ipeItems.length >= 2) {
      const prices = ipeItems.map(i => i.unit_price).filter(Boolean);
      const diff = Math.max(...prices) - Math.min(...prices);
      console.log(`  Price spread: $${diff.toFixed(2)}/unit across ${ipeItems.length} quotes`);
    }
  } else {
    console.log('No Ipe items found yet.');
  }

  console.log('\n=== DONE ===');
  console.log('View materials: http://localhost:5173/materials');
  console.log('Search prices: http://localhost:5173/search');
  console.log('Quote detail: http://localhost:5173/quotes/' + QUOTE_ID);
}

run().catch(e => console.error('Fatal:', e.message));
