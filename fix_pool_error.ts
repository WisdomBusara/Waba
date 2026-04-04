import fs from 'fs';

let code = fs.readFileSync('server/database.ts', 'utf8');

if (!code.includes("pool.on('error'")) {
  code = code.replace(
    "ssl: { rejectUnauthorized: false }\n});",
    "ssl: { rejectUnauthorized: false }\n});\n\npool.on('error', (err) => {\n  console.error('Unexpected error on idle client', err);\n});"
  );
  fs.writeFileSync('server/database.ts', code);
  console.log('Added pool error handler');
} else {
  console.log('Pool error handler already exists');
}
