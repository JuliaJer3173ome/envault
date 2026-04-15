import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { openVault } from '../../crypto';
import { readHistory } from './history';

export interface AuditResult {
  key: string;
  lastModified: string | null;
  accessCount: number;
  tags: string[];
  presentInVault: boolean;
}

export function auditVault(
  vaultPath: string,
  entries: Record<string, string>,
  tags: Record<string, string[]>
): AuditResult[] {
  const history = fs.existsSync(getHistoryFilePath(vaultPath))
    ? readHistory(vaultPath)
    : [];

  return Object.keys(entries).map((key) => {
    const keyEvents = history.filter((e) => e.key === key);
    const lastEvent = keyEvents[keyEvents.length - 1] ?? null;

    return {
      key,
      lastModified: lastEvent ? lastEvent.timestamp : null,
      accessCount: keyEvents.length,
      tags: tags[key] ?? [],
      presentInVault: true,
    };
  });
}

function getHistoryFilePath(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `${base}.history.json`);
}

export function registerAuditCommand(program: Command): void {
  program
    .command('audit <vault>')
    .description('Audit vault entries: show access history, tags, and metadata')
    .option('-p, --password <password>', 'vault password')
    .option('--json', 'output as JSON')
    .action(async (vault: string, options: { password?: string; json?: boolean }) => {
      try {
        const password = options.password ?? (await promptPassword());
        const { entries, tags } = await openVault(vault, password);
        const results = auditVault(vault, entries, tags ?? {});

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        } else {
          if (results.length === 0) {
            console.log('No entries found in vault.');
            return;
          }
          console.log(`\nAudit report for: ${vault}\n`);
          results.forEach((r) => {
            console.log(`  Key:           ${r.key}`);
            console.log(`  Last Modified: ${r.lastModified ?? 'never'}`);
            console.log(`  Access Count:  ${r.accessCount}`);
            console.log(`  Tags:          ${r.tags.length > 0 ? r.tags.join(', ') : 'none'}`);
            console.log('');
          });
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}

async function promptPassword(): Promise<string> {
  const { default: inquirer } = await import('inquirer');
  const { password } = await inquirer.prompt([
    { type: 'password', name: 'password', message: 'Enter vault password:', mask: '*' },
  ]);
  return password;
}
