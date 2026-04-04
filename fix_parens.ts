import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let openCount = (line.match(/\(/g) || []).length;
  let closeCount = (line.match(/\)/g) || []).length;
  
  if (openCount > closeCount) {
    // Add missing closing parentheses before the semicolon or at the end of the line
    let diff = openCount - closeCount;
    let closing = ')'.repeat(diff);
    if (line.endsWith(';')) {
      lines[i] = line.slice(0, -1) + closing + ';';
    } else if (line.endsWith('; ')) {
      lines[i] = line.slice(0, -2) + closing + '; ';
    } else {
      lines[i] = line + closing;
    }
  }
}

fs.writeFileSync('server.ts', lines.join('\n'));
console.log('Fixed parentheses');
