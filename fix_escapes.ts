import fs from 'fs';

let code = fs.readFileSync('components/Assets.tsx', 'utf8');
code = code.replace(/\\\`/g, '\`');
code = code.replace(/\\\$/g, '$');
fs.writeFileSync('components/Assets.tsx', code);
console.log('Fixed escaped characters');
