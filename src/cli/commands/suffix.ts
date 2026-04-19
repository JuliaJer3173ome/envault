import { Command } from 'commander';
import { openVault, updateVault } from '../../crypto/vault';

export function suffixEntries(
  entries: Record<string, string>,
  suffix: string,
  keys?: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (!keys || keys.includes(k)) {
      result[k] = v + suffix;
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function registerSuffixCommand(program: Command): void {
  program
    .command('suffix <vault> <suffix>')
    .description('Append a suffix to values in the vault')
    .requiredOption('-p, --password <password>', 'Vault password')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to suffix (default: all)')
    .action(async (vaultPath: string, suffix: string, options: { password: string; keys?: string }) => {
      try {
        const entries = await openVault(vaultPath, options.password);
        const keys = options.keys ? options.keys.split(',').map((k) => k.trim()) : undefined;
        const updated = suffixEntries(entries, suffix, keys);
        await updateVault(vaultPath, updated, options.password);
        const count = Object.keys(updated).filter(
          (k) => !keys || keys.includes(k)
        ).length;
        console.log(`Appended suffix "${suffix}" to ${count} value(s) in ${vaultPath}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
      }
    });
}
