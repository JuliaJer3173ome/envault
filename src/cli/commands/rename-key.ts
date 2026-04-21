import { Command } from 'commander';
import * as readline from 'readline';
import { openVault, writeVault } from '../../crypto/vault';

export async function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function renameKey(
  entries: Record<string, string>,
  oldKey: string,
  newKey: string
): Record<string, string> {
  if (!(oldKey in entries)) {
    throw new Error(`Key "${oldKey}" not found in vault`);
  }
  if (newKey in entries) {
    throw new Error(`Key "${newKey}" already exists in vault`);
  }
  const updated: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (k === oldKey) {
      updated[newKey] = v;
    } else {
      updated[k] = v;
    }
  }
  return updated;
}

export function registerRenameKeyCommand(program: Command): void {
  program
    .command('rename-key <vault> <oldKey> <newKey>')
    .description('Rename a key within a vault without changing its value')
    .option('-p, --password <password>', 'vault password')
    .action(async (vaultPath: string, oldKey: string, newKey: string, opts) => {
      try {
        const password = opts.password ?? (await promptPassword('Enter vault password: '));
        const vault = await openVault(vaultPath, password);
        const updated = renameKey(vault.entries, oldKey, newKey);
        vault.entries = updated;
        await writeVault(vaultPath, vault, password);
        console.log(`Renamed key "${oldKey}" to "${newKey}" in ${vaultPath}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
