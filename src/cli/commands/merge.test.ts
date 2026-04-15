import { Command } from 'commander';
import { registerMergeCommand, mergeVaults } from './merge';
import * as vault from '../../crypto/vault';
import * as fs from 'fs';

jest.mock('../../crypto/vault');
jest.mock('fs');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerMergeCommand(program);
  return program;
}

describe('mergeVaults', () => {
  it('adds new keys from source', () => {
    const target = { A: '1' };
    const source = { B: '2' };
    const { merged, added, skipped } = mergeVaults(target, source, false);
    expect(merged).toEqual({ A: '1', B: '2' });
    expect(added).toEqual(['B']);
    expect(skipped).toEqual([]);
  });

  it('skips existing keys when overwrite is false', () => {
    const target = { A: '1' };
    const source = { A: 'new', B: '2' };
    const { merged, added, skipped } = mergeVaults(target, source, false);
    expect(merged.A).toBe('1');
    expect(added).toEqual(['B']);
    expect(skipped).toEqual(['A']);
  });

  it('overwrites existing keys when overwrite is true', () => {
    const target = { A: '1' };
    const source = { A: 'new' };
    const { merged, added, skipped } = mergeVaults(target, source, true);
    expect(merged.A).toBe('new');
    expect(skipped).toEqual([]);
  });
});

describe('merge command', () => {
  const mockedOpenVault = vault.openVault as jest.MockedFunction<typeof vault.openVault>;
  const mockedWriteVault = vault.writeVault as jest.MockedFunction<typeof vault.writeVault>;
  const mockedExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedExistsSync.mockReturnValue(true);
    mockedOpenVault
      .mockResolvedValueOnce({ EXISTING: 'value' })
      .mockResolvedValueOnce({ NEW_KEY: 'new_value' });
    mockedWriteVault.mockResolvedValue(undefined);
  });

  it('merges source vault into target vault', async () => {
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(
      ['merge', 'source.envault', '--password', 'pass', '--source-password', 'srcpass'],
      { from: 'user' }
    );

    expect(mockedOpenVault).toHaveBeenCalledTimes(2);
    expect(mockedWriteVault).toHaveBeenCalledWith('.envault', 'pass', { EXISTING: 'value', NEW_KEY: 'new_value' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('1 new key(s)'));
    consoleSpy.mockRestore();
  });

  it('exits if target vault not found', async () => {
    mockedExistsSync.mockReturnValueOnce(false);
    const program = buildProgram();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['merge', 'source.envault', '--password', 'pass', '--source-password', 'src'], { from: 'user' })
    ).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('vault file not found'));
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
