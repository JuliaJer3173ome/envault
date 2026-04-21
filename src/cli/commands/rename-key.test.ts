import { Command } from 'commander';
import { renameKey, registerRenameKeyCommand } from './rename-key';
import * as vault from '../../crypto/vault';

jest.mock('../../crypto/vault');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerRenameKeyCommand(program);
  return program;
}

describe('renameKey', () => {
  it('renames an existing key', () => {
    const entries = { FOO: 'bar', BAZ: 'qux' };
    const result = renameKey(entries, 'FOO', 'FOO_NEW');
    expect(result).toEqual({ FOO_NEW: 'bar', BAZ: 'qux' });
  });

  it('preserves value after rename', () => {
    const entries = { SECRET: 'abc123' };
    const result = renameKey(entries, 'SECRET', 'API_SECRET');
    expect(result['API_SECRET']).toBe('abc123');
    expect(result['SECRET']).toBeUndefined();
  });

  it('throws if old key does not exist', () => {
    const entries = { FOO: 'bar' };
    expect(() => renameKey(entries, 'MISSING', 'NEW')).toThrow('Key "MISSING" not found in vault');
  });

  it('throws if new key already exists', () => {
    const entries = { FOO: 'bar', BAZ: 'qux' };
    expect(() => renameKey(entries, 'FOO', 'BAZ')).toThrow('Key "BAZ" already exists in vault');
  });

  it('preserves order of other keys', () => {
    const entries = { A: '1', B: '2', C: '3' };
    const result = renameKey(entries, 'B', 'B_NEW');
    expect(Object.keys(result)).toEqual(['A', 'B_NEW', 'C']);
  });
});

describe('rename-key command', () => {
  const mockOpenVault = vault.openVault as jest.Mock;
  const mockWriteVault = vault.writeVault as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenVault.mockResolvedValue({ entries: { OLD_KEY: 'value123' } });
    mockWriteVault.mockResolvedValue(undefined);
  });

  it('renames a key in the vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'rename-key', 'vault.enc', 'OLD_KEY', 'NEW_KEY', '--password', 'secret']);
    expect(mockWriteVault).toHaveBeenCalledWith(
      'vault.enc',
      expect.objectContaining({ entries: { NEW_KEY: 'value123' } }),
      'secret'
    );
  });

  it('exits with error if key not found', async () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'rename-key', 'vault.enc', 'MISSING', 'NEW_KEY', '--password', 'secret'])
    ).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
