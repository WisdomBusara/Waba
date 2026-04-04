import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
let lines = code.split('\n');

const fixLine = (lineNum: number, search: string, replace: string) => {
  const i = lineNum - 1;
  if (lines[i].includes(search)) {
    lines[i] = lines[i].replace(search, replace);
  }
};

fixLine(1250, 'id,', 'id as string,');
fixLine(1298, 'attachmentId,', 'attachmentId as string,');

fs.writeFileSync('server.ts', lines.join('\n'));
console.log('Fixed specific lines');
