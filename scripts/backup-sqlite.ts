import { backupDatabase } from '../server/database.ts';

async function main() {
  try {
    const backupPath = await backupDatabase();
    console.log(`Backup created at: ${backupPath}`);
  } catch (error: any) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  }
}

main();
