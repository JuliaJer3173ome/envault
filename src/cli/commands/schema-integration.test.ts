import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { createVault } from '../../crypto';
import { registerSchemaCommand, writeSchema } from './schema';

let tmpDir: string;

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSchemaCommand(program);
  return program;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-schema-int-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('schema init command', () => {
  it('creates an empty schema file', async () => {
    const schemaPath = path.join(tmpDir, 'schema.json');
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'schema', 'init', schemaPath]);
    expect(fs.existsSync(schemaPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    expect(content.fields).toEqual([]);
  });
});
