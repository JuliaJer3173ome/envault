import { Command } from 'commander';
import { openVault } from '../../crypto/vault';

export type TypeCheckResult = {
  key: string;
  value: string;
  expectedType: string;
  actualType: string;
  valid: boolean;
};

export function inferType(value: string): string {
  if (value === 'true' || value === 'false') return 'boolean';
  if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
  if (value.startsWith('http://') || value.startsWith('https://')) return 'url';
  if (/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/.test(value)) return 'date';
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'email';
  return 'string';
}

export function typecheckEntries(
  entries: Record<string, string>,
  schema: Record<string, string>
): TypeCheckResult[] {
  return Object.entries(schema).map(([key, expectedType]) => {
    const value = entries[key] ?? '';
    const actualType = inferType(value);
    return {
      key,
      value,
      expectedType,
      actualType,
      valid: actualType === expectedType,
    };
  });
}

export function registerTypecheckCommand(program: Command): void {
  program
    .command('typecheck <vault>')
    .description('Check value types in a vault against a type schema')
    .option('-p, --password <password>', 'vault password')
    .option(
      '-s, --schema <pairs...>',
      'type assertions as KEY:TYPE pairs (e.g. PORT:number DEBUG:boolean)'
    )
    .action(async (vaultPath: string, opts) => {
      const password = opts.password ?? '';
      const schemaPairs: string[] = opts.schema ?? [];

      if (schemaPairs.length === 0) {
        console.error('Error: provide at least one --schema KEY:TYPE pair');
        process.exit(1);
      }

      const schema: Record<string, string> = {};
      for (const pair of schemaPairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx === -1) {
          console.error(`Error: invalid schema pair "${pair}", expected KEY:TYPE`);
          process.exit(1);
        }
        schema[pair.slice(0, colonIdx)] = pair.slice(colonIdx + 1);
      }

      const vault = await openVault(vaultPath, password);
      const results = typecheckEntries(vault.entries, schema);

      let allValid = true;
      for (const r of results) {
        if (r.valid) {
          console.log(`  ✔ ${r.key}: ${r.actualType}`);
        } else {
          console.log(`  ✘ ${r.key}: expected ${r.expectedType}, got ${r.actualType} ("${r.value}")`);
          allValid = false;
        }
      }

      if (!allValid) process.exit(1);
    });
}
