import fs from 'fs';

let code = fs.readFileSync('server/database.ts', 'utf8');
code = code.replace(
  "const backupPath = path.join(backupDir, \\`database-backup-\\${timestamp}.sqlite\\`);",
  "const backupPath = path.join(backupDir, `database-backup-${timestamp}.sqlite`);"
);
fs.writeFileSync('server/database.ts', code);
console.log('Fixed syntax');
