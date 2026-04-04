import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Fix specific known errors
code = code.replace(/\(await db\.prepare\(([^)]+)\)\.get\(\)\)\?\.count/g, "(await db.prepare($1).get())?.count");
code = code.replace(/\(await db\.prepare\(([^)]+)\)\.get\(\)\)\?\.value/g, "(await db.prepare($1).get())?.value");

// Remove extra closing parentheses that are preceded by an await db.prepare call
// This is tricky. Let's just use a regex to find all `(await db.prepare(...).method(...)))` and replace with `(await db.prepare(...).method(...))`
code = code.replace(/\(await db\.prepare\(([^)]+)\)\.(get|all|run)\(([^)]*)\)\)\)/g, "(await db.prepare($1).$2($3))");
code = code.replace(/\(await db\.prepare\(([^)]+)\)\.(get|all|run)\(([^)]*)\)\)/g, "(await db.prepare($1).$2($3))");

// Actually, let's just do a simple replacement for the known bad patterns
code = code.replace(/\)\)\)/g, "))");
code = code.replace(/\)\) as any/g, ") as any");
code = code.replace(/\)\) \|\| 0/g, ") || 0");
code = code.replace(/\)\), totalItems/g, "), totalItems");
code = code.replace(/\)\);/g, ");");

fs.writeFileSync('server.ts', code);
console.log('Fixed server.ts');
