import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerValidateCommand } from './validate';
import { registerInitCommand } from './init';
import { registerSetCommand } from './set';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerSetCommand(program);
  registerValidateCommand(program);
  return program;
}

describe('validate command integration', () => {
  let tmpDir: string;
  let vaultPath: string;
  let schemaPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-validate-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    schemaPath = path.join(tmpDir, 'test.schema.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('validates a vault successfully against a matching schema', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'init', vaultPath, '--password', 'secret']);
    await program.parseAsync(['node', 'envault', 'set', vaultPath, 'PORT', '3000', '--password', 'secret']);

    const schema = { PORT: { type: 'number', required: true } };
    fs.writeFileSync(schemaPath, JSON.stringify(schema));

    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg: string) => logs.push(msg);

    await program.parseAsync(['node', 'envault', 'validate', vaultPath, '--schema', schemaPath, '--password', 'secret']);

    console.log = origLog;
    expect(logs.some(l => l.includes('valid'))).toBe(true);
  });

  it('exits with error when required key is missing', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'init', vaultPath, '--password', 'secret']);

    const schema = { REQUIRED_KEY: { required: true } };
    fs.writeFileSync(schemaPath, JSON.stringify(schema));

    const errors: string[] = [];
    const origErr = console.error;
    console.error = (msg: string) => errors.push(msg);

    let exitCode = 0;
    const origExit = process.exit;
    process.exit = ((code: number) => { exitCode = code; }) as never;

    await program.parseAsync(['node', 'envault', 'validate', vaultPath, '--schema', schemaPath, '--password', 'secret']);

    console.error = origErr;
    process.exit = origExit;

    expect(exitCode).toBe(1);
    expect(errors.some(e => e.includes('REQUIRED_KEY'))).toBe(true);
  });
});
