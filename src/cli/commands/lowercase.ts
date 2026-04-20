import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

export function lowercaseEntries(
  entries: Record<string, string>,
  keys?: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (!keys || keys.includes(k)) {
      result[k] = v.toLowerCase();
    } else {
      result[k] = v;
    }
  }
  return result;
}

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerLowercaseCommand(program: Command): void {
  program
    .command('lowercase <vault>')
    .description('Lowercase the values of entries in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('-k, --keys <keys>', 'comma-separated list of keys to lowercase (default: all)')
    .action(async (vaultPath: string, opts) => {
      try {
        const password =
          opts.password ?? (await promptPassword('Enter vault password: '));
        const keys: string[] | undefined = opts.keys
          ? opts.keys.split(',').map((k: string) => k.trim())
          : undefined;
        const vault = await openVault(vaultPath, password);
        const updated = lowercaseEntries(vault.entries, keys);
        const count = Object.keys(updated).filter(
          (k) => updated[k] !== vault.entries[k]
        ).length;
        vault.entries = updated;
        await writeVault(vaultPath, vault);
        console.log(`Lowercased ${count} entr${count === 1 ? 'y' : 'ies'}.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
