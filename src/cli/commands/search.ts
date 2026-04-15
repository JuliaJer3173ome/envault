import { Command } from 'commander';
import * as readline from 'readline';
import { openVault } from '../../crypto';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function searchEntries(
  entries: Record<string, string>,
  query: string,
  searchValues: boolean
): Array<{ key: string; value: string }> {
  const lowerQuery = query.toLowerCase();
  return Object.entries(entries)
    .filter(([key, value]) => {
      const keyMatch = key.toLowerCase().includes(lowerQuery);
      const valueMatch = searchValues && value.toLowerCase().includes(lowerQuery);
      return})
    .map(([key, value]) => ({ key, value }));
}

export function registerSearchCommand(program: Command): void {
  program
    .command('search <query>')
    .description('Search for keys (and optionally values) in the vault')
    .option('-f, --file <path>', 'path file', '.env.vault')
    .option('-v, --values', 'also search in values', false)
    .option('-p, --password <password>', 'vault password')
    .action(async (query: string, options) => {
      try {
        const password = options.password ?? (await promptPassword('Enter vault password: '));
        const vault = await openVault(options.file, password);
        const results = searchEntries(vault.entries, query, options.values);

        if (results.length === 0) {
          console.log(`No entries found matching "${query}".`);
          return;
        }

        console.log(`Found ${results.length} result(s) for "${query}":\n`);
        for (const { key, value } of results) {
          if (options.values) {
            console.log(`  ${key}=${value}`);
          } else {
            console.log(`  ${key}`);
          }
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
