import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  ".get(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []))?.count || 0;",
  ".get(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []) as any)?.count || 0;"
);

code = code.replace(
  ".get(req.params.id))?.totalDue || 0;",
  ".get(req.params.id) as any)?.totalDue || 0;"
);

code = code.replace(
  ".get(req.params.id))?.count || 0;",
  ".get(req.params.id) as any)?.count || 0;"
);

code = code.replace(
  ".get(req.params.id))?.count || 0;",
  ".get(req.params.id) as any)?.count || 0;"
);

code = code.replace(
  "const sizeResult = await db.prepare(\"SELECT pg_database_size(current_database()) as size\").get();",
  "const sizeResult = await db.prepare(\"SELECT pg_database_size(current_database()) as size\").get() as any;"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed more types');
