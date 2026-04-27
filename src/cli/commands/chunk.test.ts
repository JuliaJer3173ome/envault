import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { chunkEntries, registerChunkCommand } from './chunk';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerChunkCommand(program);
  return program;
}

describe('chunkEntries', () => {
  it('splits entries into chunks of given size', () => {
    const entries = { A: '1', B: '2', C: '3', D: '4', E: '5' };
    const chunks = chunkEntries(entries, 2);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toEqual({ A: '1', B: '2' });
    expect(chunks[1]).toEqual({ C: '3', D: '4' });
    expect(chunks[2]).toEqual({ E: '5' });
  });

  it('returns single chunk when size >= entry count', () => {
    const entries = { X: 'a', Y: 'b' };
    const chunks = chunkEntries(entries, 10);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({ X: 'a', Y: 'b' });
  });

  it('returns empty array for empty entries', () => {
    expect(chunkEntries({}, 3)).toEqual([]);
  });
});

describe('chunk command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prints chunks to stdout', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({
      entries: { FOO: 'bar', BAZ: 'qux', KEY: 'val' },
    } as any);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'chunk', 'my.vault', '2', '-p', 'secret']);
    expect(consoleSpy).toHaveBeenCalledWith('--- Chunk 1 ---');
    expect(consoleSpy).toHaveBeenCalledWith('FOO=bar');
    expect(consoleSpy).toHaveBeenCalledWith('BAZ=qux');
    expect(consoleSpy).toHaveBeenCalledWith('--- Chunk 2 ---');
    expect(consoleSpy).toHaveBeenCalledWith('KEY=val');
  });

  it('exits with error for invalid size', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'chunk', 'my.vault', 'abc', '-p', 'secret']);
    expect(errorSpy).toHaveBeenCalledWith('Error: size must be a positive integer');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when vault open fails', async () => {
    vi.spyOn(vault, 'openVault').mockRejectedValue(new Error('bad password'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'chunk', 'my.vault', '2', '-p', 'wrong']);
    expect(errorSpy).toHaveBeenCalledWith('Error: bad password');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
