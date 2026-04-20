import { Command } from 'commander';
import { openVault } from '../../crypto/vault';
import * as fs from 'fs';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function extractEntries(
  entries: Record<string, string>,
  keys: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    if (key in entries) {
      result[key] = entries[key];
    }
  }
  return result;
}

export function registerExtractCommand(program: Command): void {
  program
    .command('extract <vault> <keys...>')
    .description('Extract specific keys from a vault into a new vault or .env file')
    .option('-p, --password <password>', 'vault password')
    .option('-o, --output <file>', 'output file path (default: stdout)')
    .option('--env', 'output as .env format instead of vault')
    .action(async (vaultPath: string, keys: string[], opts) => {
      try {
        const password = opts.password ?? await promptPassword('Password: ');
        const entries = await openVault(vaultPath, password);
        const extracted = extractEntries(entries, keys);

        if (Object.keys(extracted).length === 0) {
          console.error('No matching keys found.');
          process.exit(1);
        }

        if (opts.env) {
          const lines = Object.entries(extracted).map(([k, v]) => `${k}=${v}`).join('\n');
          if (opts.output) {
            fs.writeFileSync(opts.output, lines + '\n');
            console.log(`Extracted ${Object.keys(extracted).length} key(s) to ${opts.output}`);
          } else {
            console.log(lines);
          }
        } else {
          const { writeVault } = await import('../../crypto/vault');
          const outPath = opts.output ?? vaultPath.replace(/\.vault$/, '') + '.extracted.vault';
          await writeVault(outPath, extracted, password);
          console.log(`Extracted ${Object.keys(extracted).length} key(s) to ${outPath}`);
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
