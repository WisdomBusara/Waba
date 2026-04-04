import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('initializeDatabase')) {
  code = code.replace(
    "import dbModule from './server/db.ts';",
    "import dbModule, { initializeDatabase } from './server/db.ts';"
  );
  
  code = code.replace(
    "async function startServer() {",
    "async function startServer() {\n  await initializeDatabase();"
  );
  
  fs.writeFileSync('server.ts', code);
  console.log('Added initializeDatabase call');
}
