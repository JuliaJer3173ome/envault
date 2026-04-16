import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createVault, openVault, updateVault } from '../../crypto';
import { compareVaults } from './compare';

const TMP = path.join(os.tmpdir(), 'envault-compare-test');

beforeEach(() => { if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true }); });
afterEach(() => { fs.rmSync(TMP, { recursive: true, force: true }); });

describe('compare integration', () => {
  it('returns empty diff for identical vaults', async () => {
    const pathA = path.join(TMP, 'a.vault');
    const pathB = path.join(TMP, 'b.vault');
    await createVault(pathA, 'pass');
    await createVault(pathB, 'pass');
    await updateVault(pathA, 'pass', (v) => { v.entries['FOO'] = 'bar'; return v; });
    await updateVault(pathB, 'pass', (v) => { v.entries['FOO'] = 'bar'; return v; });
    const a = await openVault(pathA, 'pass');
    const b = await openVault(pathB, 'pass');
    const result = compareVaults(a.entries, b.entries);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
    expect(result.diffValues).toHaveLength(0);
    expect(result.common).toContain('FOO');
  });

  it('detects diverged values after separate updates', async () => {
    const pathA = path.join(TMP, 'c.vault');
    const pathB = path.join(TMP, 'd.vault');
    await createVault(pathA, 'pass');
    await createVault(pathB, 'pass');
    await updateVault(pathA, 'pass', (v) => { v.entries['KEY'] = 'alpha'; return v; });
    await updateVault(pathB, 'pass', (v) => { v.entries['KEY'] = 'beta'; return v; });
    const a = await openVault(pathA, 'pass');
    const b = await openVault(pathB, 'pass');
    const result = compareVaults(a.entries, b.entries);
    expect(result.diffValues).toContain('KEY');
  });
});
