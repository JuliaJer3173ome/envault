import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const LOCK_DIR = path.join(os.homedir(), '.envault');
const LOCK_FILE = path.join(LOCK_DIR, 'locks.json');

export function readLocks(): Record<string, number> {
  if (!fs.existsSync(LOCK_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function writeLocks(locks: Record<string, number>): void {
  if (!fs.existsSync(LOCK_DIR)) fs.mkdirSync(LOCK_DIR, { recursive: true });
  fs.writeFileSync(LOCK_FILE, JSON.stringify(locks, null, 2));
}

export function lockVault(vaultPath: string): void {
  const locks = readLocks();
  locks[path.resolve(vaultPath)] = Date.now();
  writeLocks(locks);
}

export function unlockVault(vaultPath: string): void {
  const locks = readLocks();
  delete locks[path.resolve(vaultPath)];
  writeLocks(locks);
}

export function isLocked(vaultPath: string): boolean {
  const locks = readLocks();
  return !!locks[path.resolve(vaultPath)];
}

export function registerLockCommand(program: Command): void {
  const lock = program.command('lock').description('Lock or unlock a vault from modifications');

  lock
    .command('on <vault>')
    .description('Lock a vault to prevent modifications')
    .action((vault: string) => {
      if (!fs.existsSync(vault)) {
        console.error(`Vault not found: ${vault}`);
        process.exit(1);
      }
      lockVault(vault);
      console.log(`Vault locked: ${vault}`);
    });

  lock
    .command('off <vault>')
    .description('Unlock a vault to allow modifications')
    .action((vault: string) => {
      unlockVault(vault);
      console.log(`Vault unlocked: ${vault}`);
    });

  lock
    .command('status <vault>')
    .description('Check if a vault is locked')
    .action((vault: string) => {
      const locked = isLocked(vault);
      console.log(`Vault ${vault} is ${locked ? 'LOCKED' : 'UNLOCKED'}`);
    });
}
