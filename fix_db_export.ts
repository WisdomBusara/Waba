import fs from 'fs';

let code = fs.readFileSync('server/db.ts', 'utf8');
code += '\nexport default db;\n';
fs.writeFileSync('server/db.ts', code);
console.log('Added default export');
