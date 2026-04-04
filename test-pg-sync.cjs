const Client = require('pg-sync');
const client = new Client();
client.connect('postgresql://postgres:Hun%40Ba55W0rd%4050%3F@db.udtvbhjsdjogtwgyxgdp.supabase.co:5432/postgres');
const res = client.query('SELECT 1 as num');
console.log(res);
