import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerExtractCommand, extractEntries } from './extract';
import * as vault from '../../crypto/vault';
import * as fs from 'fs';

vi.mock('../../crypto/vault');
vi.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerExtractCommand(program);
  return program;
}

describe('extractEntries', () => {
  it('extracts only specified keys', () => {
    const entries = { A: '1', B: '2', C: '3' };
    expect(extractEntries(entries, ['A', 'C'])).toEqual({ A: '1', C: '3' });
  });

  it('ignores missing keys', () => {
    const entries = { A: '1' };
    expect(extractEntries(entries, ['A', 'Z'])).toEqual({ A: '1' });
  });

  it('returns empty object when no keys match', () => {
    expect(extractEntries({ A: '1' }, ['X'])).toEqual({});
  });
});

describe('extract command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts keys and writes vault', async () => {
    vi.mocked(vault.openVault).mockResolvedValue({ KEY1: 'val1', KEY2: 'val2', KEY3: 'val3' });
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'extract', 'test.vault', 'KEY1', 'KEY2', '-p', 'secret']);

    expect(vault.openVault).toHaveBeenCalledWith('test.vault', 'secret');
    expect(vault.writeVault).toHaveBeenCalledWith(
      expect.stringContaining('extracted'),
      { KEY1: 'val1', KEY2: 'val2' },
      'secret'
    );
  });

  it('outputs .env format to stdout when --env flag used', async () => {
    vi.mocked(vault.openVault).mockResolvedValue({ FOO: 'bar', BAZ: 'qux' });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'extract', 'test.vault', 'FOO', '--env', '-p', 'pass']);

    expect(consoleSpy).toHaveBeenCalledWith('FOO=bar');
  });

  it('writes .env to file when --env and --output provided', async () => {
    vi.mocked(vault.openVault).mockResolvedValue({ FOO: 'bar' });
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'extract', 'test.vault', 'FOO', '--env', '-o', 'out.env', '-p', 'pass']);

    expect(fs.writeFileSync).toHaveBeenCalledWith('out.env', 'FOO=bar\n');
  });
});
