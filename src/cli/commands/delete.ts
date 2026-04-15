import { Command } from 'commander';
import * as readline from 'readline';
import { openVault, updateVault } from '../../crypto/vault';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const write = (rl as any).output?.write.bind((rl as any).output);
    if ((rl as any).output) {
      (rl as any).output.write = () => {};
    }
    rl.question(prompt, (answer) => {
      if ((rl as any).output && write) {
        (rl as any).output.write = write;
      }
      rl.close();
      resolve(answer);
    });
  });
}

export function registerDeleteCommand(program: Command): void {
  program
    .command('delete <key>')
    .description('Delete an environment variable from the vault')
    .option('-f, --file <path>', 'Path to the vault file', '.envault')
    .option('-p, --password <password>', 'Vault password (not recommended, use prompt)')
    .action(async (key: string, options: { file: string; password?: string }) => {
      try {
        const password =
          options.password ?? (await promptPassword('Enter vault password: '));

        const vault = await openVault(options.file, password);

        if (!(key in vault)) {
          console.error(`Key "${key}" not found in vault.`);
          process.exit(1);
        }

        const { [key]: _removed, ...remaining } = vault;

        await updateVault(options.file, password, remaining);

        console.log(`Deleted "${key}" from vault.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
