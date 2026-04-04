import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const maintenanceEndpoints = `
  // --- ASSET MAINTENANCE LOGS ---
  app.get('/api/assets/:id/maintenance', async (req, res) => {
    try {
      const { id } = req.params;
      const logs = (await db.prepare('SELECT m.*, u.name as performedByName FROM asset_maintenance_logs m JOIN users u ON m.performedBy = u.id WHERE m.assetId = ? ORDER BY m.maintenanceDate DESC').all(id));
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch maintenance logs', error: err.message });
    }
  });

  app.post('/api/assets/:id/maintenance', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { id } = req.params;
      const { maintenanceDate, description, cost, photos } = req.body;
      const performedBy = req.headers['x-user-id'] as string;
      const logId = \`MNT-\${Date.now()}\`;
      
      (await db.prepare(
        'INSERT INTO asset_maintenance_logs (id, assetId, maintenanceDate, performedBy, description, cost, photos, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(logId, id, maintenanceDate, performedBy, description, cost, photos ? JSON.stringify(photos) : null, new Date().toISOString()));
      
      logAudit(req, 'CREATE', 'AssetMaintenanceLog', logId, \`Created maintenance log for asset \${id}\`);
      res.status(201).json({ id: logId, assetId: id, maintenanceDate, description });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to create maintenance log', error: err.message });
    }
  });

  app.delete('/api/assets/maintenance/:logId', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { logId } = req.params;
      (await db.prepare('DELETE FROM asset_maintenance_logs WHERE id = ?').run(logId));
      logAudit(req, 'DELETE', 'AssetMaintenanceLog', logId, \`Deleted maintenance log \${logId}\`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to delete maintenance log', error: err.message });
    }
  });

  // --- ASSET BULK UPLOAD ---
  app.post('/api/assets/bulk-upload', checkRole(['Admin', 'Manager']), async (req, res) => {
    try {
      const { assets } = req.body;
      if (!Array.isArray(assets)) {
        return res.status(400).json({ message: 'Invalid payload format. Expected an array of assets.' });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const asset of assets) {
        try {
          if (!asset.name || !asset.category || !asset.farmId) {
             throw new Error('Missing required fields: name, category, or farmId');
          }
          const id = \`AST-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`;
          (await db.prepare(
            'INSERT INTO assets (id, name, category, description, status, purchaseDate, price, notes, createdAt, locationId, farmId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).run(id, asset.name, asset.category, asset.description, asset.status || 'Active', asset.purchaseDate, asset.price, asset.notes, new Date().toISOString(), asset.locationId, asset.farmId));
          successCount++;
        } catch (e: any) {
          errorCount++;
          errors.push(\`Failed to insert asset \${asset.name || 'Unknown'}: \${e.message}\`);
        }
      }

      logAudit(req, 'CREATE', 'Asset', 'BULK', \`Bulk uploaded \${successCount} assets\`);
      res.json({ success: true, successCount, errorCount, errors });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to process bulk upload', error: err.message });
    }
  });
`;

// Insert before the static file serving block
const insertIndex = code.indexOf("if (process.env.NODE_ENV === 'production') {");
code = code.substring(0, insertIndex) + maintenanceEndpoints + "\n  " + code.substring(insertIndex);

// Also need to update the Asset endpoints to include locationId and farmId
code = code.replace(
  "const { name, category, description, status, purchaseDate, price, notes } = req.body;",
  "const { name, category, description, status, purchaseDate, price, notes, locationId, farmId } = req.body;"
);

code = code.replace(
  "'INSERT INTO assets (id, name, category, description, status, purchaseDate, price, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'",
  "'INSERT INTO assets (id, name, category, description, status, purchaseDate, price, notes, createdAt, locationId, farmId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'"
);

code = code.replace(
  ").run(id, name, category, description, status || 'Active', purchaseDate, price, notes, new Date().toISOString()));",
  ").run(id, name, category, description, status || 'Active', purchaseDate, price, notes, new Date().toISOString(), locationId, farmId));"
);

code = code.replace(
  "'UPDATE assets SET name = ?, category = ?, description = ?, status = ?, purchaseDate = ?, price = ?, notes = ? WHERE id = ?'",
  "'UPDATE assets SET name = ?, category = ?, description = ?, status = ?, purchaseDate = ?, price = ?, notes = ?, locationId = ?, farmId = ? WHERE id = ?'"
);

code = code.replace(
  ").run(name, category, description, status, purchaseDate, price, notes, id as string));",
  ").run(name, category, description, status, purchaseDate, price, notes, locationId, farmId, id as string));"
);

fs.writeFileSync('server.ts', code);
console.log('Added maintenance endpoints and updated asset endpoints');
