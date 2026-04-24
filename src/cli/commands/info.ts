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

/**
 * Retrieves metadata about a vault file without decrypting its contents.
 * @param vaultPath - Absolute or relative path to the vault file.
 * @returns A {@link VaultInfo} object containing vault metadata.
 * @throws If the vault file does not exist at the resolved path.
 */
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

/**
 * Formats a {@link VaultInfo} object into a human-readable string.
 */
function formatVaultInfo(info: VaultInfo): string {
  return [
    'Vault Information',
    '-----------------',
    `Path:       ${info.path}`,
    `Keys:       ${info.keyCount}`,
    `Created:    ${info.createdAt}`,
    `Updated:    ${info.updatedAt}`,
    `Size:       ${info.sizeBytes} bytes`,
  ].join('\n');
}

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Display metadata about the vault without decrypting its contents')
    .option('-v, --vault <path>', 'Path to the vault file', '.envault')
    .action((options) => {
      try {
        const info = getVaultInfo(options.vault);
        console.log(formatVaultInfo(info));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
