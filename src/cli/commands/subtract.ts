import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

/**
 * Computes the set difference between two vaults:
 * returns entries in the primary vault whose keys do NOT appear in the secondary vault.
 */
export function subtractEntries(
  primary: Record<string, string>,
  secondary: Record<string, string>
): Record<string, string> {
  const secondaryKeys = new Set(Object.keys(secondary));
  return Object.fromEntries(
    Object.entries(primary).filter(([key]) => !secondaryKeys.has(key))
  );
}

/**
 * Registers the `subtract` command.
 *
 * Usage:
 *   envault subtract <primaryVault> <secondaryVault> [options]
 *
 * Removes from <primaryVault> any keys that exist in <secondaryVault>.
 * The result is written back to <primaryVault> unless --output is specified.
 *
 * Options:
 *   -p, --password <password>   Vault password
 *   -o, --output <path>         Write result to a different vault file instead
 *   --dry-run                   Print the result without modifying any vault
 */
export function registerSubtractCommand(program: Command): void {
  program
    .command('subtract <primaryVault> <secondaryVault>')
    .description(
      'Remove keys from <primaryVault> that exist in <secondaryVault> (set difference)'
    )
    .option('-p, --password <password>', 'vault password')
    .option('-o, --output <path>', 'write result to a different vault file')
    .option('--dry-run', 'print result without modifying any vault')
    .action(
      async (
        primaryVault: string,
        secondaryVault: string,
        options: {
          password?: string;
          output?: string;
          dryRun?: boolean;
        }
      ) => {
        const password = options.password;

        if (!password) {
          console.error('Error: password is required (--password)');
          process.exit(1);
        }

        let primaryEntries: Record<string, string>;
        let secondaryEntries: Record<string, string>;

        try {
          primaryEntries = await openVault(primaryVault, password);
        } catch {
          console.error(`Error: could not open primary vault "${primaryVault}"`);
          process.exit(1);
        }

        try {
          secondaryEntries = await openVault(secondaryVault, password);
        } catch {
          console.error(
            `Error: could not open secondary vault "${secondaryVault}"`
          );
          process.exit(1);
        }

        const result = subtractEntries(primaryEntries, secondaryEntries);
        const removedCount =
          Object.keys(primaryEntries).length - Object.keys(result).length;

        if (options.dryRun) {
          console.log(
            `Dry run — ${removedCount} key(s) would be removed from "${primaryVault}":`
          );
          for (const [key, value] of Object.entries(result)) {
            console.log(`  ${key}=${value}`);
          }
          return;
        }

        const targetPath = options.output ?? primaryVault;

        try {
          await writeVault(targetPath, result, password);
          console.log(
            `Subtracted ${removedCount} key(s). Result written to "${targetPath}".`
          );
        } catch {
          console.error(`Error: could not write vault "${targetPath}"`);
          process.exit(1);
        }
      }
    );
}
