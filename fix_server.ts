import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Undo previous double awaits
code = code.replace(/\(await \(await /g, "(await ");
code = code.replace(/\)\)\)/g, "))");

// Fix the ones that weren't caught
code = code.replace(/db\.prepare\(([^)]+)\)\.get\(\)\?\.count/g, "(await db.prepare($1).get())?.count");
code = code.replace(/db\.prepare\(([^)]+)\)\.get\(\)\?\.value/g, "(await db.prepare($1).get())?.value");
code = code.replace(/db\.prepare\('([^']+)'\)\.run\(([^)]+)\)/g, "(await db.prepare('$1').run($2))");

fs.writeFileSync('server.ts', code);
console.log('Fixed server.ts');
