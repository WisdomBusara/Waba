import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
let lines = code.split('\n');

lines.splice(1228, 2);

fs.writeFileSync('server.ts', lines.join('\n'));
console.log('Fixed extra braces');
