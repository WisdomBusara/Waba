import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
let lines = code.split('\n');

const fixLine = (lineNum: number, search: string, replace: string) => {
  if (lines[lineNum].includes(search)) {
    lines[lineNum] = lines[lineNum].replace(search, replace);
  }
};

fixLine(592, 'totalItems: total }));', 'totalItems: total });');
fixLine(917, 'totalItems: total }));', 'totalItems: total });');
fixLine(926, '.get());', '.get()));');
fixLine(971, 'new Date().toISOString());', 'new Date().toISOString()));');
fixLine(1232, 'new Date().toISOString());', 'new Date().toISOString()));');
fixLine(1284, 'new Date().toISOString());', 'new Date().toISOString()));');
fixLine(1306, 'path.join(__dirname, \'dist\'));', 'path.join(__dirname, \'dist\')));');

fs.writeFileSync('server.ts', lines.join('\n'));
console.log('Fixed specific lines');
