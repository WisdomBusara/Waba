import { Pool } from 'pg';

async function test() {
  const connectionStrings = [
    'postgresql://postgres:Hun%40Ba55W0rd%4050%3F@db.udtvbhjsdjogtwgyxgdp.supabase.co:5432/postgres',
    'postgresql://postgres:Hun@Ba55W0rd%4050?@db.udtvbhjsdjogtwgyxgdp.supabase.co:5432/postgres',
    'postgresql://postgres:Hun%40Ba55W0rd%254050%3F@db.udtvbhjsdjogtwgyxgdp.supabase.co:5432/postgres'
  ];

  for (const cs of connectionStrings) {
    console.log('Testing:', cs);
    const pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });
    try {
      await pool.query('SELECT 1');
      console.log('Success!');
      break;
    } catch (e) {
      console.error('Failed:', e.message);
    }
    await pool.end();
  }
}

test();
