import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerPasswdCommand, changePassword } from './passwd';

vi.mock('../../crypto/vault', () => ({
  readVault: vi.fn(),
  writeVault: vi.fn(),
  openVault: vi.fn(),
  createVault: vi.fn(),
}));

import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerPasswdCommand(program);
  return program;
}

describe('changePassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads vault, opens with old password, creates with new password, writes', async () => {
    const fakeVault = { salt: 'abc', iv: 'def', data: 'ghi' };
    const fakeEntries = { KEY: 'value' };
    const newVault = { salt: 'x', iv: 'y', data: 'z' };

    vi.mocked(vault.readVault).mockResolvedValue(fakeVault as any);
    vi.mocked(vault.openVault).mockResolvedValue(fakeEntries as any);
    vi.mocked(vault.createVault).mockResolvedValue(newVault as any);
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);

    await changePassword('my.vault', 'oldpass', 'newpass');

    expect(vault.readVault).toHaveBeenCalledWith('my.vault');
    expect(vault.openVault).toHaveBeenCalledWith(fakeVault, 'oldpass');
    expect(vault.createVault).toHaveBeenCalledWith(fakeEntries, 'newpass');
    expect(vault.writeVault).toHaveBeenCalledWith('my.vault', newVault);
  });

  it('throws if openVault fails (wrong password)', async () => {
    vi.mocked(vault.readVault).mockResolvedValue({} as any);
    vi.mocked(vault.openVault).mockRejectedValue(new Error('Decryption failed'));

    await expect(changePassword('my.vault', 'wrong', 'newpass')).rejects.toThrow('Decryption failed');
  });
});

describe('passwd command registration', () => {
  it('registers passwd command', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'passwd');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toMatch(/password/i);
  });
});
