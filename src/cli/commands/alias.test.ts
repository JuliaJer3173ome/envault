import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  readAliases,
  writeAliases,
  setAlias,
  removeAlias,
  resolveAlias,
  registerAliasCommand,
} from './alias';
import { Command } from 'commander';

const ALIAS_FILE = path.join(os.homedir(), '.envault', 'aliases.json');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerAliasCommand(program);
  return program;
}

describe('alias utilities', () => {
  beforeEach(() => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('{}');
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('readAliases returns empty object when file missing', () => {
    expect(readAliases()).toEqual({});
  });

  it('readAliases parses existing file', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ prod: '/vaults/prod.vault' }));
    expect(readAliases()).toEqual({ prod: '/vaults/prod.vault' });
  });

  it('setAlias writes alias to file', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('{}');
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    setAlias('dev', '/tmp/dev.vault');
    expect(writeSpy).toHaveBeenCalled();
    const written = JSON.parse((writeSpy.mock.calls[0][1] as string));
    expect(written['dev']).toBe(path.resolve('/tmp/dev.vault'));
  });

  it('removeAlias returns false when alias missing', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('{}');
    expect(removeAlias('nonexistent')).toBe(false);
  });

  it('removeAlias removes existing alias', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ staging: '/vaults/staging.vault' }));
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    expect(removeAlias('staging')).toBe(true);
  });

  it('resolveAlias returns path for known alias', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ prod: '/vaults/prod.vault' }));
    expect(resolveAlias('prod')).toBe('/vaults/prod.vault');
  });

  it('resolveAlias returns undefined for unknown alias', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('{}');
    expect(resolveAlias('unknown')).toBeUndefined();
  });
});

describe('alias command', () => {
  beforeEach(() => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('{}');
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('alias set prints confirmation', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['alias', 'set', 'myalias', '/tmp/test.vault'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('myalias'));
  });

  it('alias list prints no aliases message when empty', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['alias', 'list'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('No aliases defined.');
  });
});
