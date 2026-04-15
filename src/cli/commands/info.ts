import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { readVault } from '../../crypto/vault';

export interface VaultInfo {
  path: string;
  keyCount: number;
  createdAt: string;
  updatedAt: string;
  sizeBytes: number;
}

export function getVaultInfo(vaultPath: string): VaultInfo {
  const resolvedPath = path.resolve(vaultPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Vault not found at path: ${resolvedPath}`);
  }

  const stats = fs.statSync(resolvedPath);
  const raw = readVault(resolvedPath);

  return {
    path: resolvedPath,
    keyCount: raw.keyCount ?? 0,
    createdAt: raw.createdAt ?? stats.birthtime.toISOString(),
    updatedAt: raw.updatedAt ?? stats.mtime.toISOString(),
    sizeBytes: stats.size,
  };
}

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Display metadata about the vault without decrypting its contents')
    .option('-v, --vault <path>', 'Path to the vault file', '.envault')
    .action((options) => {
      try {
        const info = getVaultInfo(options.vault);

        console.log('Vault Information');
        console.log('-----------------');
        console.log(`Path:       ${info.path}`);
        console.log(`Keys:       ${info.keyCount}`);
        console.log(`Created:    ${info.createdAt}`);
        console.log(`Updated:    ${info.updatedAt}`);
        console.log(`Size:       ${info.sizeBytes} bytes`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
