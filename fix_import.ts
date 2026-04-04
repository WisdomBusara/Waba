import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "import dbModule, { initializeDatabase } from './server/db.ts';",
  "import dbModule, { initializeDatabase } from './server/database.ts';"
);
code = code.replace(
  "const { backupDatabase } = await import('./server/db.js');",
  "const { backupDatabase } = await import('./server/database.ts');"
);
fs.writeFileSync('server.ts', code);
console.log('Updated server.ts');
