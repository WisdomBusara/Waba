import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// We can just replace `.get()` with `.get() as any` where it's causing issues.
code = code.replace(/\.get\(\)\)\?\.value/g, ".get() as any)?.value");
code = code.replace(/\.get\(\)\)\?\.v/g, ".get() as any)?.v");
code = code.replace(/\.get\(\)\)\?\.count/g, ".get() as any)?.count");
code = code.replace(/\.get\(\)\)\?\.totalDue/g, ".get() as any)?.totalDue");
code = code.replace(/\.get\(\)\)\?\.size/g, ".get() as any)?.size");
code = code.replace(/\.get\(userId\)\)\?\.count/g, ".get(userId) as any)?.count");
code = code.replace(/\.get\(userId\) as any\)\?\.count/g, ".get(userId) as any)?.count");

fs.writeFileSync('server.ts', code);
console.log('Fixed type errors');
