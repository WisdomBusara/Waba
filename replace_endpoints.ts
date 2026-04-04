import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const validateReplacement = `
  app.get('/api/db/validate', async (req, res) => {
    try {
      // PostgreSQL doesn't have PRAGMA integrity_check, we'll just check if we can query
      let isHealthy = true;
      let integrityMessage = 'ok';
      try {
        await db.prepare('SELECT 1').get();
      } catch (e) {
        isHealthy = false;
        integrityMessage = 'Database connection failed';
      }

      // We can get database size in PostgreSQL
      const sizeResult = await db.prepare("SELECT pg_database_size(current_database()) as size").get();
      const fileSize = sizeResult ? parseInt(sizeResult.size, 10) : 0;

      const counts = {
        customers: parseInt((await db.prepare('SELECT count(*) as count FROM customers').get())?.count || '0', 10),
        meters: parseInt((await db.prepare('SELECT count(*) as count FROM meters').get())?.count || '0', 10),
        readings: parseInt((await db.prepare('SELECT count(*) as count FROM meter_readings').get())?.count || '0', 10),
        invoices: parseInt((await db.prepare('SELECT count(*) as count FROM invoices').get())?.count || '0', 10),
        payments: parseInt((await db.prepare('SELECT count(*) as count FROM payments').get())?.count || '0', 10),
        users: parseInt((await db.prepare('SELECT count(*) as count FROM users').get())?.count || '0', 10),
        assets: parseInt((await db.prepare('SELECT count(*) as count FROM assets').get())?.count || '0', 10),
      };

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

const backupReplacement = `
  app.get('/api/db/backup', checkRole(['Admin']), async (req, res) => {
    try {
      const { backupDatabase } = await import('./server/db.js');
      const backupPath = await backupDatabase();
      if (fs.existsSync(backupPath)) {
        res.download(backupPath, \`database_backup_\${new Date().toISOString().split('T')[0]}.json\`, (err) => {
          // Clean up the backup file after sending
          if (!err) {
            fs.unlinkSync(backupPath);
          }
        });
      } else {
        res.status(404).json({ message: 'Backup failed to generate' });
      }
    } catch (err: any) {
      res.status(500).json({ message: 'Backup failed', error: err.message });
    }
  });
`;

// Find the ranges to replace
const validateStart = code.indexOf("app.get('/api/db/validate'");
const validateEnd = code.indexOf("});", code.indexOf("res.status(500).json({ message: 'Diag failed'", validateStart)) + 3;

const backupStart = code.indexOf("app.get('/api/db/backup'");
const backupEnd = code.indexOf("});", code.indexOf("res.status(500).json({ message: 'Backup failed'", backupStart)) + 3;

code = code.substring(0, validateStart) + validateReplacement.trim() + "\n\n" + backupReplacement.trim() + code.substring(backupEnd);

fs.writeFileSync('server.ts', code);
console.log('Replaced validate and backup endpoints');
