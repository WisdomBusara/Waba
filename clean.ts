import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Remove all (await and )
code = code.replace(/\(await /g, "");
// This will remove the matching closing parenthesis.
// Wait, this is dangerous. Let's just remove `(await db.prepare` -> `db.prepare`
code = code.replace(/\(await db\.prepare/g, "db.prepare");
// And then remove the closing parenthesis.
// Actually, it's easier to just use ts-morph on the current file, but first let's clean up `(await db.prepare`
code = code.replace(/\(await db\.prepare\(([^)]+)\)\.(get|all|run)\(([^)]*)\)\)/g, "db.prepare($1).$2($3)");

fs.writeFileSync('server.ts', code);
console.log('Cleaned server.ts');
