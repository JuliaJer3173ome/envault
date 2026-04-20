import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault, updateVault } from '../../crypto/vault';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function parsePatchFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

export function registerPatchCommand(program: Command): void {
  program
    .command('patch <vault> <patchfile>')
    .description('Apply a .env patch file to update multiple keys in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'preview changes without applying them')
    .action(async (vaultPath: string, patchFile: string, opts) => {
      try {
        if (!fs.existsSync(patchFile)) {
          console.error(`Patch file not found: ${patchFile}`);
          process.exit(1);
        }
        const patchContent = fs.readFileSync(patchFile, 'utf-8');
        const patches = parsePatchFile(patchContent);
        const keys = Object.keys(patches);
        if (keys.length === 0) {
          console.error('No valid entries found in patch file.');
          process.exit(1);
        }
        const password = opts.password ?? await promptPassword('Enter vault password: ');
        const vault = await openVault(vaultPath, password);
        if (opts.dryRun) {
          console.log('Dry run — changes that would be applied:');
          for (const [k, v] of Object.entries(patches)) {
            const old = vault.entries[k];
            console.log(`  ${k}: ${old !== undefined ? old : '(new)'} → ${v}`);
          }
          return;
        }
        const updated = { ...vault.entries, ...patches };
        await updateVault(vaultPath, password, updated);
        console.log(`Patched ${keys.length} key(s) in ${vaultPath}.`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
