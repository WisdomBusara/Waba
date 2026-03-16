import { runBackup } from '../server/db.ts';

try {
  const backupPath = runBackup();
  console.log(`Backup created at: ${backupPath}`);
} catch (error: any) {
  console.error('Backup failed:', error.message);
  process.exit(1);
}
