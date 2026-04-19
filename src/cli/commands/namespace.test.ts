import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { namespaceEntries, stripNamespace, registerNamespaceCommand } from './namespace';
import * as vault from '../../crypto/vault';

vi.mock('../../crypto/vault');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerNamespaceCommand(program);
  return program;
}

describe('namespaceEntries', () => {
  it('prefixes all keys with namespace', () => {
    const result = namespaceEntries({ FOO: '1', BAR: '2' }, 'APP');
    expect(result).toEqual({ APP_FOO: '1', APP_BAR: '2' });
  });

  it('handles empty entries', () => {
    expect(namespaceEntries({}, 'NS')).toEqual({});
  });
});

describe('stripNamespace', () => {
  it('removes matching prefix from keys', () => {
    const result = stripNamespace({ APP_FOO: '1', APP_BAR: '2' }, 'APP');
    expect(result).toEqual({ FOO: '1', BAR: '2' });
  });

  it('leaves non-matching keys unchanged', () => {
    const result = stripNamespace({ APP_FOO: '1', OTHER: '2' }, 'APP');
    expect(result).toEqual({ FOO: '1', OTHER: '2' });
  });
});

describe('namespace add command', () => {
  beforeEach(() => vi.clearAllMocks());

  it('applies namespace and writes vault', async () => {
    const mockVault = { entries: { KEY: 'val' } };
    vi.mocked(vault.openVault).mockResolvedValue(mockVault as any);
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['namespace', 'add', 'vault.env', 'PROD', '-p', 'secret'], { from: 'user' });

    expect(vault.writeVault).toHaveBeenCalledWith('vault.env', expect.objectContaining({
      entries: { PROD_KEY: 'val' }
    }));
  });
});

describe('namespace strip command', () => {
  beforeEach(() => vi.clearAllMocks());

  it('strips namespace and writes vault', async () => {
    const mockVault = { entries: { PROD_KEY: 'val', OTHER: 'x' } };
    vi.mocked(vault.openVault).mockResolvedValue(mockVault as any);
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['namespace', 'strip', 'vault.env', 'PROD', '-p', 'secret'], { from: 'user' });

    expect(vault.writeVault).toHaveBeenCalledWith('vault.env', expect.objectContaining({
      entries: { KEY: 'val', OTHER: 'x' }
    }));
  });
});
