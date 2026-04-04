import { Pool } from 'pg';

async function test() {
  const pool = new Pool({
    host: 'db.udtvbhjsdjogtwgyxgdp.supabase.co',
    port: 6543,
    user: 'postgres',
    password: 'Hun@Ba55W0rd@50?',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  try {
    await pool.query('SELECT 1');
    console.log('Success!');
  } catch (e) {
    console.error('Failed:', e.message);
  }
  await pool.end();
}

test();
