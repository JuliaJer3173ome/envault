import { Command } from 'commander';
import * as path from 'path';
import { openVault } from '../../crypto';
import { promptPassword } from './init';

export function registerGetCommand(program: Command): void {
  program
    .command('get [key]')
    .description('Retrieve one or all environment variables from the vault')
    .option('-f, --file <path>', 'path to vault file', '.envault')
    .option('--json', 'output as JSON')
    .action(async (key: string | undefined, options: { file: string; json: boolean }) => {
      const vaultPath = path.resolve(process.cwd(), options.file);

      let password: string;
      try {
        password = await promptPassword('Enter vault password: ');
      } catch {
        console.error('Error reading password.');
        process.exit(1);
      }

      let entries: Record<string, string>;
      try {
        entries = await openVault(vaultPath, password);
      } catch (err: any) {
        console.error(`Failed to open vault: ${err.message}`);
        process.exit(1);
      }

      if (key) {
        if (!(key in entries)) {
          console.error(`Key "${key}" not found in vault.`);
          process.exit(1);
        }
        if (options.json) {
          console.log(JSON.stringify({ [key]: entries[key] }, null, 2));
        } else {
          console.log(`${key}=${entries[key]}`);
        }
      } else {
        if (options.json) {
          console.log(JSON.stringify(entries, null, 2));
        } else {
          for (const [k, v] of Object.entries(entries)) {
            console.log(`${k}=${v}`);
          }
        }
      }
    });
}
