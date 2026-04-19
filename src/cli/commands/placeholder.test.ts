import { applyPlaceholders } from './placeholder';
import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerPlaceholderCommand } from './placeholder';
import * as vault from '../../crypto/vault';
import { vi } from 'vitest';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerPlaceholderCommand(program);
  return program;
}

describe('applyPlaceholders', () => {
  it('replaces known placeholders', () => {
    const entries = { DB_URL: 'postgres://{{HOST}}:{{PORT}}/db' };
    const result = applyPlaceholders(entries, { HOST: 'localhost', PORT: '5432' });
    expect(result.DB_URL).toBe('postgres://localhost:5432/db');
  });

  it('leaves unknown placeholders intact', () => {
    const entries = { KEY: '{{UNKNOWN}}' };
    const result = applyPlaceholders(entries, {});
    expect(result.KEY).toBe('{{UNKNOWN}}');
  });

  it('handles entries with no placeholders', () => {
    const entries = { PLAIN: 'value' };
    const result = applyPlaceholders(entries, { X: 'y' });
    expect(result.PLAIN).toBe('value');
  });
});

describe('placeholder command', () => {
  it('prints replacements on dry-run', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { URL: 'http://{{HOST}}' }, salt: '', iv: '', tag: '', version: 1 } as any);
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m) => logs.push(m));
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'placeholder', 'vault.env', 'HOST=example.com', '--dry-run', '--password', 'pass']);
    expect(logs).toContain('URL=http://example.com');
    vi.restoreAllMocks();
  });
});
