import { Pool } from 'pg';
import dns from 'dns';

async function test() {
  dns.lookup('db.udtvbhjsdjogtwgyxgdp.supabase.co', 4, async (err, address) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('IPv4 Address:', address);
    
    const connectionStrings = [
      'postgresql://postgres:Hun%40Ba55W0rd%4050%3F@' + address + ':5432/postgres',
      'postgresql://postgres:Hun%40Ba55W0rd%254050%3F@' + address + ':5432/postgres'
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
  });
}

test();
