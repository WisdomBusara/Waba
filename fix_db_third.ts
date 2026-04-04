import fs from 'fs';

let code = fs.readFileSync('server/database.ts', 'utf8');

code = code.replace(
  "export async function initializeDatabase() {\n  try {\n    console.log('Initializing Supabase PostgreSQL database...');",
  "export async function initializeDatabase() {\n    console.log('Initializing Supabase PostgreSQL database...');"
);

code = code.replace(
  "  } catch (e) {\n    console.error('Failed to initialize database:', e);\n  }\n}\n\nexport async function backupDatabase() {",
  "}\n\nexport async function backupDatabase() {"
);

fs.writeFileSync('server/database.ts', code);
console.log('Fixed try/catch');
