import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault, writeVault } from '../../crypto/vault';
import { getTtlFilePath, readTtls, writeTtls, getExpiredKeys } from './ttl';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function pruneExpiredKeys(
  vaultPath: string,
  password: string
): Promise<string[]> {
  const vault = await openVault(vaultPath, password);
  const ttlPath = getTtlFilePath(vaultPath);
  const ttls = readTtls(ttlPath);
  const expired = getExpiredKeys(ttls);

  if (expired.length === 0) return [];

  for (const key of expired) {
    delete vault.entries[key];
    delete ttls[key];
  }

  await writeVault(vaultPath, vault);
  writeTtls(ttlPath, ttls);

  return expired;
}

export function registerPruneCommand(program: Command): void {
  program
    .command('prune <vault>')
    .description('Remove all expired TTL keys from a vault')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'show expired keys without removing them')
    .action(async (vault: string, opts) => {
      try {
        if (!fs.existsSync(vault)) {
          console.error(`Vault not found: ${vault}`);
          process.exit(1);
        }
        const password = opts.password ?? (await promptPassword('Password: '));
        const ttlPath = getTtlFilePath(vault);
        const ttls = readTtls(ttlPath);
        const expired = getExpiredKeys(ttls);

        if (expired.length === 0) {
          console.log('No expired keys found.');
          return;
        }

        if (opts.dryRun) {
          console.log('Expired keys (dry run):');
          expired.forEach((k) => console.log(`  - ${k}`));
          return;
        }

        const removed = await pruneExpiredKeys(vault, password);
        console.log(`Pruned ${removed.length} expired key(s):`);
        removed.forEach((k) => console.log(`  - ${k}`));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
