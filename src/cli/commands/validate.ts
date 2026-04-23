import { Command } from 'commander';
import * as fs from 'fs';
import { openVault } from '../../crypto/vault';
import { readSchema, validateAgainstSchema } from './schema';

export interface ValidationResult {
  key: string;
  valid: boolean;
  reason?: string;
}

export function validateEntries(
  entries: Record<string, string>,
  schema: Record<string, { type?: string; required?: boolean; pattern?: string }>
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = entries[key];

    if (rules.required && (value === undefined || value === '')) {
      results.push({ key, valid: false, reason: 'required but missing or empty' });
      continue;
    }

    if (value === undefined) {
      results.push({ key, valid: true });
      continue;
    }

    if (rules.type === 'number' && isNaN(Number(value))) {
      results.push({ key, valid: false, reason: `expected number, got "${value}"` });
      continue;
    }

    if (rules.type === 'boolean' && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
      results.push({ key, valid: false, reason: `expected boolean, got "${value}"` });
      continue;
    }

    if (rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        results.push({ key, valid: false, reason: `does not match pattern ${rules.pattern}` });
        continue;
      }
    }

    results.push({ key, valid: true });
  }

  return results;
}

export function registerValidateCommand(program: Command): void {
  program
    .command('validate <vault>')
    .description('Validate vault entries against a schema file')
    .option('-s, --schema <path>', 'path to schema JSON file')
    .option('-p, --password <password>', 'vault password')
    .option('--strict', 'fail on any key not defined in schema')
    .action(async (vaultPath: string, options) => {
      const password = options.password ?? process.env.ENVAULT_PASSWORD ?? '';
      if (!password) {
        console.error('Error: password is required');
        process.exit(1);
      }

      const vault = openVault(vaultPath, password);
      const schemaPath = options.schema ?? vaultPath.replace(/\.vault$/, '.schema.json');

      if (!fs.existsSync(schemaPath)) {
        console.error(`Error: schema file not found: ${schemaPath}`);
        process.exit(1);
      }

      const schema = readSchema(schemaPath);
      const results = validateEntries(vault, schema);

      if (options.strict) {
        const schemaKeys = new Set(Object.keys(schema));
        for (const key of Object.keys(vault)) {
          if (!schemaKeys.has(key)) {
            results.push({ key, valid: false, reason: 'not defined in schema (strict mode)' });
          }
        }
      }

      let hasErrors = false;
      for (const result of results) {
        if (!result.valid) {
          console.error(`  ✗ ${result.key}: ${result.reason}`);
          hasErrors = true;
        } else {
          console.log(`  ✓ ${result.key}`);
        }
      }

      if (hasErrors) {
        console.error('\nValidation failed.');
        process.exit(1);
      } else {
        console.log('\nAll entries are valid.');
      }
    });
}
