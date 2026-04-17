import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export interface TtlEntry {
  vaultPath: string;
  key: string;
  expiresAt: number;
}

const TTL_FILE = '.envault-ttl.json';

export function getTtlFilePath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), TTL_FILE);
}

export function readTtls(vaultPath: string): TtlEntry[] {
  const ttlFile = getTtlFilePath(vaultPath);
  if (!fs.existsSync(ttlFile)) return [];
  return JSON.parse(fs.readFileSync(ttlFile, 'utf-8'));
}

export function writeTtls(vaultPath: string, ttls: TtlEntry[]): void {
  fs.writeFileSync(getTtlFilePath(vaultPath), JSON.stringify(ttls, null, 2));
}

export function setTtl(vaultPath: string, key: string, ttlSeconds: number): void {
  const ttls = readTtls(vaultPath).filter(t => !(t.vaultPath === vaultPath && t.key === key));
  ttls.push({ vaultPath, key, expiresAt: Date.now() + ttlSeconds * 1000 });
  writeTtls(vaultPath, ttls);
}

export function getExpiredKeys(vaultPath: string): string[] {
  const now = Date.now();
  return readTtls(vaultPath)
    .filter(t => t.vaultPath === vaultPath && t.expiresAt <= now)
    .map(t => t.key);
}

function promptPassword(prompt: string): Promise<string> {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, answer => { rl.close(); resolve(answer); });
  });
}

export function registerTtlCommand(program: Command): void {
  program
    .command('ttl <vault> <key> <seconds>')
    .description('Set a TTL (time-to-live) in seconds for a key in the vault')
    .action(async (vault: string, key: string, seconds: string) => {
      const ttlSeconds = parseInt(seconds, 10);
      if (isNaN(ttlSeconds) || ttlSeconds <= 0) {
        console.error('Error: seconds must be a positive integer');
        process.exit(1);
      }
      setTtl(vault, key, ttlSeconds);
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      console.log(`TTL set for "${key}": expires at ${expiresAt}`);
    });

  program
    .command('ttl-purge <vault>')
    .description('Remove expired keys from the vault')
    .action(async (vault: string) => {
      const { openVault, writeVault } = await import('../../crypto/vault');
      const password = await promptPassword('Password: ');
      const vaultData = openVault(vault, password);
      const expired = getExpiredKeys(vault);
      if (expired.length === 0) { console.log('No expired keys.'); return; }
      expired.forEach(k => { delete vaultData.entries[k]; });
      writeVault(vault, vaultData);
      const remaining = readTtls(vault).filter(t => !expired.includes(t.key));
      writeTtls(vault, remaining);
      console.log(`Purged ${expired.length} expired key(s): ${expired.join(', ')}`);
    });
}
