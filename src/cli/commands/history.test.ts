import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  appendHistory,
  readHistory,
  clearHistory,
  getHistoryFilePath,
  registerHistoryCommand,
} from './history';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerHistoryCommand(program);
  return program;
}

describe('history module', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-history-'));
    vaultPath = path.join(tmpDir, 'test.vault');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array when no history exists', () => {
    const entries = readHistory(vaultPath);
    expect(entries).toEqual([]);
  });

  it('appends and reads a history entry', () => {
    appendHistory(vaultPath, 'set', 'API_KEY');
    const entries = readHistory(vaultPath);
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('set');
    expect(entries[0].key).toBe('API_KEY');
    expect(entries[0].vaultPath).toBe(vaultPath);
  });

  it('returns entries in reverse chronological order', () => {
    appendHistory(vaultPath, 'set', 'KEY_A');
    appendHistory(vaultPath, 'delete', 'KEY_B');
    const entries = readHistory(vaultPath);
    expect(entries[0].action).toBe('delete');
    expect(entries[1].action).toBe('set');
  });

  it('respects the limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      appendHistory(vaultPath, 'set', `KEY_${i}`);
    }
    const entries = readHistory(vaultPath, 3);
    expect(entries).toHaveLength(3);
  });

  it('clears history file', () => {
    appendHistory(vaultPath, 'init');
    clearHistory(vaultPath);
    expect(fs.existsSync(getHistoryFilePath(vaultPath))).toBe(false);
  });

  it('clear is a no-op when history does not exist', () => {
    expect(() => clearHistory(vaultPath)).not.toThrow();
  });

  it('CLI --clear flag clears history and logs message', () => {
    appendHistory(vaultPath, 'set', 'KEY');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['history', vaultPath, '--clear'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('History cleared.');
    consoleSpy.mockRestore();
  });
});
