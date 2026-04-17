import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault } from '../../crypto';

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export interface VerifyResult {
  valid: boolean;
  keyCount: number;
  error?: string;
}

export async function verifyVault(vaultPath: string, password: string): Promise<VerifyResult> {
  if (!fs.existsSync(vaultPath)) {
    return { valid: false, keyCount: 0, error: 'Vault file not found' };
  }

  try {
    const entries = await openVault(vaultPath, password);
    return { valid: true, keyCount: Object.keys(entries).length };
  } catch {
    return { valid: false, keyCount: 0, error: 'Invalid password or corrupted vault' };
  }
}

export function registerVerifyCommand(program: Command): void {
  program
    .command('verify <vault>')
    .description('Verify that a vault can be decrypted with the given password')
    .option('-p, --password <password>', 'vault password')
    .option('--quiet', 'suppress output, use exit code only')
    .action(async (vault: string, options: { password?: string; quiet?: boolean }) => {
      const password = options.password ?? (await promptPassword('Password: '));
      const result = await verifyVault(vault, password);

      if (result.valid) {
        if (!options.quiet) {
          console.log(`✔ Vault is valid (${result.keyCount} key${result.keyCount !== 1 ? 's' : ''})`);
        }
        process.exit(0);
      } else {
        if (!options.quiet) {
          console.error(`✘ Vault verification failed: ${result.error}`);
        }
        process.exit(1);
      }
    });
}
