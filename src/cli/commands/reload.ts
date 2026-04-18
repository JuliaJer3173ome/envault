import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault } from '../../crypto';

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

export async function reloadVault(
  vaultPath: string,
  envPath: string,
  password: string
): Promise<Record<string, string>> {
  if (!fs.existsSync(envPath)) throw new Error(`File not found: ${envPath}`);
  const raw = fs.readFileSync(envPath, 'utf-8');
  const entries: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    if (key) entries[key] = value;
  }
  const vault = await openVault(vaultPath, password);
  const merged = { ...vault.entries, ...entries };
  return merged;
}

export function registerReloadCommand(program: Command): void {
  program
    .command('reload <vault> <envfile>')
    .description('Reload entries from a .env file into the vault, merging with existing keys')
    .option('-p, --password <password>', 'vault password')
    .option('--overwrite', 'overwrite existing keys', false)
    .action(async (vault: string, envfile: string, opts) => {
      try {
        const password = opts.password ?? await promptPassword('Password: ');
        const { openVault, writeVault } = await import('../../crypto');
        const v = await openVault(vault, password);
        if (!fs.existsSync(envfile)) { console.error(`File not found: ${envfile}`); process.exit(1); }
        const raw = fs.readFileSync(envfile, 'utf-8');
        let count = 0;
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx === -1) continue;
          const key = trimmed.slice(0, idx).trim();
          const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
          if (!key) continue;
          if (!opts.overwrite && key in v.entries) continue;
          v.entries[key] = value;
          count++;
        }
        await writeVault(vault, v);
        console.log(`Reloaded ${count} entr${count === 1 ? 'y' : 'ies'} from ${envfile}`);
      } catch (e: any) {
        console.error(e.message); process.exit(1);
      }
    });
}
