import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  ".get(...params))?.count || 0;",
  ".get(...params) as any)?.count || 0;"
);

code = code.replace(
  ".get(...params))?.count || 0;",
  ".get(...params) as any)?.count || 0;"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed more types');
