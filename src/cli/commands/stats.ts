import { Command } from 'commander';
import { readVault } from '../../crypto/vault';
import * as fs from 'fs';

export interface VaultStats {
  totalKeys: number;
  tags: string[];
  uniqueTags: number;
  lockedKeys: number;
  sizeBytes: number;
  createdAt?: string;
  updatedAt?: string;
}

export function computeStats(vaultPath: string, password: string): VaultStats {
  const vault = readVault(vaultPath, password);
  const entries = Object.entries(vault.entries ?? {});

  const allTags: string[] = [];
  for (const [, entry] of entries) {
    if (entry.tags) allTags.push(...entry.tags);
  }

  const stat = fs.statSync(vaultPath);

  return {
    totalKeys: entries.length,
    tags: allTags,
    uniqueTags: new Set(allTags).size,
    lockedKeys: entries.filter(([, e]) => e.locked).length,
    sizeBytes: stat.size,
    createdAt: vault.createdAt,
    updatedAt: vault.updatedAt,
  };
}

export function registerStatsCommand(program: Command): void {
  program
    .command('stats <vault>')
    .description('Display statistics about a vault')
    .option('-p, --password <password>', 'vault password')
    .action(async (vaultPath: string, options) => {
      const password = options.password ?? process.env.ENVAULT_PASSWORD;
      if (!password) {
        console.error('Password is required (--password or ENVAULT_PASSWORD)');
        process.exit(1);
      }
      try {
        const stats = computeStats(vaultPath, password);
        console.log(`Vault: ${vaultPath}`);
        console.log(`Total keys:   ${stats.totalKeys}`);
        console.log(`Locked keys:  ${stats.lockedKeys}`);
        console.log(`Unique tags:  ${stats.uniqueTags}`);
        console.log(`Size:         ${stats.sizeBytes} bytes`);
        if (stats.createdAt) console.log(`Created:      ${stats.createdAt}`);
        if (stats.updatedAt) console.log(`Updated:      ${stats.updatedAt}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
