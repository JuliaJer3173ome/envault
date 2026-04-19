import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uppercaseEntries } from './uppercase';
import { Command } from 'commander';
import { registerUppercaseCommand } from './uppercase';

vi.mock('../../crypto/vault', () => ({
  openVault: vi.fn(),
  writeVault: vi.fn(),
}));

import { openVault, writeVault } from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerUppercaseCommand(program);
  return program;
}

describe('uppercaseEntries', () => {
  it('uppercases all values when no keys specified', () => {
    const result = uppercaseEntries({ FOO: 'hello', BAR: 'world' });
    expect(result).toEqual({ FOO: 'HELLO', BAR: 'WORLD' });
  });

  it('uppercases only specified keys', () => {
    const result = uppercaseEntries({ FOO: 'hello', BAR: 'world' }, ['FOO']);
    expect(result).toEqual({ FOO: 'HELLO', BAR: 'world' });
  });

  it('returns unchanged entries if keys list is empty array', () => {
    const result = uppercaseEntries({ FOO: 'hello' }, []);
    expect(result).toEqual({ FOO: 'hello' });
  });
});

describe('uppercase command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls openVault and writeVault with uppercased entries', async () => {
    (openVault as any).mockResolvedValue({ entries: { KEY: 'value' } });
    (writeVault as any).mockResolvedValue(undefined);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'uppercase', 'vault.env', '--password', 'secret']);
    expect(openVault).toHaveBeenCalledWith('vault.env', 'secret');
    expect(writeVault).toHaveBeenCalledWith('vault.env', { entries: { KEY: 'VALUE' } });
  });

  it('exits with error when password is missing', async () => {
    const program = buildProgram();
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'uppercase', 'vault.env'])
    ).rejects.toThrow();
    mockExit.mockRestore();
  });
});
