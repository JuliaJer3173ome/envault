import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getPermissionsFilePath,
  readPermissions,
  writePermissions,
  setPermission,
  revokePermission,
  registerChmodCommand,
} from './chmod';

const buildProgram = () => {
  const program = new Command();
  program.exitOverride();
  registerChmodCommand(program);
  return program;
};

describe('chmod helpers', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-chmod-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getPermissionsFilePath returns correct path', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    const result = getPermissionsFilePath(vaultPath);
    expect(result).toBe(path.join(tmpDir, 'test.vault.permissions.json'));
  });

  it('readPermissions returns empty object when file does not exist', () => {
    const vaultPath = path.join(tmpDir, 'missing.vault');
    const perms = readPermissions(vaultPath);
    expect(perms).toEqual({});
  });

  it('writePermissions and readPermissions round-trip', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    const perms = { alice: ['read', 'write'], bob: ['read'] };
    writePermissions(vaultPath, perms);
    const result = readPermissions(vaultPath);
    expect(result).toEqual(perms);
  });

  it('setPermission adds permissions for a user', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    setPermission(vaultPath, 'alice', ['read', 'write']);
    const perms = readPermissions(vaultPath);
    expect(perms['alice']).toEqual(['read', 'write']);
  });

  it('setPermission overwrites existing permissions', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    setPermission(vaultPath, 'alice', ['read']);
    setPermission(vaultPath, 'alice', ['read', 'write', 'admin']);
    const perms = readPermissions(vaultPath);
    expect(perms['alice']).toEqual(['read', 'write', 'admin']);
  });

  it('revokePermission removes a user', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    setPermission(vaultPath, 'alice', ['read']);
    setPermission(vaultPath, 'bob', ['read', 'write']);
    revokePermission(vaultPath, 'alice');
    const perms = readPermissions(vaultPath);
    expect(perms['alice']).toBeUndefined();
    expect(perms['bob']).toEqual(['read', 'write']);
  });

  it('revokePermission is a no-op for unknown user', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    expect(() => revokePermission(vaultPath, 'nobody')).not.toThrow();
  });
});

describe('chmod command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-chmod-cmd-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('chmod set prints confirmation', async () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync([
      'node', 'envault', 'chmod', 'set', vaultPath, 'alice', 'read,write',
    ]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('alice')
    );
  });

  it('chmod revoke prints confirmation', async () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    setPermission(vaultPath, 'alice', ['read']);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync([
      'node', 'envault', 'chmod', 'revoke', vaultPath, 'alice',
    ]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('alice')
    );
  });

  it('chmod list prints all permissions', async () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    setPermission(vaultPath, 'alice', ['read', 'write']);
    setPermission(vaultPath, 'bob', ['read']);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync([
      'node', 'envault', 'chmod', 'list', vaultPath,
    ]);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toContain('alice');
    expect(output).toContain('bob');
  });

  it('chmod list shows empty message when no permissions set', async () => {
    const vaultPath = path.join(tmpDir, 'empty.vault');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync([
      'node', 'envault', 'chmod', 'list', vaultPath,
    ]);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toMatch(/no permissions|empty/i);
  });
});
