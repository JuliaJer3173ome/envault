import { Command } from 'commander';
import { registerGetCommand } from './get';
import * as crypto from '../../crypto';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerGetCommand(program);
  return program;
}

jest.mock('../../crypto');
jest.mock('./init', () => ({
  promptPassword: jest.fn().mockResolvedValue('test-password'),
}));

const mockOpenVault = crypto.openVault as jest.MockedFunction<typeof crypto.openVault>;

describe('get command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('prints a specific key=value when key is provided', async () => {
    mockOpenVault.mockResolvedValue({ API_KEY: 'abc123', DB_HOST: 'localhost' });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'get', 'API_KEY', '-f', '.envault']);
    expect(consoleLogSpy).toHaveBeenCalledWith('API_KEY=abc123');
  });

  it('prints all key=value pairs when no key is provided', async () => {
    mockOpenVault.mockResolvedValue({ API_KEY: 'abc123', DB_HOST: 'localhost' });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'get', '-f', '.envault']);
    expect(consoleLogSpy).toHaveBeenCalledWith('API_KEY=abc123');
    expect(consoleLogSpy).toHaveBeenCalledWith('DB_HOST=localhost');
  });

  it('outputs JSON when --json flag is passed', async () => {
    mockOpenVault.mockResolvedValue({ API_KEY: 'abc123' });
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'get', 'API_KEY', '--json', '-f', '.envault']);
    expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify({ API_KEY: 'abc123' }, null, 2));
  });

  it('exits with error when key is not found', async () => {
    mockOpenVault.mockResolvedValue({ DB_HOST: 'localhost' });
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'get', 'MISSING_KEY', '-f', '.envault'])
    ).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Key "MISSING_KEY" not found in vault.');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when vault cannot be opened', async () => {
    mockOpenVault.mockRejectedValue(new Error('wrong password'));
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'get', '-f', '.envault'])
    ).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to open vault: wrong password');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
