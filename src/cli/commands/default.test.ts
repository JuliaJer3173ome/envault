import { Command } from 'commander';
import { getDefaultKey, registerDefaultCommand } from './default';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerDefaultCommand(program);
  return program;
}

describe('getDefaultKey', () => {
  it('returns NODE_ENV if present', () => {
    expect(getDefaultKey({ NODE_ENV: 'production', FOO: 'bar' })).toBe('NODE_ENV');
  });

  it('returns first key when no common key found', () => {
    expect(getDefaultKey({ MY_KEY: 'val' })).toBe('MY_KEY');
  });

  it('returns undefined for empty entries', () => {
    expect(getDefaultKey({})).toBeUndefined();
  });

  it('prefers DEFAULT over NODE_ENV', () => {
    expect(getDefaultKey({ NODE_ENV: 'dev', DEFAULT: 'x' })).toBe('DEFAULT');
  });
});

describe('default command', () => {
  let openMock: jest.SpyInstance;
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const errorSpy = jest.spyOnImplementation(() => {});

  beforeEach(() => {
    openVaultMock = jest.spyOn(vault, 'openVault').mockResolvedValue({ NODE_ENV: 'production', API_KEY: 'abc' });
    jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
  });

  afterEach(() => jest.clear  it('shows default key', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'default', 'test.vault', '--password', 'pass']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('NODE_ENV'));
  });

  it('shows specified key with --set', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'default', 'test.vault', '--password', 'pass', '--set', 'API_KEY']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('abc'));
  });

  it('errors on missing key with --set', async () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'test', 'default', 'test.vault', '--password', 'pass', '--set', 'MISSING']))
      .rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Key not found'));
    exitSpy.mockRestore();
  });
});
