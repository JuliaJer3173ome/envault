import { Command } from 'commander';
import { openVault } from '../../crypto/vault';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function countEntries(entries: Record<string, string>, tag?: string): number {
  if (!tag) return Object.keys(entries).length;
  return Object.keys(entries).filter((k) => k.startsWith(`${tag}:`) || k.endsWith(`:${tag}`)).length;
}

export function registerCountCommand(program: Command): void {
  program
    .command('count <vault>')
    .description('Count the number of entries in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('-t, --tag <tag>', 'filter by tag prefix/suffix')
    .action(async (vaultPath: string, options: { password?: string; tag?: string }) => {
      try {
        const password = options.password ?? (await promptPassword('Enter vault password: '));
        const vault = await openVault(vaultPath, password);
        const total = countEntries(vault.entries, options.tag);
        if (options.tag) {
          console.log(`Entries matching tag "${options.tag}": ${total}`);
        } else {
          console.log(`Total entries: ${total}`);
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
