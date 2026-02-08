import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export default function globalSetup() {
  const rootDir = path.resolve(__dirname, '..');
  const testDbPath = path.join(rootDir, 'prisma', 'test.db');
  const testDbJournalPath = `${testDbPath}-journal`;

  if (fs.existsSync(testDbPath)) {
    fs.rmSync(testDbPath, { force: true });
  }
  if (fs.existsSync(testDbJournalPath)) {
    fs.rmSync(testDbJournalPath, { force: true });
  }

  execSync(`sqlite3 ${JSON.stringify(testDbPath)} "VACUUM;"`, {
    cwd: rootDir,
    stdio: 'ignore',
  });

  execSync('npx prisma migrate deploy', {
    cwd: rootDir,
    stdio: 'ignore',
    env: {
      ...process.env,
      DATABASE_URL: 'file:./test.db',
    },
  });
}
