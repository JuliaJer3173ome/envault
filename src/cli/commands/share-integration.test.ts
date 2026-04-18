import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerShareCommand } from './share';
import { createVault, openVault } from '../../crypto';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerShareCommand(program);
  return program;
}

describe('share integration', () => {
  let tmpDir: string;
  let sourceVault: string;
  let outputVault: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-share-'));
    sourceVault = path.join(tmpDir, 'source.enc');
    outputVault = path.join(tmpDir, 'shared.enc');
    await createVault(sourceVault, 'srcpass', { API_KEY: 'key123', DB_URL: 'postgres://localhost', SECRET: 'topsecret' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a readable share bundle with all keys', async () => {
    const program = buildProgram();
    await program.parseAsync(['share', sourceVault, outputVault, '-p', 'srcpass', '-P', 'sharepass'], { from: 'user' });
    const entries = await openVault(outputVault, 'sharepass');
    expect(entries).toMatchObject({ API_KEY: 'key123', DB_URL: 'postgres://localhost', SECRET: 'topsecret' });
  });

  it('creates a share bundle with only specified keys', async () => {
    const program = buildProgram();
    await program.parseAsync(['share', sourceVault, outputVault, '-p', 'srcpass', '-P', 'sharepass', '-k', 'API_KEY,SECRET'], { from: 'user' });
    const entries = await openVault(outputVault, 'sharepass');
    expect(entries).toMatchObject({ API_KEY: 'key123', SECRET: 'topsecret' });
    expect(entries.DB_URL).toBeUndefined();
  });

  it('fails with wrong source password', async () => {
    const program = buildProgram();
    await expect(
      program.parseAsync(['share', sourceVault, outputVault, '-p', 'wrongpass', '-P', 'sharepass'], { from: 'user' })
    ).rejects.toThrow();
  });
});
