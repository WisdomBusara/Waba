import { Pool } from 'pg';

async function test() {
  const cs = 'postgresql://postgres:Hun@Ba55W0rd@50?@db.udtvbhjsdjogtwgyxgdp.supabase.co:6543/postgres';
  console.log('Testing:', cs);
  const pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query('SELECT 1');
    console.log('Success!');
  } catch (e) {
    console.error('Failed:', e.message);
  }
  await pool.end();
}

test();
