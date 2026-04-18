import { Command } from 'commander';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { openVault } from '../../crypto';

export function computeChecksum(vaultPath: string): string {
  const raw = fs.readFileSync(vaultPath);
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function verifyChecksum(vaultPath: string, expected: string): boolean {
  return computeChecksum(vaultPath) === expected;
}

export function registerChecksumCommand(program: Command): void {
  const cmd = program.command('checksum');

  cmd
    .command('show <vault>')
    .description('Print the SHA-256 checksum of a vault file')
    .action((vault: string) => {
      if (!fs.existsSync(vault)) {
        console.error(`Vault not found: ${vault}`);
        process.exit(1);
      }
      const hash = computeChecksum(vault);
      console.log(`${hash}  ${vault}`);
    });

  cmd
    .command('verify <vault> <expected>')
    .description('Verify a vault file matches an expected SHA-256 checksum')
    .action((vault: string, expected: string) => {
      if (!fs.existsSync(vault)) {
        console.error(`Vault not found: ${vault}`);
        process.exit(1);
      }
      const match = verifyChecksum(vault, expected);
      if (match) {
        console.log('✔ Checksum verified successfully.');
      } else {
        console.error('✘ Checksum mismatch!');
        process.exit(1);
      }
    });
}
