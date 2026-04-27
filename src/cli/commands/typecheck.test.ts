import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { inferType, typecheckEntries, registerTypecheckCommand } from './typecheck';
import { vi } from 'vitest';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTypecheckCommand(program);
  return program;
}

describe('inferType', () => {
  it('detects boolean', () => {
    expect(inferType('true')).toBe('boolean');
    expect(inferType('false')).toBe('boolean');
  });

  it('detects number', () => {
    expect(inferType('42')).toBe('number');
    expect(inferType('3.14')).toBe('number');
  });

  it('detects url', () => {
    expect(inferType('https://example.com')).toBe('url');
    expect(inferType('http://localhost:3000')).toBe('url');
  });

  it('detects date', () => {
    expect(inferType('2024-01-15')).toBe('date');
    expect(inferType('2024-01-15T12:00:00Z')).toBe('date');
  });

  it('detects email', () => {
    expect(inferType('user@example.com')).toBe('email');
  });

  it('defaults to string', () => {
    expect(inferType('hello world')).toBe('string');
    expect(inferType('')).toBe('string');
  });
});

describe('typecheckEntries', () => {
  const entries = {
    PORT: '3000',
    DEBUG: 'true',
    API_URL: 'https://api.example.com',
    NAME: 'myapp',
  };

  it('returns valid results for matching types', () => {
    const results = typecheckEntries(entries, { PORT: 'number', DEBUG: 'boolean' });
    expect(results.every((r) => r.valid)).toBe(true);
  });

  it('returns invalid results for mismatched types', () => {
    const results = typecheckEntries(entries, { PORT: 'string', NAME: 'number' });
    expect(results.find((r) => r.key === 'PORT')?.valid).toBe(false);
    expect(results.find((r) => r.key === 'NAME')?.valid).toBe(false);
  });

  it('marks missing keys as string (empty) vs expected type', () => {
    const results = typecheckEntries(entries, { MISSING: 'number' });
    expect(results[0].valid).toBe(false);
    expect(results[0].actualType).toBe('string');
  });
});

describe('typecheck command', () => {
  it('exits with error when no schema provided', async () => {
    const program = buildProgram();
    vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as never);
    await expect(
      program.parseAsync(['node', 'test', 'typecheck', 'vault.enc', '-p', 'pass'])
    ).rejects.toThrow();
  });

  it('runs typecheck against vault entries', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({
      entries: { PORT: '8080', ENABLED: 'true' },
    } as never);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync([
      'node', 'test', 'typecheck', 'vault.enc',
      '-p', 'pass',
      '--schema', 'PORT:number', 'ENABLED:boolean',
    ]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✔ PORT'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✔ ENABLED'));
    consoleSpy.mockRestore();
  });
});
