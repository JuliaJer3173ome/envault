import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const FREEZE_FILE = '.envault-freeze';

export function getFreezeFilePath(vaultPath: string): string {
  return path.join(path.dirname(vaultPath), FREEZE_FILE);
}

export function readFrozen(vaultPath: string): string[] {
  const freezePath = getFreezeFilePath(vaultPath);
  if (!fs.existsSync(freezePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(freezePath, 'utf-8'));
  } catch {
    return [];
  }
}

export function writeFrozen(vaultPath: string, keys: string[]): void {
  const freezePath = getFreezeFilePath(vaultPath);
  fs.writeFileSync(freezePath, JSON.stringify([...new Set(keys)], null, 2));
}

export function freezeKey(vaultPath: string, key: string): void {
  const frozen = readFrozen(vaultPath);
  if (!frozen.includes(key)) {
    writeFrozen(vaultPath, [...frozen, key]);
  }
}

export function unfreezeKey(vaultPath: string, key: string): void {
  const frozen = readFrozen(vaultPath);
  writeFrozen(vaultPath, frozen.filter((k) => k !== key));
}

export function isFrozen(vaultPath: string, key: string): boolean {
  return readFrozen(vaultPath).includes(key);
}

export function registerFreezeCommand(program: Command): void {
  program
    .command('freeze <vault> <key>')
    .description('Freeze a key to prevent modification or deletion')
    .option('--unfreeze', 'Remove freeze from a key')
    .option('--list', 'List all frozen keys')
    .action((vault: string, key: string, opts) => {
      if (opts.list) {
        const frozen = readFrozen(vault);
        if (frozen.length === 0) {
          console.log('No frozen keys.');
        } else {
          console.log('Frozen keys:');
          frozen.forEach((k) => console.log(` - ${k}`));
        }
        return;
      }
      if (opts.unfreeze) {
        unfreezeKey(vault, key);
        console.log(`Key "${key}" unfrozen.`);
      } else {
        freezeKey(vault, key);
        console.log(`Key "${key}" frozen.`);
      }
    });
}
