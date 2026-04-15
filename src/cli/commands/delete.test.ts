import { Command } from 'commander';
import { registerDeleteCommand } from './delete';
import * as vault from '../../crypto/vault';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerDeleteCommand(program);
  return program;
}

jest.mock('../../crypto/vault');

const mockedOpenVault = vault.openVault as jest.MockedFunction<typeof vault.openVault>;
const mockedUpdateVault = vault.updateVault as jest.MockedFunction<typeof vault.updateVault>;

describe('delete command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('deletes an existing key from the vault', async () => {
    mockedOpenVault.mockResolvedValue({ API_KEY: 'secret', DB_URL: 'postgres://localhost' });
    mockedUpdateVault.mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'delete', 'API_KEY', '-p', 'password123', '-f', '.envault']);

    expect(mockedOpenVault).toHaveBeenCalledWith('.envault', 'password123');
    expect(mockedUpdateVault).toHaveBeenCalledWith('.envault', 'password123', { DB_URL: 'postgres://localhost' });
    expect(consoleLogSpy).toHaveBeenCalledWith('Deleted "API_KEY" from vault.');
  });

  it('exits with error when key does not exist', async () => {
    mockedOpenVault.mockResolvedValue({ DB_URL: 'postgres://localhost' });

    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'delete', 'MISSING_KEY', '-p', 'password123', '-f', '.envault']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Key "MISSING_KEY" not found in vault.');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when vault cannot be opened', async () => {
    mockedOpenVault.mockRejectedValue(new Error('Invalid password'));

    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'delete', 'API_KEY', '-p', 'wrongpass', '-f', '.envault']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid password');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
