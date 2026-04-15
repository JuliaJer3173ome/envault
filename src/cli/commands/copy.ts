import { Command } from 'commander';
import * as readline from 'readline';
import { openVault, updateVault } from '../../crypto/vault';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        rl.close();
        process.stdout.write('\n');
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export function registerCopyCommand(program: Command): void {
  program
    .command('copy <source> <destination>')
    .description('Copy an environment variable to a new key')
    .option('-f, --file <path>', 'Path to vault file', '.envault')
    .option('-p, --password <password>', 'Vault password')
    .action(async (source: string, destination: string, options) => {
      try {
        const password = options.password ?? (await promptPassword('Enter vault password: '));
        const vault = await openVault(options.file, password);

        if (!(source in vault.secrets)) {
          console.error(`Error: Key "${source}" not found in vault.`);
          process.exit(1);
        }

        if (destination in vault.secrets) {
          console.error(`Error: Key "${destination}" already exists. Use set to overwrite.`);
          process.exit(1);
        }

        vault.secrets[destination] = vault.secrets[source];
        await updateVault(options.file, password, vault.secrets);
        console.log(`Copied "${source}" to "${destination}" successfully.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
