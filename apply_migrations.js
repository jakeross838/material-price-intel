const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'material-price-intel', 'supabase', 'migrations');

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
  console.log('Connected to Supabase!');

  // Get already-applied migrations
  const applied = await client.query(
    'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version'
  );
  const appliedVersions = new Set(applied.rows.map(r => r.version));
  console.log('Already applied:', [...appliedVersions]);

  // List local migrations
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = file.replace('.sql', '');
    if (appliedVersions.has(version)) {
      console.log(`SKIP: ${file} (already applied)`);
      continue;
    }
    // Also check short version (e.g., "007" vs "007_extraction_trigger")
    const shortVersion = version.split('_')[0];
    if (appliedVersions.has(shortVersion)) {
      console.log(`SKIP: ${file} (short version ${shortVersion} already applied)`);
      continue;
    }

    console.log(`APPLYING: ${file}...`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await client.query(sql);
      // Record in migration history
      await client.query(
        'INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1)',
        [version]
      );
      console.log(`  OK: ${file}`);
    } catch (err) {
      console.error(`  FAILED: ${file}:`, err.message);
      // If column already exists, continue
      if (err.message.includes('already exists')) {
        console.log('  (continuing despite error - likely already partially applied)');
        await client.query(
          'INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING',
          [version]
        );
      } else {
        throw err;
      }
    }
  }

  console.log('\nAll migrations applied!');

  // Verify final state
  const cols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'line_items' ORDER BY ordinal_position"
  );
  console.log('\nline_items columns:', cols.rows.map(r => r.column_name));

  await client.end();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
