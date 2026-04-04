import fs from 'fs';

let code = fs.readFileSync('server/database.ts', 'utf8');

const transactionCode = `
  transaction: (fn: any) => {
    return async (...args: any[]) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(...args);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    };
  }
};
`;

code = code.replace("    };\n  }\n};", "    };\n  },\n" + transactionCode);

fs.writeFileSync('server/database.ts', code);
console.log('Added transaction support');
