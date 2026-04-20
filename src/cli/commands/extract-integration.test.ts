import { describe, it, expect, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerExtractCommand } from './extract';
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
  registerExtractCommand(program);
  return program;
}

describe('extract integration', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-extract-'));
  const vaultPath = path.join(tmpDir, 'test.vault');
  const outVault = path.join(tmpDir, 'out.vault');
  const outEnv = path.join(tmpDir, 'out.env');
  const password = 'integration-pass';

  afterEach(() => {
    for (const f of [vaultPath, outVault, outEnv]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it('extracts keys into a new vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init', vaultPath, '-p', password]);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'KEY1', 'value1', '-p', password]);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'KEY2', 'value2', '-p', password]);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'KEY3', 'value3', '-p', password]);

    await program.parseAsync(['node', 'test', 'extract', vaultPath, 'KEY1', 'KEY3', '-p', password, '-o', outVault]);

    expect(fs.existsSync(outVault)).toBe(true);

    const { openVault } = await import('../../crypto/vault');
    const entries = await openVault(outVault, password);
    expect(entries).toHaveProperty('KEY1', 'value1');
    expect(entries).toHaveProperty('KEY3', 'value3');
    expect(entries).not.toHaveProperty('KEY2');
  });

  it('extracts keys to .env file', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init', vaultPath, '-p', password]);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'ALPHA', 'one', '-p', password]);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'BETA', 'two', '-p', password]);

    await program.parseAsync(['node', 'test', 'extract', vaultPath, 'ALPHA', '--env', '-o', outEnv, '-p', password]);

    expect(fs.existsSync(outEnv)).toBe(true);
    const content = fs.readFileSync(outEnv, 'utf-8');
    expect(content).toContain('ALPHA=one');
    expect(content).not.toContain('BETA');
  });
});
