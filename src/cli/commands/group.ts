import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (ch) => {
      const c = ch.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        rl.close();
        process.stdout.write('\n');
        resolve(password);
      } else {
        password += c;
      }
    });
  });
}

export function groupEntries(
  entries: Record<string, string>,
  groupKey: string
): Record<string, Record<string, string>> {
  const groups: Record<string, Record<string, string>> = {};
  for (const [key, value] of Object.entries(entries)) {
    const parts = key.split('_');
    const prefix = parts.length > 1 ? parts[0] : groupKey || '__default__';
    if (!groups[prefix]) groups[prefix] = {};
    groups[prefix][key] = value;
  }
  return groups;
}

export function registerGroupCommand(program: Command): void {
  program
    .command('group <vault>')
    .description('Display vault entries grouped by key prefix')
    .option('-p, --password <password>', 'vault password')
    .option('--prefix <prefix>', 'filter by specific prefix group')
    .option('--json', 'output as JSON')
    .action(async (vaultPath: string, options) => {
      try {
        const password = options.password || (await promptPassword('Enter vault password: '));
        const vault = await openVault(vaultPath, password);
        const groups = groupEntries(vault.entries, '');

        const filtered = options.prefix
          ? { [options.prefix]: groups[options.prefix] || {} }
          : groups;

        if (options.json) {
          console.log(JSON.stringify(filtered, null, 2));
        } else {
          for (const [group, entries] of Object.entries(filtered)) {
            console.log(`\n[${group}]`);
            for (const [key, value] of Object.entries(entries)) {
              console.log(`  ${key}=${value}`);
            }
          }
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
