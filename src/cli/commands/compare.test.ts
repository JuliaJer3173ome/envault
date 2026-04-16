import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerCompareCommand, compareVaults } from './compare';
import * as crypto from '../../crypto';
import * as fs from 'fs';

vi.mock('fs');
vi.mock('../../crypto');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCompareCommand(program);
  return program;
}

describe('compareVaults', () => {
  it('detects keys only in A', () => {
    const r = compareVaults({ FOO: '1' }, {});
    expect(r.onlyInA).toContain('FOO');
  });

  it('detects keys only in B', () => {
    const r = compareVaults({}, { BAR: '2' });
    expect(r.onlyInB).toContain('BAR');
  });

  it('detects differing values', () => {
    const r = compareVaults({ KEY: 'a' }, { KEY: 'b' });
    expect(r.diffValues).toContain('KEY');
  });

  it('detects common identical keys', () => {
    const r = compareVaults({ KEY: 'a' }, { KEY: 'a' });
    expect(r.common).toContain('KEY');
  });
});

describe('compare command', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(crypto.openVault).mockResolvedValueOnce({ entries: { A: '1' } } as any);
    vi.mocked(crypto.openVault).mockResolvedValueOnce({ entries: { B: '2' } } as any);
  });

  it('runs compare and logs differences', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'compare', 'a.vault', 'b.vault', '-p', 'secret']);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('exits if vaultA not found', async () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'compare', 'missing.vault', 'b.vault', '-p', 'secret'])
    ).rejects.toThrow();
  });
});
