import { Command } from 'commander';
import { registerPruneCommand, pruneExpiredKeys } from './prune';
import * as vaultModule from '../../crypto/vault';
import * as ttlModule from './ttl';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerPruneCommand(program);
  return program;
}

describe('pruneExpiredKeys', () => {
  it('removes expired keys and returns their names', async () => {
    const mockVault = { entries: { EXPIRED_KEY: 'val', VALID_KEY: 'val2' } };
    jest.spyOn(vaultModule, 'openVault').mockResolvedValue(mockVault as any);
    jest.spyOn(vaultModule, 'writeVault').mockResolvedValue(undefined);
    jest.spyOn(ttlModule, 'readTtls').mockReturnValue({ EXPIRED_KEY: 1000 });
    jest.spyOn(ttlModule, 'getExpiredKeys').mockReturnValue(['EXPIRED_KEY']);
    jest.spyOn(ttlModule, 'writeTtls').mockReturnValue(undefined);

    const removed = await pruneExpiredKeys('vault.env', 'pass');
    expect(removed).toEqual(['EXPIRED_KEY']);
    expect(mockVault.entries).not.toHaveProperty('EXPIRED_KEY');
    expect(mockVault.entries).toHaveProperty('VALID_KEY');
  });

  it('returns empty array when no keys are expired', async () => {
    const mockVault = { entries: { VALID_KEY: 'val' } };
    jest.spyOn(vaultModule, 'openVault').mockResolvedValue(mockVault as any);
    jest.spyOn(vaultModule, 'writeVault').mockResolvedValue(undefined);
    jest.spyOn(ttlModule, 'readTtls').mockReturnValue({});
    jest.spyOn(ttlModule, 'getExpiredKeys').mockReturnValue([]);

    const removed = await pruneExpiredKeys('vault.env', 'pass');
    expect(removed).toEqual([]);
  });
});

describe('prune command', () => {
  it('reports no expired keys', async () => {
    const program = buildProgram();
    jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
    jest.spyOn(ttlModule, 'readTtls').mockReturnValue({});
    jest.spyOn(ttlModule, 'getExpiredKeys').mockReturnValue([]);
    const log = jest.spyOn(console, 'log').mockImplementation();

    await program.parseAsync(['node', 'test', 'prune', 'vault.env', '-p', 'pass']);
    expect(log).toHaveBeenCalledWith('No expired keys found.');
    log.mockRestore();
  });

  it('lists expired keys in dry-run mode', async () => {
    const program = buildProgram();
    jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
    jest.spyOn(ttlModule, 'readTtls').mockReturnValue({ OLD: 1000 });
    jest.spyOn(ttlModule, 'getExpiredKeys').mockReturnValue(['OLD']);
    const log = jest.spyOn(console, 'log').mockImplementation();

    await program.parseAsync(['node', 'test', 'prune', 'vault.env', '-p', 'pass', '--dry-run']);
    expect(log).toHaveBeenCalledWith('Expired keys (dry run):');
    log.mockRestore();
  });
});
