import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "import dbModule, { initializeDatabase } from './server/database.ts';",
  "import { db, initializeDatabase } from './server/database.ts';"
);
code = code.replace(
  "const db = (dbModule as any).default || dbModule;",
  ""
);
fs.writeFileSync('server.ts', code);
console.log('Updated server.ts');
