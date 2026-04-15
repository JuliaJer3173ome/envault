import { Command } from 'commander';
import { registerExportCommand } from './export';
import * as fs from 'fs';
import * as crypto from '../../crypto';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerExportCommand(program);
  return program;
}

const mockVault = JSON.stringify({ iv: 'abc', salt: 'def', data: 'encrypted' });
const mockSecrets = { API_KEY: 'secret123', DB_URL: 'postgres://localhost/db' };

describe('export command', () => {
  let readFileSyncSpy: jest.SpyInstance;
  let writeFileSyncSpy: jest.SpyInstance;
  let openVaultSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(mockVault);
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    openVaultSpy = jest.spyOn(crypto, 'openVault').mockResolvedValue(mockSecrets);
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports secrets to a .env file with correct content', async () => {
    const program = buildProgram();
    await program.parseAsync(['export', '--password', 'mypassword'], { from: 'user' });

    expect(readFileSyncSpy).toHaveBeenCalledWith('.envault', 'utf-8');
    expect(openVaultSpy).toHaveBeenCalledWith(JSON.parse(mockVault), 'mypassword');
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      '.env',
      'API_KEY=secret123\nDB_URL=postgres://localhost/db\n',
      'utf-8'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Exported 2 secret(s)'));
  });

  it('uses custom vault and output paths', async () => {
    const program = buildProgram();
    await program.parseAsync(
      ['export', '--vault', 'custom.vault', '--output', 'custom.env', '--password', 'pass'],
      { from: 'user' }
    );

    expect(readFileSyncSpy).toHaveBeenCalledWith('custom.vault', 'utf-8');
    expect(writeFileSyncSpy).toHaveBeenCalledWith('custom.env', expect.any(String), 'utf-8');
  });

  it('exits with error when vault file is not found', async () => {
    readFileSyncSpy.mockImplementation(() => { const err: any = new Error('not found'); err.code = 'ENOENT'; throw err; });
    const program = buildProgram();

    await expect(
      program.parseAsync(['export', '--password', 'pass'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Vault file not found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error on invalid password', async () => {
    openVaultSpy.mockRejectedValue(new Error('bad decrypt'));
    const program = buildProgram();

    await expect(
      program.parseAsync(['export', '--password', 'wrongpass'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid password'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
