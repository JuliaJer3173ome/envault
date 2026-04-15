import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { registerInfoCommand, getVaultInfo } from './info';
import { readVault } from '../../crypto/vault';

jest.mock('../../crypto/vault');
jest.mock('fs');

const mockedReadVault = readVault as jest.MockedFunction<typeof readVault>;
const mockedFs = fs as jest.Mocked<typeof fs>;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerInfoCommand(program);
  return program;
}

describe('getVaultInfo', () => {
  const vaultPath = '/fake/.envault';

  beforeEach(() => {
    jest.clearAllMocks();
    (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
    (mockedFs.statSync as jest.Mock).mockReturnValue({
      size: 512,
      birthtime: new Date('2024-01-01T00:00:00Z'),
      mtime: new Date('2024-06-01T00:00:00Z'),
    });
    mockedReadVault.mockReturnValue({
      keyCount: 5,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-06-01T00:00:00.000Z',
      data: 'encryptedblob',
      iv: 'someiv',
      salt: 'somesalt',
    } as any);
  });

  it('returns vault info with key count and timestamps', () => {
    const info = getVaultInfo(vaultPath);
    expect(info.keyCount).toBe(5);
    expect(info.sizeBytes).toBe(512);
    expect(info.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(info.updatedAt).toBe('2024-06-01T00:00:00.000Z');
  });

  it('throws if vault file does not exist', () => {
    (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
    expect(() => getVaultInfo(vaultPath)).toThrow('Vault not found');
  });
});

describe('info command', () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
    (mockedFs.statSync as jest.Mock).mockReturnValue({
      size: 256,
      birthtime: new Date('2024-03-01T00:00:00Z'),
      mtime: new Date('2024-03-15T00:00:00Z'),
    });
    mockedReadVault.mockReturnValue({
      keyCount: 3,
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2024-03-15T00:00:00.000Z',
      data: 'blob',
      iv: 'iv',
      salt: 'salt',
    } as any);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('prints vault info to console', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'info', '--vault', '/fake/.envault']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Keys:'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('3'));
  });
});
