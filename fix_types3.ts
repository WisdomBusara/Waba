import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  ".get(customer.accountNumber))?.totalDue || 0;",
  ".get(customer.accountNumber) as any)?.totalDue || 0;"
);

code = code.replace(
  ".get(req.params.id))?.count || 0;",
  ".get(req.params.id) as any)?.count || 0;"
);

code = code.replace(
  ".get(req.params.id))?.count || 0;",
  ".get(req.params.id) as any)?.count || 0;"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed more types');
