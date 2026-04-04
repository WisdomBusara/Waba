import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
let lines = code.split('\n');

const fixLine = (lineNum: number, search: string, replace: string) => {
  const i = lineNum - 1;
  if (lines[i].includes(search)) {
    lines[i] = lines[i].replace(search, replace);
  }
};

fixLine(593, 'totalItems: total }));', 'totalItems: total });');
fixLine(918, 'totalItems: total }));', 'totalItems: total });');
fixLine(927, '.get());', '.get()));');
fixLine(972, 'new Date().toISOString());', 'new Date().toISOString()));');
fixLine(1233, 'new Date().toISOString());', 'new Date().toISOString()));');
fixLine(1285, 'new Date().toISOString());', 'new Date().toISOString()));');
fixLine(1307, 'path.join(__dirname, \'dist\'));', 'path.join(__dirname, \'dist\')));');

fs.writeFileSync('server.ts', lines.join('\n'));
console.log('Fixed specific lines');
