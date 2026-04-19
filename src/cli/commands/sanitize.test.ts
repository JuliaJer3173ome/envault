import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { sanitizeEntries, registerSanitizeCommand } from './sanitize';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSanitizeCommand(program);
  return program;
}

describe('sanitizeEntries', () => {
  it('removes empty string values', () => {
    const { sanitized, removed } = sanitizeEntries({ KEY: '', OTHER: 'value' });
    expect(removed).toContain('KEY');
    expect(sanitized).not.toHaveProperty('KEY');
    expect(sanitized.OTHER).toBe('value');
  });

  it('removes null string values', () => {
    const { removed } = sanitizeEntries({ KEY: 'null' });
    expect(removed).toContain('KEY');
  });

  it('removes undefined string values', () => {
    const { removed } = sanitizeEntries({ KEY: 'undefined' });
    expect(removed).toContain('KEY');
  });

  it('trims whitespace-only values and removes them', () => {
    const { removed } = sanitizeEntries({ KEY: '   ' });
    expect(removed).toContain('KEY');
  });

  it('trims whitespace from valid values', () => {
    const { sanitized } = sanitizeEntries({ KEY: '  hello  ' });
    expect(sanitized.KEY).toBe('hello');
  });

  it('returns empty removed list when all entries are valid', () => {
    const { removed } = sanitizeEntries({ A: 'x', B: 'y' });
    expect(removed).toHaveLength(0);
  });
});

describe('sanitize command', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('writes sanitized vault when entries are removed', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { EMPTY: '', VALID: 'ok' } } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined as any);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'sanitize', 'my.vault', '-p', 'pass']);
    expect(writeSpy).toHaveBeenCalledWith('my.vault', expect.objectContaining({ entries: { VALID: 'ok' } }));
  });

  it('does not write vault on dry run', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { EMPTY: '' } } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined as any);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'sanitize', 'my.vault', '-p', 'pass', '--dry-run']);
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
