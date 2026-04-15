import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault, updateVault, writeVault } from '../../crypto/vault';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerTagCommand(program: Command): void {
  program
    .command('tag <key> <tag>')
    .description('Add a tag to an existing vault entry')
    .option('-v, --vault <path>', 'Path to the vault file', '.envault')
    .option('-p, --password <password>', 'Vault password')
    .option('--remove', 'Remove the tag instead of adding it')
    .action(async (key: string, tag: string, options) => {
      try {
        if (!fs.existsSync(options.vault)) {
          console.error(`Vault not found: ${options.vault}`);
          process.exit(1);
        }

        const password = options.password ?? (await promptPassword('Enter vault password: '));
        const vault = await openVault(options.vault, password);

        if (!(key in vault.entries)) {
          console.error(`Key "${key}" not found in vault.`);
          process.exit(1);
        }

        const entry = vault.entries[key];
        const currentTags: string[] = entry.tags ?? [];

        if (options.remove) {
          const index = currentTags.indexOf(tag);
          if (index === -1) {
            console.error(`Tag "${tag}" not found on key "${key}".`);
            process.exit(1);
          }
          currentTags.splice(index, 1);
          console.log(`Removed tag "${tag}" from "${key}".`);
        } else {
          if (currentTags.includes(tag)) {
            console.error(`Tag "${tag}" already exists on key "${key}".`);
            process.exit(1);
          }
          currentTags.push(tag);
          console.log(`Added tag "${tag}" to "${key}".`);
        }

        entry.tags = currentTags;
        const updatedVault = updateVault(vault, key, entry.value, entry.tags);
        await writeVault(options.vault, updatedVault, password);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
