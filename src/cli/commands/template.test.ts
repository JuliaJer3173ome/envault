import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerTemplateCommand, renderTemplate } from './template';
import * as crypto from '../../crypto';
import * as fs from 'fs';

vi.mock('../../crypto');
vi.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTemplateCommand(program);
  return program;
}

describe('renderTemplate', () => {
  it('replaces known placeholders', () => {
    const result = renderTemplate('Hello {{NAME}}!', { NAME: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('replaces multiple placeholders', () => {
    const result = renderTemplate('{{A}} and {{B}}', { A: 'foo', B: 'bar' });
    expect(result).toBe('foo and bar');
  });

  it('throws on missing variable', () => {
    expect(() => renderTemplate('{{MISSING}}', {})).toThrow('Missing variable: MISSING');
  });

  it('handles whitespace in placeholders', () => {
    const result = renderTemplate('{{ KEY }}', { KEY: 'value' });
    expect(result).toBe('value');
  });
});

describe('template command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders template to stdout', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('DB={{DB_HOST}}');
    vi.mocked(crypto.openVault).mockResolvedValue({ entries: { DB_HOST: 'localhost' } } as any);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'template', 'vault.enc', 'tpl.txt', '-p', 'secret']);

    expect(writeSpy).toHaveBeenCalledWith('DB=localhost');
    writeSpy.mockRestore();
  });

  it('exits if template file not found', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'template', 'vault.enc', 'missing.txt', '-p', 'secret']))
      .rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
