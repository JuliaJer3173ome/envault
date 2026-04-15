import { Command } from 'commander';
import { registerSetCommand } from './set';
import * as vaultModule from '../../crypto/vault';
import * as initModule from './init';
import * as setModule from './set';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSetCommand(program);
  return program;
}

describe('set command', () => {
  const mockEntries = { EXISTING_KEY: 'existing_value' };
  const mockVaultData = { salt: 'abc', iv: 'def', ciphertext: 'ghi' };

  beforeEach(() => {
    jest.spyOn(vaultModule, 'readVault').mockResolvedValue(mockVaultData as any);
    jest.spyOn(initModule, 'promptPassword').mockResolvedValue('secret');
    jest.spyOn(vaultModule, 'openVault').mockResolvedValue(mockEntries);
    jest.spyOn(vaultModule, 'updateVault').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets a key with an inline value', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'set', 'NEW_KEY', 'new_value']);

    expect(vaultModule.updateVault).toHaveBeenCalledWith(
      '.envault',
      mockVaultData,
      'secret',
      { EXISTING_KEY: 'existing_value', NEW_KEY: 'new_value' }
    );
  });

  it('prompts for value when not provided inline', async () => {
    jest.spyOn(setModule, 'promptValue').mockResolvedValue('prompted_value');
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'set', 'PROMPTED_KEY']);

    expect(setModule.promptValue).toHaveBeenCalledWith('PROMPTED_KEY');
    expect(vaultModule.updateVault).toHaveBeenCalledWith(
      '.envault',
      mockVaultData,
      'secret',
      { EXISTING_KEY: 'existing_value', PROMPTED_KEY: 'prompted_value' }
    );
  });

  it('exits with code 1 when vault cannot be read', async () => {
    jest.spyOn(vaultModule, 'readVault').mockRejectedValue(new Error('File not found'));
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    const program = buildProgram();

    await expect(
      program.parseAsync(['node', 'envault', 'set', 'KEY', 'value'])
    ).rejects.toThrow('process.exit');

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
