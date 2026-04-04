import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const newValidate = `
  app.get('/api/db/validate', async (req, res) => {
    try {
      let isHealthy = true;
      let integrityMessage = 'ok';
      let fileSize = 0;
      let counts = {
        customers: 0, meters: 0, readings: 0, invoices: 0, payments: 0, users: 0, assets: 0
      };

      try {
        await db.prepare('SELECT 1').get();
        
        const sizeResult = await db.prepare("SELECT pg_database_size(current_database()) as size").get();
        fileSize = sizeResult ? parseInt(sizeResult.size, 10) : 0;

        counts.customers = parseInt((await db.prepare('SELECT count(*) as count FROM customers').get())?.count || '0', 10);
        counts.meters = parseInt((await db.prepare('SELECT count(*) as count FROM meters').get())?.count || '0', 10);
        counts.readings = parseInt((await db.prepare('SELECT count(*) as count FROM meter_readings').get())?.count || '0', 10);
        counts.invoices = parseInt((await db.prepare('SELECT count(*) as count FROM invoices').get())?.count || '0', 10);
        counts.payments = parseInt((await db.prepare('SELECT count(*) as count FROM payments').get())?.count || '0', 10);
        counts.users = parseInt((await db.prepare('SELECT count(*) as count FROM users').get())?.count || '0', 10);
        counts.assets = parseInt((await db.prepare('SELECT count(*) as count FROM assets').get())?.count || '0', 10);
      } catch (e: any) {
        isHealthy = false;
        integrityMessage = 'Database connection failed: ' + e.message;
      }

      res.json({
        status: isHealthy ? 'Healthy' : 'Corrupted',
        integrityMessage: integrityMessage,
        tableCounts: counts,
        fileSize: fileSize,
        lastValidated: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Diag failed', error: err.message });
    }
  });
`;

const startIdx = code.indexOf("app.get('/api/db/validate', async (req, res) => {");
const endIdx = code.indexOf("app.get('/api/db/backup'", startIdx);

code = code.substring(0, startIdx) + newValidate.trim() + "\n\n  " + code.substring(endIdx);

fs.writeFileSync('server.ts', code);
console.log('Fixed validate endpoint');
