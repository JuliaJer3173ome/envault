import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ALIAS_FILE = path.join(os.homedir(), '.envault', 'aliases.json');

export interface AliasMap {
  [alias: string]: string;
}

export function readAliases(): AliasMap {
  if (!fs.existsSync(ALIAS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ALIAS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function writeAliases(aliases: AliasMap): void {
  const dir = path.dirname(ALIAS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ALIAS_FILE, JSON.stringify(aliases, null, 2));
}

export function setAlias(alias: string, vaultPath: string): void {
  const aliases = readAliases();
  aliases[alias] = path.resolve(vaultPath);
  writeAliases(aliases);
}

export function removeAlias(alias: string): boolean {
  const aliases = readAliases();
  if (!(alias in aliases)) return false;
  delete aliases[alias];
  writeAliases(aliases);
  return true;
}

export function resolveAlias(alias: string): string | undefined {
  return readAliases()[alias];
}

export function registerAliasCommand(program: Command): void {
  const cmd = program.command('alias').description('Manage vault path aliases');

  cmd
    .command('set <alias> <vault>')
    .description('Create an alias for a vault path')
    .action((alias: string, vault: string) => {
      setAlias(alias, vault);
      console.log(`Alias '${alias}' -> '${path.resolve(vault)}' saved.`);
    });

  cmd
    .command('remove <alias>')
    .description('Remove an existing alias')
    .action((alias: string) => {
      const removed = removeAlias(alias);
      if (removed) {
        console.log(`Alias '${alias}' removed.`);
      } else {
        console.error(`Alias '${alias}' not found.`);
        process.exit(1);
      }
    });

  cmd
    .command('list')
    .description('List all aliases')
    .action(() => {
      const aliases = readAliases();
      const entries = Object.entries(aliases);
      if (entries.length === 0) {
        console.log('No aliases defined.');
        return;
      }
      entries.forEach(([alias, vaultPath]) => {
        console.log(`${alias} -> ${vaultPath}`);
      });
    });

  cmd
    .command('resolve <alias>')
    .description('Print the vault path for an alias')
    .action((alias: string) => {
      const resolved = resolveAlias(alias);
      if (resolved) {
        console.log(resolved);
      } else {
        console.error(`Alias '${alias}' not found.`);
        process.exit(1);
      }
    });
}
