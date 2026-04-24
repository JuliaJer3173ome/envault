import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

/**
 * Prompts the user for a password securely.
 */
function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    (process.stdin as any).setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char: Buffer) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        (process.stdin as any).setRawMode?.(false);
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

type TransformOp = 'uppercase' | 'lowercase' | 'trim' | 'base64encode' | 'base64decode' | 'urlencode' | 'urldecode';

/**
 * Applies a transformation operation to a string value.
 */
export function transformValue(value: string, op: TransformOp): string {
  switch (op) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'trim':
      return value.trim();
    case 'base64encode':
      return Buffer.from(value, 'utf8').toString('base64');
    case 'base64decode':
      return Buffer.from(value, 'base64').toString('utf8');
    case 'urlencode':
      return encodeURIComponent(value);
    case 'urldecode':
      return decodeURIComponent(value);
    default:
      throw new Error(`Unknown transform operation: ${op}`);
  }
}

/**
 * Applies a transformation to selected entries in a vault record.
 */
export function transformEntries(
  entries: Record<string, string>,
  op: TransformOp,
  keys?: string[]
): Record<string, string> {
  const result: Record<string, string> = { ...entries };
  const targets = keys && keys.length > 0 ? keys : Object.keys(entries);
  for (const key of targets) {
    if (key in result) {
      result[key] = transformValue(result[key], op);
    }
  }
  return result;
}

const VALID_OPS: TransformOp[] = [
  'uppercase', 'lowercase', 'trim', 'base64encode', 'base64decode', 'urlencode', 'urldecode',
];

/**
 * Registers the `transform` command with the CLI program.
 *
 * Usage:
 *   envault transform <vault> <op> [keys...]
 *   envault transform myapp.vault base64encode DB_PASS API_KEY
 *   envault transform myapp.vault trim
 */
export function registerTransformCommand(program: Command): void {
  program
    .command('transform <vault> <op> [keys...]')
    .description(
      `Transform values in a vault. Operations: ${VALID_OPS.join(', ')}.\n` +
      'If no keys are specified, all entries are transformed.'
    )
    .option('-p, --password <password>', 'vault password (omit to be prompted)')
    .action(async (vaultPath: string, op: string, keys: string[], opts: { password?: string }) => {
      if (!VALID_OPS.includes(op as TransformOp)) {
        console.error(`Error: unknown operation "${op}". Valid ops: ${VALID_OPS.join(', ')}`);
        process.exit(1);
      }

      const password = opts.password ?? await promptPassword('Enter vault password: ');

      let vault;
      try {
        vault = await openVault(vaultPath, password);
      } catch {
        console.error('Error: failed to open vault. Check the path and password.');
        process.exit(1);
      }

      const before = { ...vault.entries };
      vault.entries = transformEntries(vault.entries, op as TransformOp, keys);

      const changed = Object.keys(vault.entries).filter(
        (k) => vault.entries[k] !== before[k]
      );

      if (changed.length === 0) {
        console.log('No entries were changed.');
        return;
      }

      try {
        await writeVault(vaultPath, vault, password);
      } catch {
        console.error('Error: failed to write vault.');
        process.exit(1);
      }

      console.log(`Transformed ${changed.length} entr${changed.length === 1 ? 'y' : 'ies'} using "${op}": ${changed.join(', ')}`);
    });
}
