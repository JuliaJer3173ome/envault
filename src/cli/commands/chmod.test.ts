import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getPermissionsFilePath,
  readPermissions,
  writePermissions,
  setPermission,
  revokePermission,
} from './chmod';

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-chmod-'));
  vaultPath = path.join(tmpDir, 'test.vault');
  fs.writeFileSync(vaultPath, '{}');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getPermissionsFilePath', () => {
  it('replaces .vault extension with .permissions.json', () => {
    expect(getPermissionsFilePath('/some/path/my.vault')).toBe('/some/path/my.permissions.json');
  });
});

describe('readPermissions', () => {
  it('returns empty array when no permissions file exists', () => {
    expect(readPermissions(vaultPath)).toEqual([]);
  });

  it('reads existing permissions', () => {
    const entries = [{ identity: 'alice', permission: 'read' }];
    fs.writeFileSync(getPermissionsFilePath(vaultPath), JSON.stringify(entries));
    expect(readPermissions(vaultPath)).toEqual(entries);
  });
});

describe('setPermission', () => {
  it('adds a new permission entry', () => {
    const result = setPermission(vaultPath, 'alice', 'read');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ identity: 'alice', permission: 'read' });
  });

  it('updates existing permission entry', () => {
    setPermission(vaultPath, 'alice', 'read');
    const result = setPermission(vaultPath, 'alice', 'admin');
    expect(result).toHaveLength(1);
    expect(result[0].permission).toBe('admin');
  });

  it('persists permissions to disk', () => {
    setPermission(vaultPath, 'bob', 'write');
    const persisted = readPermissions(vaultPath);
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toEqual({ identity: 'bob', permission: 'write' });
  });
});

describe('revokePermission', () => {
  it('removes an existing permission entry', () => {
    setPermission(vaultPath, 'alice', 'read');
    setPermission(vaultPath, 'bob', 'write');
    const result = revokePermission(vaultPath, 'alice');
    expect(result).toHaveLength(1);
    expect(result[0].identity).toBe('bob');
  });

  it('is a no-op for unknown identity', () => {
    setPermission(vaultPath, 'alice', 'read');
    const result = revokePermission(vaultPath, 'unknown');
    expect(result).toHaveLength(1);
  });
});
