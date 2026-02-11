const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://xgpjwpwhtfmbvoqtvete.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncGp3cHdodGZtYnZvcXR2ZXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDI3NjcsImV4cCI6MjA4NjIxODc2N30.Iixv6S3VGZF2VOuJ-gkUubm2JTbE9pCAvKQvLtTKnJ8'
);

async function test() {
  // Try signing in
  const passwords = ['r0ssbuilt130', '20VnRqOshqfKfKRU', 'password', 'Password1!', 'rossbuilt'];
  let signedIn = false;

  for (const pw of passwords) {
    const { data, error } = await sb.auth.signInWithPassword({
      email: 'jake@rossbuilt.com',
      password: pw
    });
    if (!error) {
      console.log('Signed in with password:', pw);
      signedIn = true;

      // Test queries as authenticated user
      const { count: approvedCount } = await sb.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      console.log('Approved documents:', approvedCount);

      const { data: quotes, error: qErr } = await sb.from('quotes').select('id, quote_number').limit(5);
      console.log('Quotes visible:', quotes ? quotes.length : 0, qErr ? qErr.message : 'OK');

      const { data: items, error: iErr } = await sb.from('line_items')
        .select('id, raw_description, unit_price, effective_unit_price, line_type')
        .eq('line_type', 'material')
        .not('material_id', 'is', null)
        .limit(3);
      console.log('Material items visible:', items ? items.length : 0, iErr ? iErr.message : 'OK');

      const { data: suppliers } = await sb.from('suppliers').select('id, name').limit(5);
      console.log('Suppliers visible:', suppliers ? suppliers.length : 0);

      const { data: materials } = await sb.from('materials').select('id, canonical_name').eq('is_active', true).limit(5);
      console.log('Materials visible:', materials ? materials.length : 0);

      break;
    } else {
      console.log('Failed with', pw, ':', error.message);
    }
  }

  if (!signedIn) {
    console.log('\nCould not sign in. Testing without auth (anon key only):');
    const { data: quotes, error: qErr } = await sb.from('quotes').select('id, quote_number').limit(5);
    console.log('Quotes (no auth):', quotes ? quotes.length : 0, qErr ? qErr.message : 'OK');

    const { data: docs, error: dErr } = await sb.from('documents').select('id, status').limit(5);
    console.log('Documents (no auth):', docs ? docs.length : 0, dErr ? dErr.message : 'OK');
  }
}

test().catch(e => console.error(e));
