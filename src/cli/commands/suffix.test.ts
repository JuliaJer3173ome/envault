import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerSuffixCommand, suffixEntries } from './suffix';
import * as vault from '../../crypto/vault';

vi.mock('../../crypto/vault');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSuffixCommand(program);
  return program;
}

describe('suffixEntries', () => {
  it('appends suffix to all values', () => {
    const entries = { KEY1: 'hello', KEY2: 'world' };
    expect(suffixEntries(entries, '_dev')).toEqual({ KEY1: 'hello_dev', KEY2: 'world_dev' });
  });

  it('returns empty object for empty entries', () => {
    expect(suffixEntries({}, '_dev')).toEqual({});
  });

  it('appends suffix only to specified keys', () => {
    const entries = { KEY1: 'hello', KEY2: 'world' };
    expect(suffixEntries(entries, '_dev', ['KEY1'])).toEqual({ KEY1: 'hello_dev', KEY2: 'world' });
  });
});

describe('suffix command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('appends suffix to vault values', async () => {
    vi.mocked(vault.openVault).mockResolvedValue({ KEY1: 'foo', KEY2: 'bar' });
    vi.mocked(vault.updateVault).mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'suffix', 'vault.env', '_prod', '--password', 'secret']);

    expect(vault.updateVault).toHaveBeenCalledWith(
      'vault.env',
      { KEY1: 'foo_prod', KEY2: 'bar_prod' },
      'secret'
    );
  });

  it('appends suffix only to specified keys', async () => {
    vi.mocked(vault.openVault).mockResolvedValue({ KEY1: 'foo', KEY2: 'bar' });
    vi.mocked(vault.updateVault).mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'suffix', 'vault.env', '_prod', '--password', 'secret', '--keys', 'KEY1']);

    expect(vault.updateVault).toHaveBeenCalledWith(
      'vault.env',
      { KEY1: 'foo_prod', KEY2: 'bar' },
      'secret'
    );
  });

  it('prints error if vault open fails', async () => {
    vi.mocked(vault.openVault).mockRejectedValue(new Error('bad password'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'suffix', 'vault.env', '_prod', '--password', 'wrong']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('bad password'));
  });
});
