import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const PIN_FILE = path.join(os.homedir(), '.envault_pins.json');

export function readPins(): Record<string, string> {
  if (!fs.existsSync(PIN_FILE)) return {};
  return JSON.parse(fs.readFileSync(PIN_FILE, 'utf-8'));
}

export function writePins(pins: Record<string, string>): void {
  fs.writeFileSync(PIN_FILE, JSON.stringify(pins, null, 2));
}

export function pinVault(alias: string, vaultPath: string): void {
  const pins = readPins();
  pins[alias] = path.resolve(vaultPath);
  writePins(pins);
}

export function unpinVault(alias: string): boolean {
  const pins = readPins();
  if (!pins[alias]) return false;
  delete pins[alias];
  writePins(pins);
  return true;
}

export function resolveAlias(alias: string): string | undefined {
  return readPins()[alias];
}

export function registerPinCommand(program: Command): void {
  const pin = program.command('pin').description('Manage vault aliases (pins)');

  pin
    .command('add <alias> <vaultPath>')
    .description('Pin a vault path to an alias')
    .action((alias: string, vaultPath: string) => {
      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }
      pinVault(alias, vaultPath);
      console.log(`Pinned "${alias}" -> ${path.resolve(vaultPath)}`);
    });

  pin
    .command('remove <alias>')
    .description('Remove a pinned vault alias')
    .action((alias: string) => {
      if (!unpinVault(alias)) {
        console.error(`Alias not found: ${alias}`);
        process.exit(1);
      }
      console.log(`Removed pin "${alias}"`);
    });

  pin
    .command('list')
    .description('List all pinned vault aliases')
    .action(() => {
      const pins = readPins();
      const entries = Object.entries(pins);
      if (entries.length === 0) {
        console.log('No pinned vaults.');
        return;
      }
      entries.forEach(([alias, p]) => console.log(`${alias} -> ${p}`));
    });
}
