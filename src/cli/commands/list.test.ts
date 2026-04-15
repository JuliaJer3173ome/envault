import { Command } from 'commander';
import { registerListCommand } from './list';
import * as vaultModule from '../../crypto';
import * as readline from 'readline';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerListCommand(program);
  return program;
}

jest.mock('../../crypto');
jest.mock('readline');

const mockReadVault = vaultModule.readVault as jest.MockedFunction<typeof vaultModule.readVault>;
const mockOpenVault = vaultModule.openVault as jest.MockedFunction<typeof vaultModule.openVault>;

describe('list command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockRl: any;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockRl = { question: jest.fn(), close: jest.fn() };
    (readline.createInterface as jest.Mock).mockReturnValue(mockRl);
    mockRl.question.mockImplementation((_: string, cb: (a: string) => void) => cb('secret'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists keys in the vault', async () => {
    mockReadVault.mockReturnValue({ iv: 'iv', salt: 'salt', data: 'data' } as any);
    mockOpenVault.mockReturnValue({ entries: { API_KEY: 'abc123', DB_URL: 'postgres://localhost' } } as any);

    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'list']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 key(s)'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DB_URL'));
  });

  it('shows values when --show-values flag is set', async () => {
    mockReadVault.mockReturnValue({ iv: 'iv', salt: 'salt', data: 'data' } as any);
    mockOpenVault.mockReturnValue({ entries: { API_KEY: 'abc123' } } as any);

    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'list', '--show-values']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API_KEY=abc123'));
  });

  it('prints message when vault is empty', async () => {
    mockReadVault.mockReturnValue({ iv: 'iv', salt: 'salt', data: 'data' } as any);
    mockOpenVault.mockReturnValue({ entries: {} } as any);

    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'list']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Vault is empty'));
  });

  it('handles missing vault file', async () => {
    const error: any = new Error('File not found');
    error.code = 'ENOENT';
    mockReadVault.mockImplementation(() => { throw error; });

    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(program.parseAsync(['node', 'envault', 'list'])).rejects.toThrow('exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Vault file not found'));
    exitSpy.mockRestore();
  });
});
