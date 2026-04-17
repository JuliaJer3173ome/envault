import { Command } from 'commander';
import { registerFmtCommand, formatEntries } from './fmt';
import * as vault from '../../crypto/vault';
import * as fs from 'fs';

jest.mock('../../crypto/vault');
jest.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerFmtCommand(program);
  return program;
}

describe('formatEntries', () => {
  it('sorts keys alphabetically', () => {
    const result = formatEntries({ ZEBRA: 'z', APPLE: 'a', MANGO: 'm' });
    expect(Object.keys(result)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('trims values', () => {
    const result = formatEntries({ KEY: '  value  ' });
    expect(result['KEY']).toBe('value');
  });
});

describe('fmt command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exits if vault not found', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'fmt', 'missing.vault', '-p', 'pass']))
      .rejects.toThrow();
  });

  it('formats and writes vault', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (vault.openVault as jest.Mock).mockResolvedValue({
      entries: { ZEBRA: 'z', APPLE: 'a' },
    });
    (vault.writeVault as jest.Mock).mockResolvedValue(undefined);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'fmt', 'test.vault', '-p', 'pass']);
    expect(vault.writeVault).toHaveBeenCalledWith('test.vault', {
      entries: { APPLE: 'a', ZEBRA: 'z' },
    });
  });

  it('dry-run does not write', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (vault.openVault as jest.Mock).mockResolvedValue({
      entries: { ZEBRA: 'z', APPLE: 'a' },
    });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'fmt', 'test.vault', '-p', 'pass', '--dry-run']);
    expect(vault.writeVault).not.toHaveBeenCalled();
  });
});
