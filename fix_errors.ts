import fs from 'fs';

// Fix script
let scriptCode = fs.readFileSync('scripts/backup-sqlite.ts', 'utf8');
scriptCode = scriptCode.replace("../server/db.ts", "../server/database.ts");
fs.writeFileSync('scripts/backup-sqlite.ts', scriptCode);

// Fix server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
  "new Date()).toISOString(),",
  "new Date().toISOString(),"
);
fs.writeFileSync('server.ts', serverCode);

console.log('Fixed errors');
