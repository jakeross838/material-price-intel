const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xgpjwpwhtfmbvoqtvete.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncGp3cHdodGZtYnZvcXR2ZXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0Mjc2NywiZXhwIjoyMDg2MjE4NzY3fQ.iSxBuZ_sXiVB5frP8SOur3_U2_GSzHfTDTEQEStl8Fs';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const USER_ID = 'f2e9d79c-fed8-45af-8fd2-f7f1f765528f';

async function run() {
  const file = fs.readFileSync('test_quote.pdf');
  const uuid = crypto.randomUUID();
  const storagePath = `${ORG_ID}/${uuid}_Gulf_Coast_Quote_GCB-2026-0847.pdf`;

  // STEP 1: Upload to Storage
  console.log('=== STEP 1: UPLOADING PDF TO STORAGE ===');
  const { error: uploadErr } = await sb.storage
    .from('documents')
    .upload(storagePath, file, { contentType: 'application/pdf', upsert: false });
  if (uploadErr) { console.error('Upload failed:', uploadErr.message); return; }
  console.log('Uploaded to:', storagePath);

  // STEP 2: Insert document record (triggers extraction via pg_net)
  console.log('\n=== STEP 2: CREATING DOCUMENT RECORD (triggers AI extraction) ===');
  const { data: doc, error: docErr } = await sb.from('documents').insert({
    organization_id: ORG_ID,
    file_path: storagePath,
    file_type: 'pdf',
    file_name: 'Gulf_Coast_Quote_GCB-2026-0847.pdf',
    file_size_bytes: file.length,
    source: 'upload',
    status: 'pending',
    uploaded_by: USER_ID,
    email_from: null, email_subject: null, email_body: null,
    content_text: null, error_message: null, quote_id: null,
    started_at: null, completed_at: null,
  }).select().single();

  if (docErr) { console.error('Doc insert failed:', docErr.message); return; }
  console.log('Document ID:', doc.id);
  console.log('Status:', doc.status);
  console.log('>> pg_net trigger fires -> calls process-document Edge Function');

  // STEP 3: Poll for status changes
  console.log('\n=== STEP 3: TRACKING EXTRACTION (polling every 3s) ===');
  const startTime = Date.now();
  let lastStatus = doc.status;
  let quoteId = null;

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

    const { data: updated } = await sb.from('documents')
      .select('status, error_message, quote_id, started_at, completed_at')
      .eq('id', doc.id).single();

    if (updated.status !== lastStatus) {
      console.log(`[${elapsed}s] Status changed: ${lastStatus} -> ${updated.status}`);
      lastStatus = updated.status;

      if (updated.status === 'processing') {
        console.log('   Edge Function is downloading PDF and calling Claude AI...');
      }
    } else {
      console.log(`[${elapsed}s] Still ${updated.status}...`);
    }

    if (updated.error_message) {
      console.log('   ERROR:', updated.error_message);
    }

    if (['completed', 'review_needed', 'failed'].includes(updated.status)) {
      quoteId = updated.quote_id;
      console.log('\n=== EXTRACTION FINISHED ===');
      console.log('Final status:', updated.status);
      console.log('Started:', updated.started_at);
      console.log('Completed:', updated.completed_at);
      if (updated.error_message) console.log('Error:', updated.error_message);
      break;
    }
  }

  if (!quoteId) {
    console.log('\nExtraction did not complete within timeout. Check Edge Function logs.');
    return;
  }

  // STEP 4: Show extracted data
  console.log('\n=== STEP 4: EXTRACTED DATA ===');
  const { data: quote } = await sb.from('quotes')
    .select('*, suppliers(name, contact_name, contact_phone, contact_email)')
    .eq('id', quoteId).single();

  console.log('--- Quote ---');
  console.log('Quote #:', quote.quote_number);
  console.log('Date:', quote.quote_date);
  console.log('Project:', quote.project_name);
  console.log('Supplier:', quote.suppliers?.name);
  console.log('  Contact:', quote.suppliers?.contact_name);
  console.log('  Phone:', quote.suppliers?.contact_phone);
  console.log('  Email:', quote.suppliers?.contact_email);
  console.log('Payment Terms:', quote.payment_terms);
  console.log('Valid Until:', quote.valid_until);
  console.log('Confidence:', (quote.confidence_score * 100).toFixed(0) + '%');

  console.log('\n--- Totals ---');
  console.log('Subtotal:', '$' + quote.subtotal?.toFixed(2));
  console.log('Delivery:', '$' + quote.delivery_cost?.toFixed(2));
  console.log('Tax:', '$' + quote.tax_amount?.toFixed(2), '(' + ((quote.tax_rate || 0) * 100).toFixed(0) + '%)');
  console.log('TOTAL:', '$' + quote.total_amount?.toFixed(2));

  const { data: items } = await sb.from('line_items')
    .select('raw_description, quantity, unit, unit_price, line_total')
    .eq('quote_id', quoteId).order('sort_order');

  console.log('\n--- Line Items (' + items.length + ') ---');
  items.forEach((item, i) => {
    console.log(`${i + 1}. ${item.raw_description}`);
    console.log(`   ${item.quantity} ${item.unit} @ $${item.unit_price?.toFixed(2)} = $${item.line_total?.toFixed(2)}`);
  });

  // Validation warnings
  const raw = quote.raw_extraction;
  if (raw?.validation_warnings?.length > 0) {
    console.log('\n--- Validation Warnings ---');
    raw.validation_warnings.forEach(w => console.log('  ⚠', w.message));
  } else {
    console.log('\n--- No validation warnings (clean extraction!) ---');
  }

  console.log('\n=== DONE ===');
  console.log('View in browser: http://localhost:5173/quotes/' + quoteId);
  console.log('The quote appears on /quotes, and after approval, materials appear on /materials and /search');
}

run().catch(e => console.error('Fatal:', e.message));
