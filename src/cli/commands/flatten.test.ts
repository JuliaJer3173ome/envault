import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerFlattenCommand, flattenEntries } from './flatten';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerFlattenCommand(program);
  return program;
}

describe('flattenEntries', () => {
  it('uppercases keys', () => {
    const result = flattenEntries({ myKey: 'val' }, '');
    expect(result).toHaveProperty('MYKEY', 'val');
  });

  it('applies prefix', () => {
    const result = flattenEntries({ key: 'val' }, 'APP');
    expect(result).toHaveProperty('APP_KEY', 'val');
  });

  it('handles empty entries', () => {
    const result = flattenEntries({}, 'PREFIX');
    expect(result).toEqual({});
  });
});

describe('flatten command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('writes flattened vault', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { db_host: 'localhost', db_port: '5432' } } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'flatten', 'vault.env', '--password', 'secret']);

    expect(writeSpy).toHaveBeenCalled();
    const written = writeSpy.mock.calls[0][1] as any;
    expect(written.entries).toHaveProperty('DB_HOST', 'localhost');
    expect(written.entries).toHaveProperty('DB_PORT', '5432');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Flattened 2 keys'));
  });

  it('dry run does not write', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { key: 'value' } } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'flatten', 'vault.env', '--password', 'secret', '--dry-run']);

    expect(writeSpy).not.toHaveBeenCalled();
  });
});
