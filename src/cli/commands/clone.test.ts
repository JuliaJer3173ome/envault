import { Command } from 'commander';
import { registerCloneCommand, cloneVault } from './clone';
import * as vaultModule from '../../crypto/vault';
import * as fs from 'fs';

jest.mock('../../crypto/vault');
jest.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCloneCommand(program);
  return program;
}

describe('cloneVault', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads source, opens, creates and writes destination vault', async () => {
    const fakeVault = { salt: 'abc', iv: 'def', data: 'ghi' };
    const fakeEntries = { KEY: 'value' };
    const fakeNewVault = { salt: 'x', iv: 'y', data: 'z' };
    const fakeUpdated = { salt: 'a', iv: 'b', data: 'c' };

    (vaultModule.readVault as jest.Mock).mockReturnValue(fakeVault);
    (vaultModule.openVault as jest.Mock).mockResolvedValue(fakeEntries);
    (vaultModule.createVault as jest.Mock).mockResolvedValue(fakeNewVault);
    (vaultModule.updateVault as jest.Mock).mockResolvedValue(fakeUpdated);
    (vaultModule.writeVault as jest.Mock).mockReturnValue(undefined);

    await cloneVault('/src.vault', '/dst.vault', 'pass');

    expect(vaultModule.readVault).toHaveBeenCalledWith('/src.vault');
    expect(vaultModule.openVault).toHaveBeenCalledWith(fakeVault, 'pass');
    expect(vaultModule.createVault).toHaveBeenCalledWith('pass');
    expect(vaultModule.updateVault).toHaveBeenCalledWith(fakeNewVault, 'pass', fakeEntries);
    expect(vaultModule.writeVault).toHaveBeenCalledWith('/dst.vault', fakeUpdated);
  });

  it('uses new password when provided', async () => {
    (vaultModule.readVault as jest.Mock).mockReturnValue({});
    (vaultModule.openVault as jest.Mock).mockResolvedValue({});
    (vaultModule.createVault as jest.Mock).mockResolvedValue({});
    (vaultModule.updateVault as jest.Mock).mockResolvedValue({});
    (vaultModule.writeVault as jest.Mock).mockReturnValue(undefined);

    await cloneVault('/src.vault', '/dst.vault', 'oldpass', 'newpass');

    expect(vaultModule.createVault).toHaveBeenCalledWith('newpass');
    expect(vaultModule.updateVault).toHaveBeenCalledWith({}, 'newpass', {});
  });
});

describe('clone command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exits with error if source does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'test', 'clone', 'missing.vault', 'dest.vault', '-p', 'pass'])).rejects.toThrow();
    exitSpy.mockRestore();
  });
});
