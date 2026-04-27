import { Command } from 'commander';
import { openVault } from '../../crypto/vault';
import { promptPassword } from './init';

export interface VaultSummary {
  totalKeys: number;
  emptyValues: number;
  uniqueValues: number;
  averageValueLength: number;
  longestKey: string;
  shortestKey: string;
}

export function summarizeEntries(entries: Record<string, string>): VaultSummary {
  const keys = Object.keys(entries);
  const values = Object.values(entries);

  if (keys.length === 0) {
    return {
      totalKeys: 0,
      emptyValues: 0,
      uniqueValues: 0,
      averageValueLength: 0,
      longestKey: '',
      shortestKey: '',
    };
  }

  const emptyValues = values.filter((v) => v === '').length;
  const uniqueValues = new Set(values).size;
  const totalLength = values.reduce((sum, v) => sum + v.length, 0);
  const averageValueLength = Math.round(totalLength / values.length);
  const longestKey = keys.reduce((a, b) => (a.length >= b.length ? a : b));
  const shortestKey = keys.reduce((a, b) => (a.length <= b.length ? a : b));

  return { totalKeys: keys.length, emptyValues, uniqueValues, averageValueLength, longestKey, shortestKey };
}

export function formatSummary(summary: VaultSummary): string {
  if (summary.totalKeys === 0) return 'Vault is empty.';
  return [
    `Total keys       : ${summary.totalKeys}`,
    `Empty values     : ${summary.emptyValues}`,
    `Unique values    : ${summary.uniqueValues}`,
    `Avg value length : ${summary.averageValueLength}`,
    `Longest key      : ${summary.longestKey}`,
    `Shortest key     : ${summary.shortestKey}`,
  ].join('\n');
}

export function registerSummarizeCommand(program: Command): void {
  program
    .command('summarize <vault>')
    .description('Display a statistical summary of a vault')
    .option('-p, --password <password>', 'vault password')
    .action(async (vaultPath: string, options: { password?: string }) => {
      const password = options.password ?? (await promptPassword('Enter vault password: '));
      try {
        const vault = await openVault(vaultPath, password);
        const summary = summarizeEntries(vault.entries);
        console.log(formatSummary(summary));
      } catch (err) {
        console.error('Error:', (err as Error).message);
        process.exit(1);
      }
    });
}
