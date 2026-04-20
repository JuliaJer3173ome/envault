import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export type CastType = 'string' | 'number' | 'boolean' | 'json';

export function castValue(value: string, type: CastType): string {
  switch (type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) throw new Error(`Cannot cast "${value}" to number`);
      return String(num);
    }
    case 'boolean': {
      const lower = value.toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(lower)) return 'true';
      if (['false', '0', 'no', 'off'].includes(lower)) return 'false';
      throw new Error(`Cannot cast "${value}" to boolean`);
    }
    case 'json': {
      try {
        JSON.parse(value);
        return value;
      } catch {
        // Try wrapping as a JSON string
        return JSON.stringify(value);
      }
    }
    case 'string':
    default:
      return String(value);
  }
}

export function castEntries(
  entries: Record<string, string>,
  keys: string[],
  type: CastType
): Record<string, string> {
  const result = { ...entries };
  for (const key of keys) {
    if (!(key in result)) throw new Error(`Key "${key}" not found in vault`);
    result[key] = castValue(result[key], type);
  }
  return result;
}

export function registerCastCommand(program: Command): void {
  program
    .command('cast <type> <keys...>')
    .description('Cast the value(s) of one or more keys to a given type (string|number|boolean|json)')
    .requiredOption('-v, --vault <path>', 'Path to the vault file')
    .requiredOption('-p, --password <password>', 'Vault password')
    .action(async (type: string, keys: string[], opts) => {
      const validTypes: CastType[] = ['string', 'number', 'boolean', 'json'];
      if (!validTypes.includes(type as CastType)) {
        console.error(`Invalid type "${type}". Must be one of: ${validTypes.join(', ')}`);
        process.exit(1);
      }
      try {
        const vault = await openVault(opts.vault, opts.password);
        const updated = castEntries(vault.entries, keys, type as CastType);
        vault.entries = updated;
        await writeVault(opts.vault, vault, opts.password);
        console.log(`Cast ${keys.join(', ')} to ${type}`);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });
}
