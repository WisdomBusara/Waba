import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const sizeResult = await db.prepare(\"SELECT pg_database_size(current_database()) as size\").get() as any;\n        fileSize = sizeResult ? parseInt(sizeResult.size, 10) : 0;",
  "try { const stats = fs.statSync('server/database.sqlite'); fileSize = stats.size; } catch(e) {}"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed validate endpoint for sqlite');
