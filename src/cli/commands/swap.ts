import { Command } from 'commander';
import * as readline from 'readline';
import { openVault, writeVault } from '../../crypto/vault';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function swapEntries(
  entries: Record<string, string>,
  keyA: string,
  keyB: string
): Record<string, string> {
  if (!(keyA in entries)) throw new Error(`Key not found: ${keyA}`);
  if (!(keyB in entries)) throw new Error(`Key not found: ${keyB}`);
  const result = { ...entries };
  const tmp = result[keyA];
  result[keyA] = result[keyB];
  result[keyB] = tmp;
  return result;
}

export function registerSwapCommand(program: Command): void {
  program
    .command('swap <vault> <keyA> <keyB>')
    .description('Swap the values of two keys in a vault')
    .option('-p, --password <password>', 'vault password')
    .action(async (vault: string, keyA: string, keyB: string, opts) => {
      try {
        const password = opts.password ?? (await promptPassword('Password: '));
        const data = await openVault(vault, password);
        const updated = swapEntries(data, keyA, keyB);
        await writeVault(vault, updated, password);
        console.log(`Swapped values of '${keyA}' and '${keyB}'.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
