import fs from 'fs';

const code = fs.readFileSync('server.ts', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('db.prepare') && !lines[i].includes('await') && !lines[i].includes('const insertItem')) {
    console.log('Line ' + (i + 1) + ': ' + lines[i]);
  }
}
