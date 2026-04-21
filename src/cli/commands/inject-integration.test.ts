import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerInjectCommand } from './inject';
import { registerInitCommand } from './init';
import { registerSetCommand } from './set';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerSetCommand(program);
  registerInjectCommand(program);
  return program;
}

describe('inject integration', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-inject-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init', vaultPath, '--password', 'testpass']);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'GREETING', 'hello', '--password', 'testpass']);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'APP_NAME', 'envault', '--password', 'testpass']);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('injects secrets into child process environment', async () => {
    const outFile = path.join(tmpDir, 'out.txt');
    const program = buildProgram();
    await program.parseAsync([
      'node', 'test', 'inject', vaultPath,
      '--password', 'testpass',
      'sh', '-c', `echo $GREETING > ${outFile}`
    ]);
    const output = fs.readFileSync(outFile, 'utf-8').trim();
    expect(output).toBe('hello');
  });

  it('injects only prefixed keys when --prefix is used', async () => {
    const outFile = path.join(tmpDir, 'out2.txt');
    const program = buildProgram();
    await program.parseAsync([
      'node', 'test', 'inject', vaultPath,
      '--password', 'testpass',
      '--prefix', 'APP_',
      'sh', '-c', `echo ${process.env.GREETING ?? 'MISSING'} > ${outFile}`
    ]);
    const output = fs.readFileSync(outFile, 'utf-8').trim();
    expect(output).toBe('MISSING');
  });
});
