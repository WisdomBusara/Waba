import fs from 'fs';

let code = fs.readFileSync('server/database.ts', 'utf8');

// Remove the bad catch block at the top
code = code.replace(
  "import { Pool }\n  } catch (e) {\n    console.error('Failed to initialize database:', e);\n  } from 'pg';",
  "import { Pool } from 'pg';"
);

// Add the try/catch properly
code = code.replace(
  "export async function initializeDatabase() {\n  try {",
  "export async function initializeDatabase() {"
);

code = code.replace(
  "export async function initializeDatabase() {",
  "export async function initializeDatabase() {\n  try {"
);

const initStart = code.indexOf("export async function initializeDatabase() {");
const initEnd = code.indexOf("export async function backupDatabase() {");

let initFunc = code.substring(initStart, initEnd);
initFunc = initFunc.replace(/}\n$/, "  } catch (e) {\n    console.error('Failed to initialize database:', e);\n  }\n}\n");

code = code.substring(0, initStart) + initFunc + code.substring(initEnd);

fs.writeFileSync('server/database.ts', code);
console.log('Fixed database.ts');
