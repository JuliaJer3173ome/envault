import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerSliceCommand, sliceEntries } from './slice';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSliceCommand(program);
  return program;
}

describe('sliceEntries', () => {
  it('slices from start to end', () => {
    const entries = { A: '1', B: '2', C: '3', D: '4' };
    expect(sliceEntries(entries, 1, 3)).toEqual({ B: '2', C: '3' });
  });

  it('slices from start to end of entries when end is omitted', () => {
    const entries = { A: '1', B: '2', C: '3' };
    expect(sliceEntries(entries, 1)).toEqual({ B: '2', C: '3' });
  });

  it('returns empty object for out-of-range start', () => {
    const entries = { A: '1' };
    expect(sliceEntries(entries, 5)).toEqual({});
  });
});

describe('slice command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prints sliced entries to stdout', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({
      entries: { FOO: 'bar', BAZ: 'qux', ZAP: 'zip' },
      version: 1,
    } as any);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'slice', 'vault.env', '0', '2', '-p', 'secret']);
    expect(log).toHaveBeenCalledWith('FOO=bar');
    expect(log).toHaveBeenCalledWith('BAZ=qux');
    expect(log).not.toHaveBeenCalledWith('ZAP=zip');
  });

  it('writes in-place when flag is set', async () => {
    const fakeVault = { entries: { A: '1', B: '2', C: '3' }, version: 1 } as any;
    vi.spyOn(vault, 'openVault').mockResolvedValue(fakeVault);
    const write = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined as any);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'slice', 'vault.env', '1', '3', '-p', 'secret', '--in-place']);
    expect(write).toHaveBeenCalled();
    expect(fakeVault.entries).toEqual({ B: '2', C: '3' });
  });
});
