import fs from 'fs';
import path from 'path';
import os from 'os';
import { getSnapshotDir, listSnapshots, saveSnapshot, restoreSnapshot } from './snapshot';

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-snap-'));
  vaultPath = path.join(tmpDir, 'test.vault');
  fs.writeFileSync(vaultPath, JSON.stringify({ salt: 'abc', iv: 'def', data: 'ghi' }));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getSnapshotDir returns correct path', () => {
  const dir = getSnapshotDir(vaultPath);
  expect(dir).toBe(path.join(tmpDir, '.test-snapshots'));
});

test('listSnapshots returns empty when no snapshots', () => {
  expect(listSnapshots(vaultPath)).toEqual([]);
});

test('saveSnapshot creates a snapshot file', () => {
  const dest = saveSnapshot(vaultPath);
  expect(fs.existsSync(dest)).toBe(true);
  const snaps = listSnapshots(vaultPath);
  expect(snaps).toHaveLength(1);
});

test('saveSnapshot uses label in filename', () => {
  const dest = saveSnapshot(vaultPath, 'before-deploy');
  expect(path.basename(dest)).toContain('before-deploy');
});

test('restoreSnapshot restores vault content', () => {
  const original = fs.readFileSync(vaultPath, 'utf-8');
  const snapName = path.basename(saveSnapshot(vaultPath));
  fs.writeFileSync(vaultPath, JSON.stringify({ salt: 'x', iv: 'y', data: 'z' }));
  restoreSnapshot(vaultPath, snapName);
  expect(fs.readFileSync(vaultPath, 'utf-8')).toBe(original);
});

test('restoreSnapshot throws if snapshot not found', () => {
  expect(() => restoreSnapshot(vaultPath, 'nonexistent.vault')).toThrow('Snapshot not found');
});

test('multiple snapshots are listed in sorted order', () => {
  saveSnapshot(vaultPath, 'a');
  saveSnapshot(vaultPath, 'b');
  const snaps = listSnapshots(vaultPath);
  expect(snaps).toHaveLength(2);
  expect(snaps[0] < snaps[1]).toBe(true);
});
