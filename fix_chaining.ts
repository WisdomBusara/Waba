import fs from 'fs';

let code = fs.readFileSync('components/DatabaseDiagnostics.tsx', 'utf8');

code = code.replace(/stats\?\.tableCounts\./g, 'stats?.tableCounts?.');

fs.writeFileSync('components/DatabaseDiagnostics.tsx', code);
console.log('Fixed optional chaining');
