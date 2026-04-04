import fs from 'fs';
import { execSync } from 'child_process';

let code = fs.readFileSync('server.ts', 'utf8');
let lines = code.split('\n');

try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
} catch (e: any) {
  const output = e.stdout.toString();
  const errorLines = output.split('\n');
  for (const errLine of errorLines) {
    const match = errLine.match(/server\.ts\((\d+),\d+\): error TS1005: '\)' expected\./);
    if (match) {
      const lineNum = parseInt(match[1], 10) - 1;
      const line = lines[lineNum];
      if (line.endsWith(';')) {
        lines[lineNum] = line.slice(0, -1) + ');';
      } else if (line.endsWith('; // Also log to console for development')) {
        lines[lineNum] = line.replace(';', ');');
      } else if (line.endsWith('; ')) {
        lines[lineNum] = line.slice(0, -2) + '); ';
      } else {
        lines[lineNum] = line + ')';
      }
    }
  }
}

fs.writeFileSync('server.ts', lines.join('\n'));
console.log('Fixed missing parentheses');
