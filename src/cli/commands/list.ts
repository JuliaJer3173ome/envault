import { Command } from 'commander';
import { readVault, openVault } from '../../crypto';
import * as readline from 'readline';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all keys stored in the vault')
    .option('-f, --file <path>', 'Path to the vault file', '.envault')
    .option('--show-values', 'Also display the values (use with caution)', false)
    .action(async (options) => {
      try {
        const encryptedVault = readVault(options.file);
        const password = await promptPassword('Enter vault password: ');
        const vault = openVault(encryptedVault, password);

        const keys = Object.keys(vault.entries);

        if (keys.length === 0) {
          console.log('Vault is empty. Use `envault set <KEY> <VALUE>` to add entries.');
          return;
        }

        console.log(`\nVault contains ${keys.length} key(s):`);
        console.log('─'.repeat(40));

        for (const key of keys.sort()) {
          if (options.showValues) {
            console.log(`  ${key}=${vault.entries[key]}`);
          } else {
            console.log(`  ${key}`);
          }
        }

        console.log('─'.repeat(40));
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.error(`Vault file not found: ${options.file}`);
          console.error('Run `envault init` to create a new vault.');
        } else if (err.message?.includes('Unsupported state')) {
          console.error('Incorrect password or corrupted vault.');
        } else {
          console.error(`Error: ${err.message}`);
        }
        process.exit(1);
      }
    });
}
