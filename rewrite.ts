import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Replace app.get('/path', (req, res) => { with app.get('/path', async (req, res) => {
code = code.replace(/app\.(get|post|put|delete)\('([^']+)',\s*(checkRole\([^)]+\),\s*)?\((req, res)\) => {/g, "app.$1('$2', $3async (req, res) => {");

// Replace db.prepare(x).get(y) with (await db.prepare(x).get(y))
code = code.replace(/db\.prepare\(([^)]+)\)\.get\(([^)]*)\)/g, "(await db.prepare($1).get($2))");
code = code.replace(/db\.prepare\(([^)]+)\)\.all\(([^)]*)\)/g, "(await db.prepare($1).all($2))");
code = code.replace(/db\.prepare\(([^)]+)\)\.run\(([^)]*)\)/g, "(await db.prepare($1).run($2))");

fs.writeFileSync('server.ts', code);
console.log('Rewrote server.ts');
