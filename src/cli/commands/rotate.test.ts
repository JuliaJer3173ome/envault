import { Command } from 'commander';
import { registerRotateCommand } from './rotate';
import * as vaultModule from '../../crypto/vault';
import * as readline from 'readline';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRotateCommand(program);
  return program;
}

const mockVault = {
  salt: 'abc123',
  iv: 'iv123',
  data: 'encrypteddata',
};

const mockEntries = { API_KEY: 'secret', DB_URL: 'postgres://localhost' };

jest.mock('readline', () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((_, cb) => cb('password123')),
    close: jest.fn(),
  }),
}));

jest.mock('../../crypto/vault', () => ({
  readVault: jest.fn(),
  writeVault: jest.fn(),
  openVault: jest.fn(),
  updateVault: jest.fn(),
}));

describe('rotate command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vaultModule.readVault as jest.Mock).mockResolvedValue(mockVault);
    (vaultModule.openVault as jest.Mock).mockResolvedValue(mockEntries);
    (vaultModule.updateVault as jest.Mock).mockResolvedValue(mockVault);
    (vaultModule.writeVault as jest.Mock).mockResolvedValue(undefined);
  });

  it('should rotate vault password successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'rotate', '-f', '.envault']);
    expect(vaultModule.readVault).toHaveBeenCalledWith('.envault');
    expect(vaultModule.openVault).toHaveBeenCalled();
    expect(vaultModule.writeVault).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Vault password rotated successfully.');
    consoleSpy.mockRestore();
  });

  it('should error when vault file cannot be read', async () => {
    (vaultModule.readVault as jest.Mock).mockRejectedValue(new Error('File not found'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'rotate'])).rejects.toThrow('exit');
    expect(consoleSpy).toHaveBeenCalledWith('Error: File not found');
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
