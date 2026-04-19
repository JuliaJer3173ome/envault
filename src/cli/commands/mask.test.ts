import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { maskEntries, registerMaskCommand } from './mask';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerMaskCommand(program);
  return program;
}

describe('maskEntries', () => {
  it('masks long values', () => {
    const result = maskEntries({ SECRET: 'abcdefgh' }, ['SECRET']);
    expect(result['SECRET']).toBe('ab****gh');
  });

  it('masks short values with ****', () => {
    const result = maskEntries({ KEY: 'ab' }, ['KEY']);
    expect(result['KEY']).toBe('****');
  });

  it('leaves unspecified keys unchanged', () => {
    const result = maskEntries({ A: 'hello', B: 'world' }, ['A']);
    expect(result['B']).toBe('world');
  });

  it('ignores keys not in entries', () => {
    const result = maskEntries({ A: 'hello' }, ['MISSING']);
    expect(result).toEqual({ A: 'hello' });
  });
});

describe('mask command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prints masked entries to stdout', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { TOKEN: 'supersecret' } } as any);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'mask', 'vault.env', 'TOKEN', '--password', 'pass']);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('TOKEN='));
    expect(log.mock.calls[0][0]).toMatch(/\*/);
  });

  it('writes masked values when --write flag is set', async () => {
    const fakeVault = { entries: { TOKEN: 'supersecret' } } as any;
    vi.spyOn(vault, 'openVault').mockResolvedValue(fakeVault);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'mask', 'vault.env', 'TOKEN', '--password', 'pass', '--write']);
    expect(writeSpy).toHaveBeenCalled();
  });
});
