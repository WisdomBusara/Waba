import fs from 'fs';

let code = fs.readFileSync('server/database.ts', 'utf8');
code = code.replace(
  "export async function initializeDatabase() {",
  "export async function initializeDatabase() {\n  try {"
);

const endOfInit = code.indexOf("console.log('Database initialized successfully');");
const afterInit = code.indexOf("}", endOfInit);

code = code.substring(0, afterInit + 1) + "\n  } catch (e) {\n    console.error('Failed to initialize database:', e);\n  }" + code.substring(afterInit + 1);

fs.writeFileSync('server/database.ts', code);
console.log('Added try/catch to initializeDatabase');
