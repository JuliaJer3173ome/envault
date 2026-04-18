import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readSchema, writeSchema, validateAgainstSchema, VaultSchema } from './schema';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-schema-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readSchema', () => {
  it('returns empty schema when file does not exist', () => {
    const s = readSchema(path.join(tmpDir, 'missing.json'));
    expect(s.fields).toEqual([]);
  });

  it('reads schema from file', () => {
    const schemaPath = path.join(tmpDir, 'schema.json');
    const schema: VaultSchema = { fields: [{ key: 'API_KEY', required: true }] };
    fs.writeFileSync(schemaPath, JSON.stringify(schema));
    expect(readSchema(schemaPath)).toEqual(schema);
  });
});

describe('writeSchema', () => {
  it('writes schema to file', () => {
    const schemaPath = path.join(tmpDir, 'schema.json');
    const schema: VaultSchema = { fields: [{ key: 'DB_URL', required: false }] };
    writeSchema(schemaPath, schema);
    expect(JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))).toEqual(schema);
  });
});

describe('validateAgainstSchema', () => {
  it('returns no errors for valid entries', () => {
    const schema: VaultSchema = { fields: [{ key: 'API_KEY', required: true }] };
    const errors = validateAgainstSchema({ API_KEY: 'abc' }, schema);
    expect(errors).toHaveLength(0);
  });

  it('reports missing required key', () => {
    const schema: VaultSchema = { fields: [{ key: 'API_KEY', required: true }] };
    const errors = validateAgainstSchema({}, schema);
    expect(errors).toContain('Missing required key: API_KEY');
  });

  it('reports pattern mismatch', () => {
    const schema: VaultSchema = { fields: [{ key: 'PORT', required: false, pattern: '^\\d+$' }] };
    const errors = validateAgainstSchema({ PORT: 'abc' }, schema);
    expect(errors[0]).toMatch(/does not match pattern/);
  });

  it('passes pattern match', () => {
    const schema: VaultSchema = { fields: [{ key: 'PORT', required: false, pattern: '^\\d+$' }] };
    const errors = validateAgainstSchema({ PORT: '8080' }, schema);
    expect(errors).toHaveLength(0);
  });
});
