import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { openVault, writeVault } from '../../crypto/vault';

export function getExpireFilePath(vaultPath: string): string {
  return vaultPath.replace(/\.vault$/, '.expire.json');
}

export function readExpiry(vaultPath: string): Record<string, string> {
  const p = getExpireFilePath(vaultPath);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function writeExpiry(vaultPath: string, data: Record<string, string>): void {
  fs.writeFileSync(getExpireFilePath(vaultPath), JSON.stringify(data, null, 2));
}

export function getExpiredKeys(vaultPath: string): string[] {
  const expiry = readExpiry(vaultPath);
  const now = Date.now();
  return Object.entries(expiry)
    .filter(([, iso]) => new Date(iso).getTime() <= now)
    .map(([k]) => k);
}

export function registerExpireCommand(program: Command): void {
  program
    .command('expire <vault> <key> <datetime>')
    .description('Set an expiry datetime (ISO 8601) for a key')
    .option('-p, --password <password>', 'vault password')
    .action(async (vault: string, key: string, datetime: string, opts) => {
      const password = opts.password ?? '';
      const vaultPath = path.resolve(vault);
      await openVault(vaultPath, password);
      const expiry = readExpiry(vaultPath);
      const date = new Date(datetime);
      if (isNaN(date.getTime())) {
        console.error('Invalid datetime format. Use ISO 8601.');
        process.exit(1);
      }
      expiry[key] = date.toISOString();
      writeExpiry(vaultPath, expiry);
      console.log(`Expiry set for "${key}": ${date.toISOString()}`);
    });

  program
    .command('expire-check <vault>')
    .description('List all expired keys in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('--purge', 'remove expired keys from vault')
    .action(async (vault: string, opts) => {
      const password = opts.password ?? '';
      const vaultPath = path.resolve(vault);
      const entries = await openVault(vaultPath, password);
      const expired = getExpiredKeys(vaultPath);
      if (expired.length === 0) {
        console.log('No expired keys.');
        return;
      }
      console.log('Expired keys:', expired.join(', '));
      if (opts.purge) {
        expired.forEach(k => delete entries[k]);
        await writeVault(vaultPath, entries, password);
        const expiry = readExpiry(vaultPath);
        expired.forEach(k => delete expiry[k]);
        writeExpiry(vaultPath, expiry);
        console.log('Purged expired keys from vault.');
      }
    });
}
