import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const databaseUrl = 'file:./e2e.db';
const dbPath = path.join(rootDir, 'prisma', 'e2e.db');
const dbJournalPath = `${dbPath}-journal`;

if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { force: true });
if (fs.existsSync(dbJournalPath)) fs.rmSync(dbJournalPath, { force: true });

// Ensure the file exists before Prisma touches it.
execSync(`sqlite3 ${JSON.stringify(dbPath)} "VACUUM;"`, { cwd: rootDir, stdio: 'ignore' });

execSync('npx prisma migrate deploy', {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
});

const child = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '4173'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
});

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
