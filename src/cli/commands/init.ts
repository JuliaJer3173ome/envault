import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { createVault, writeVault } from '../../crypto/vault';

const DEFAULT_VAULT_FILE = '.envault';

function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize a new encrypted vault in the current directory')
    .option('-f, --file <path>', 'vault file path', DEFAULT_VAULT_FILE)
    .option('-p, --password <password>', 'master password (not recommended via CLI)')
    .action(async (options) => {
      const vaultPath = path.resolve(process.cwd(), options.file);

      if (fs.existsSync(vaultPath)) {
        console.error(`Vault already exists at: ${vaultPath}`);
        process.exit(1);
      }

      let password = options.password;
      if (!password) {
        password = await promptPassword('Enter master password: ');
        const confirm = await promptPassword('Confirm master password: ');
        if (password !== confirm) {
          console.error('Passwords do not match.');
          process.exit(1);
        }
      }

      if (!password || password.length < 8) {
        console.error('Password must be at least 8 characters.');
        process.exit(1);
      }

      const vault = await createVault(password);
      await writeVault(vaultPath, vault);

      console.log(`Vault initialized at: ${vaultPath}`);
      console.log('Add it to .gitignore or share it securely with your team.');
    });
}
