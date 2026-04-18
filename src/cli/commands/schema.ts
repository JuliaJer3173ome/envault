import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault } from '../../crypto';

export interface SchemaField {
  key: string;
  required: boolean;
  description?: string;
  pattern?: string;
}

export interface VaultSchema {
  fields: SchemaField[];
}

export function readSchema(schemaPath: string): VaultSchema {
  if (!fs.existsSync(schemaPath)) return { fields: [] };
  return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
}

export function writeSchema(schemaPath: string, schema: VaultSchema): void {
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
}

export function validateAgainstSchema(
  entries: Record<string, string>,
  schema: VaultSchema
): string[] {
  const errors: string[] = [];
  for (const field of schema.fields) {
    if (field.required && !(field.key in entries)) {
      errors.push(`Missing required key: ${field.key}`);
    }
    if (field.pattern && field.key in entries) {
      const re = new RegExp(field.pattern);
      if (!re.test(entries[field.key])) {
        errors.push(`Key "${field.key}" does not match pattern ${field.pattern}`);
      }
    }
  }
  return errors;
}

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerSchemaCommand(program: Command): void {
  const schema = program.command('schema').description('Manage vault schema');

  schema
    .command('set <vaultPath> <schemaPath>')
    .description('Validate vault against a JSON schema file')
    .action(async (vaultPath: string, schemaPath: string) => {
      const password = await promptPassword('Password: ');
      const vault = await openVault(vaultPath, password);
      const s = readSchema(schemaPath);
      const errors = validateAgainstSchema(vault, s);
      if (errors.length === 0) {
        console.log('Vault is valid against schema.');
      } else {
        errors.forEach((e) => console.error(e));
        process.exit(1);
      }
    });

  schema
    .command('init <schemaPath>')
    .description('Create an empty schema file')
    .action((schemaPath: string) => {
      writeSchema(schemaPath, { fields: [] });
      console.log(`Schema created at ${schemaPath}`);
    });
}
