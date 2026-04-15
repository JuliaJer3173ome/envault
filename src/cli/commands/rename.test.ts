import { Command } from 'commander';
import { registerRenameCommand } from './rename';
import * as vault from '../../crypto/vault';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRenameCommand(program);
  return program;
}

const mockEncryptedVault = { iv: 'iv', salt: 'salt', data: 'data' };
const mockVault = {
  secrets: { OLD_KEY: 'some_value', ANOTHER_KEY: 'another_value' },
  version: 1,
};

jest.mock('../../crypto/vault');

const mockedReadVault = vault.readVault as jest.MockedFunction<typeof vault.readVault>;
const mockedOpenVault = vault.openVault as jest.MockedFunction<typeof vault.openVault>;
const mockedUpdateVault = vault.updateVault as jest.MockedFunction<typeof vault.updateVault>;
const mockedWriteVault = vault.writeVault as jest.MockedFunction<typeof vault.writeVault>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedReadVault.mockReturnValue(mockEncryptedVault as any);
  mockedOpenVault.mockResolvedValue(JSON.parse(JSON.stringify(mockVault)) as any);
  mockedUpdateVault.mockResolvedValue(mockEncryptedVault as any);
  mockedWriteVault.mockImplementation(() => {});
});

describe('rename command', () => {
  it('renames an existing key successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();

    await program.parseAsync(['node', 'test', 'rename', 'OLD_KEY', 'NEW_KEY', '-p', 'password']);

    expect(mockedUpdateVault).toHaveBeenCalledWith(
      mockEncryptedVault,
      expect.objectContaining({
        secrets: expect.not.objectContaining({ OLD_KEY: expect.anything() }),
      }),
      'password'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Successfully renamed "OLD_KEY" to "NEW_KEY".');
    consoleSpy.mockRestore();
  });

  it('exits with error if old key does not exist', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();

    await expect(
      program.parseAsync(['node', 'test', 'rename', 'MISSING_KEY', 'NEW_KEY', '-p', 'password'])
    ).rejects.toThrow('exit');

    expect(consoleSpy).toHaveBeenCalledWith('Error: Key "MISSING_KEY" does not exist in the vault.');
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits with error if new key already exists', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();

    await expect(
      program.parseAsync(['node', 'test', 'rename', 'OLD_KEY', 'ANOTHER_KEY', '-p', 'password'])
    ).rejects.toThrow('exit');

    expect(consoleSpy).toHaveBeenCalledWith('Error: Key "ANOTHER_KEY" already exists in the vault.');
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
