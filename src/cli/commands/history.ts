import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export interface HistoryEntry {
  timestamp: string;
  action: string;
  key?: string;
  vaultPath: string;
}

const HISTORY_FILE = '.envault_history';

export function getHistoryFilePath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), HISTORY_FILE);
}

export function appendHistory(vaultPath: string, action: string, key?: string): void {
  const historyPath = getHistoryFilePath(vaultPath);
  const entry: HistoryEntry = {
    timestamp: new Date().toISOString(),
    action,
    key,
    vaultPath,
  };
  fs.appendFileSync(historyPath, JSON.stringify(entry) + '\n', 'utf-8');
}

export function readHistory(vaultPath: string, limit = 20): HistoryEntry[] {
  const historyPath = getHistoryFilePath(vaultPath);
  if (!fs.existsSync(historyPath)) return [];

  const lines = fs.readFileSync(historyPath, 'utf-8')
    .split('\n')
    .filter(Boolean);

  return lines
    .slice(-limit)
    .map((line) => JSON.parse(line) as HistoryEntry)
    .reverse();
}

export function clearHistory(vaultPath: string): void {
  const historyPath = getHistoryFilePath(vaultPath);
  if (fs.existsSync(historyPath)) {
    fs.unlinkSync(historyPath);
  }
}

export function registerHistoryCommand(program: Command): void {
  program
    .command('history <vault>')
    .description('Show recent actions performed on a vault')
    .option('-n, --limit <number>', 'Number of entries to show', '20')
    .option('--clear', 'Clear the history for this vault')
    .action((vault: string, options: { limit: string; clear?: boolean }) => {
      if (options.clear) {
        clearHistory(vault);
        console.log('History cleared.');
        return;
      }

      const limit = parseInt(options.limit, 10);
      const entries = readHistory(vault, limit);

      if (entries.length === 0) {
        console.log('No history found for this vault.');
        return;
      }

      console.log(`Recent actions for vault: ${vault}\n`);
      entries.forEach((entry) => {
        const keyPart = entry.key ? ` [${entry.key}]` : '';
        console.log(`  ${entry.timestamp}  ${entry.action}${keyPart}`);
      });
    });
}
