import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createVault, writeVault, openVault, updateVault } from '../../crypto/vault';
import { cloneVault } from './clone';

describe('clone integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-clone-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('clones vault with same password and preserves entries', async () => {
    const srcPath = path.join(tmpDir, 'source.vault');
    const dstPath = path.join(tmpDir, 'dest.vault');
    const password = 'test-password-123';

    const vault = await createVault(password);
    const entries = { API_KEY: 'secret', DB_URL: 'postgres://localhost/db' };
    const populated = await updateVault(vault, password, entries);
    writeVault(srcPath, populated);

    await cloneVault(srcPath, dstPath, password);

    expect(fs.existsSync(dstPath)).toBe(true);
    const { readVault } = await import('../../crypto/vault');
    const cloned = readVault(dstPath);
    const clonedEntries = await openVault(cloned, password);
    expect(clonedEntries).toEqual(entries);
  });

  it('clones vault with new password', async () => {
    const srcPath = path.join(tmpDir, 'source.vault');
    const dstPath = path.join(tmpDir, 'dest.vault');
    const oldPass = 'old-pass';
    const newPass = 'new-pass';

    const vault = await createVault(oldPass);
    const entries = { TOKEN: 'abc123' };
    const populated = await updateVault(vault, oldPass, entries);
    writeVault(srcPath, populated);

    await cloneVault(srcPath, dstPath, oldPass, newPass);

    const { readVault } = await import('../../crypto/vault');
    const cloned = readVault(dstPath);
    const clonedEntries = await openVault(cloned, newPass);
    expect(clonedEntries).toEqual(entries);
  });
});
