import fs from 'fs';

let code = fs.readFileSync('components/DatabaseDiagnostics.tsx', 'utf8');

code = code.replace(
    "a.download = \`database_backup_\${new Date().toISOString().split('T')[0]}.sqlite\`;",
    "a.download = \`database_backup_\${new Date().toISOString().split('T')[0]}.json\`;"
);

code = code.replace(
    '<span className="font-mono font-bold">SQLite 3.x (B-Tree)</span>',
    '<span className="font-mono font-bold">PostgreSQL (Supabase)</span>'
);

code = code.replace(
    '<span><b>Maintenance Tip:</b> If your database exceeds 1GB or record counts go above 100k, consider enabling Write-Ahead Logging (WAL) mode or transitioning to a cloud database like PostgreSQL for better concurrency.</span>',
    '<span><b>Maintenance Tip:</b> You are currently using a robust PostgreSQL database via Supabase. Regular backups are still recommended for disaster recovery.</span>'
);

fs.writeFileSync('components/DatabaseDiagnostics.tsx', code);
console.log('Updated DatabaseDiagnostics for PostgreSQL');
