import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "(await db.prepare('UPDATE users SET lastActive = ? WHERE id = ?').run(\n                    new Date().toISOString(),\n          user.id\n        );",
  "(await db.prepare('UPDATE users SET lastActive = ? WHERE id = ?').run(\n          new Date().toISOString(),\n          user.id\n        ));"
);
fs.writeFileSync('server.ts', code);
console.log('Fixed syntax');
