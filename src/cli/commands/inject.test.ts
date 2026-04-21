import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerInjectCommand, buildEnvArgs } from './inject';
import * as vault from '../../crypto/vault';
import * as child_process from 'child_process';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerInjectCommand(program);
  return program;
}

describe('buildEnvArgs', () => {
  it('merges entries into process.env', () => {
    const result = buildEnvArgs({ FOO: 'bar', BAZ: 'qux' });
    expect(result['FOO']).toBe('bar');
    expect(result['BAZ']).toBe('qux');
  });

  it('does not mutate process.env directly', () => {
    const before = { ...process.env };
    buildEnvArgs({ NEW_KEY: 'value' });
    expect(process.env['NEW_KEY']).toBeUndefined();
    expect(Object.keys(process.env)).toEqual(Object.keys(before));
  });
});

describe('inject command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runs command with injected env vars', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { SECRET: 'abc123' } } as any);
    const execSpy = vi.spyOn(child_process, 'execSync').mockImplementation(() => Buffer.from(''));
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'inject', 'vault.env', '--password', 'pass', 'echo', 'hello']);
    expect(execSpy).toHaveBeenCalledWith('echo hello', expect.objectContaining({ SECRET: 'abc123' }), expect.anything());
  });

  it('filters keys by prefix', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { APP_KEY: 'x', OTHER: 'y' } } as any);
    const execSpy = vi.spyOn(child_process, 'execSync').mockImplementation(() => Buffer.from(''));
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'inject', 'vault.env', '--password', 'pass', '--prefix', 'APP_', 'printenv']);
    expect(execSpy).toHaveBeenCalledWith('printenv', expect.objectContaining({ APP_KEY: 'x' }), expect.anything());
    expect(execSpy).toHaveBeenCalledWith('printenv', expect.not.objectContaining({ OTHER: 'y' }), expect.anything());
  });

  it('strips prefix when --strip-prefix is set', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { APP_TOKEN: 'tok' } } as any);
    const execSpy = vi.spyOn(child_process, 'execSync').mockImplementation(() => Buffer.from(''));
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'inject', 'vault.env', '--password', 'pass', '--prefix', 'APP_', '--strip-prefix', 'env']);
    expect(execSpy).toHaveBeenCalledWith('env', expect.objectContaining({ TOKEN: 'tok' }), expect.anything());
  });

  it('exits on vault error', async () => {
    vi.spyOn(vault, 'openVault').mockRejectedValue(new Error('bad password'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'inject', 'vault.env', '--password', 'wrong', 'ls'])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
