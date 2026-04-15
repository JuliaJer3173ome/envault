import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault, openVault, updateVault } from '../../crypto/vault';

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
      if ((rl as any).stdoutMuted) {
        rl.output?.write('*');
      } else {
        rl.output?.write(str);
      }
    };
  });
}

export function registerRenameCommand(program: Command): void {
  program
    .command('rename <oldKey> <newKey>')
    .description('Rename an environment variable key in the vault')
    .option('-f, --file <path>', 'Path to vault file', '.envault')
    .option('-p, --password <password>', 'Vault password')
    .action(async (oldKey: string, newKey: string, options) => {
      try {
        const password = options.password ?? (await promptPassword('Enter vault password: '));
        const encryptedVault = readVault(options.file);
        const vault = await openVault(encryptedVault, password);

        if (!(oldKey in vault.secrets)) {
          console.error(`Error: Key "${oldKey}" does not exist in the vault.`);
          process.exit(1);
        }

        if (newKey in vault.secrets && newKey !== oldKey) {
          console.error(`Error: Key "${newKey}" already exists in the vault.`);
          process.exit(1);
        }

        const value = vault.secrets[oldKey];
        const updatedSecrets = { ...vault.secrets };
        delete updatedSecrets[oldKey];
        updatedSecrets[newKey] = value;

        const updatedVault = { ...vault, secrets: updatedSecrets };
        const newEncryptedVault = await updateVault(encryptedVault, updatedVault, password);
        writeVault(options.file, newEncryptedVault);

        console.log(`Successfully renamed "${oldKey}" to "${newKey}".`);
      } catch (err: any) {
        console.error('Error:', err.message ?? 'Failed to rename key.');
        process.exit(1);
      }
    });
}
