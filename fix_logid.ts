import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "logAudit(req, 'DELETE', 'AssetMaintenanceLog', logId, `Deleted maintenance log ${logId}`);",
  "logAudit(req, 'DELETE', 'AssetMaintenanceLog', logId as string, `Deleted maintenance log ${logId}`);"
);
fs.writeFileSync('server.ts', code);
console.log('Fixed logId type');
