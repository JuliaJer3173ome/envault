import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

/**
 * Prompt for password securely.
 */
async function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      process.stderr.write('\n');
      resolve(answer);
    });
  });
}

/**
 * Filter vault entries by a predicate applied to keys and/or values.
 * Supports glob-style wildcard matching on keys and substring matching on values.
 */
export function filterEntries(
  entries: Record<string, string>,
  keyPattern?: string,
  valuePattern?: string,
  invert = false
): Record<string, string> {
  const toRegex = (pattern: string): RegExp => {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i');
  };

  const keyRegex = keyPattern ? toRegex(keyPattern) : null;
  const valueRegex = valuePattern ? new RegExp(valuePattern, 'i') : null;

  const result: Record<string, string> = {};

  for (const [k, v] of Object.entries(entries)) {
    const keyMatch = keyRegex ? keyRegex.test(k) : true;
    const valueMatch = valueRegex ? valueRegex.test(v) : true;
    const matches = keyMatch && valueMatch;

    if (invert ? !matches : matches) {
      result[k] = v;
    }
  }

  return result;
}

/**
 * Register the `filter` command on the CLI program.
 *
 * Usage:
 *   envault filter <vault> [options]
 *
 * Options:
 *   -k, --key <pattern>    Filter by key pattern (supports * and ? wildcards)
 *   -v, --value <pattern>  Filter by value pattern (regex substring match)
 *   -i, --invert           Invert the match (exclude matching entries)
 *   -p, --password <pwd>   Vault password
 *   --in-place             Write filtered entries back to the vault
 */
export function registerFilterCommand(program: Command): void {
  program
    .command('filter <vault>')
    .description('Filter vault entries by key pattern and/or value pattern')
    .option('-k, --key <pattern>', 'Key pattern to match (supports * and ? wildcards)')
    .option('-v, --value <pattern>', 'Value pattern to match (regex substring)')
    .option('-i, --invert', 'Invert match — exclude entries that match', false)
    .option('-p, --password <password>', 'Vault password')
    .option('--in-place', 'Write filtered result back to the vault', false)
    .action(async (vaultPath: string, options) => {
      try {
        const password = options.password ?? (await promptPassword('Enter vault password: '));

        const vault = await openVault(vaultPath, password);
        const entries: Record<string, string> = vault.entries ?? {};

        if (!options.key && !options.value) {
          console.error('Error: at least one of --key or --value must be specified.');
          process.exit(1);
        }

        const filtered = filterEntries(entries, options.key, options.value, options.invert);
        const count = Object.keys(filtered).length;

        if (options.inPlace) {
          await writeVault(vaultPath, { ...vault, entries: filtered }, password);
          console.log(`Vault updated: ${count} entr${count === 1 ? 'y' : 'ies'} retained.`);
        } else {
          if (count === 0) {
            console.log('No entries matched the filter criteria.');
          } else {
            for (const [key, value] of Object.entries(filtered)) {
              console.log(`${key}=${value}`);
            }
          }
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
