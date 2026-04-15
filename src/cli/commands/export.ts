import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import * as readline from 'readline';
import { openVault } from '../../crypto';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.stdoutMuted = true;
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    (rl as any)._writeToOutput = (str: string) => {
      if ((rl as any).stdoutMuted) return;
      rl.output?.write(str);
    };
  });
}

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export vault secrets to a .env file')
    .option('-v, --vault <path>', 'Path to the vault file', '.envault')
    .option('-o, --output <path>', 'Output .env file path', '.env')
    .option('-p, --password <password>', 'Vault password (not recommended, use prompt)')
    .action(async (options) => {
      try {
        const password =
          options.password ||
          (await promptPassword('Enter vault password: '));

        const vaultData = readFileSync(options.vault, 'utf-8');
        const vault = JSON.parse(vaultData);

        const secrets = await openVault(vault, password);

        const envLines = Object.entries(secrets)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');

        writeFileSync(options.output, envLines + '\n', 'utf-8');

        console.log(
          `✅ Exported ${Object.keys(secrets).length} secret(s) to ${options.output}`
        );
      } catch (err: any) {
        if (err.message?.includes('bad decrypt') || err.message?.includes('Unsupported')) {
          console.error('❌ Invalid password or corrupted vault.');
        } else if (err.code === 'ENOENT') {
          console.error(`❌ Vault file not found: ${options.vault}`);
        } else {
          console.error(`❌ Export failed: ${err.message}`);
        }
        process.exit(1);
      }
    });
}
