import { Command } from 'commander';
import { registerPatchCommand, parsePatchFile } from './patch';
import * as vault from '../../crypto/vault';
import * as fs from 'fs';

jest.mock('../../crypto/vault');
jest.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerPatchCommand(program);
  return program;
}

describe('parsePatchFile', () => {
  it('parses key=value lines', () => {
    const result = parsePatchFile('FOO=bar\nBAZ=qux\n');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    const result = parsePatchFile('# comment\n\nKEY=val\n');
    expect(result).toEqual({ KEY: 'val' });
  });

  it('handles values with equals signs', () => {
    const result = parsePatchFile('URL=http://example.com?a=1');
    expect(result).toEqual({ URL: 'http://example.com?a=1' });
  });
});

describe('patch command', () => {
  const mockVault = { entries: { EXISTING: 'old' } };

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('EXISTING=new\nNEW_KEY=hello\n');
    (vault.openVault as jest.Mock).mockResolvedValue(mockVault);
    (vault.updateVault as jest.Mock).mockResolvedValue(undefined);
  });

  it('applies patch entries to vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'patch', 'my.vault', 'changes.env', '-p', 'secret']);
    expect(vault.updateVault).toHaveBeenCalledWith(
      'my.vault', 'secret',
      { EXISTING: 'new', NEW_KEY: 'hello' }
    );
  });

  it('exits if patch file not found', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'patch', 'my.vault', 'missing.env', '-p', 'secret'])
    ).rejects.toThrow();
    mockExit.mockRestore();
  });

  it('dry-run does not call updateVault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'patch', 'my.vault', 'changes.env', '-p', 'secret', '--dry-run']);
    expect(vault.updateVault).not.toHaveBeenCalled();
  });
});
