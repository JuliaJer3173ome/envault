import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerResolveCommand, resolveValue } from './resolve';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerResolveCommand(program);
  return program;
}

describe('resolveValue', () => {
  it('substitutes known keys', () => {
    expect(resolveValue('Hello ${NAME}', { NAME: 'World' })).toBe('Hello World');
  });

  it('leaves unknown keys intact', () => {
    expect(resolveValue('${MISSING}', {})).toBe('${MISSING}');
  });

  it('handles multiple substitutions', () => {
    const result = resolveValue('${A}-${B}', { A: 'foo', B: 'bar' });
    expect(result).toBe('foo-bar');
  });
});

describe('resolve command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prints resolved template', async () => {
    vi.spyOn(vault, 'readVault').mockReturnValue({} as any);
    vi.spyOn(vault, 'openVault').mockReturnValue({ HOST: 'localhost', PORT: '5432' });
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'resolve', 'vault.env', '${HOST}:${PORT}', '-p', 'secret']);

    expect(spy).toHaveBeenCalledWith('localhost:5432');
  });

  it('exits on bad password', async () => {
    vi.spyOn(vault, 'readVault').mockReturnValue({} as any);
    vi.spyOn(vault, 'openVault').mockImplementation(() => { throw new Error('bad password'); });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'resolve', 'vault.env', '${X}', '-p', 'wrong'])
    ).rejects.toThrow();
    expect(errSpy).toHaveBeenCalledWith('Error: bad password');
  });
});
