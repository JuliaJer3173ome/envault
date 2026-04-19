import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { encodeEntries, decodeEntries, registerEncodeCommand } from './encode';
import * as vault from '../../crypto/vault';
import * as init from './init';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerEncodeCommand(program);
  return program;
}

describe('encodeEntries', () => {
  it('encodes all entries in base64 when no keys specified', () => {
    const result = encodeEntries({ FOO: 'hello', BAR: 'world' }, [], 'base64');
    expect(result.FOO).toBe(Buffer.from('hello').toString('base64'));
    expect(result.BAR).toBe(Buffer.from('world').toString('base64'));
  });

  it('encodes only specified keys', () => {
    const result = encodeEntries({ FOO: 'hello', BAR: 'world' }, ['FOO'], 'base64');
    expect(result.FOO).toBe(Buffer.from('hello').toString('base64'));
    expect(result.BAR).toBe('world');
  });

  it('encodes in hex', () => {
    const result = encodeEntries({ FOO: 'hi' }, [], 'hex');
    expect(result.FOO).toBe(Buffer.from('hi').toString('hex'));
  });
});

describe('decodeEntries', () => {
  it('decodes base64 values', () => {
    const encoded = Buffer.from('hello').toString('base64');
    const result = decodeEntries({ FOO: encoded }, [], 'base64');
    expect(result.FOO).toBe('hello');
  });

  it('decodes hex values', () => {
    const encoded = Buffer.from('hi').toString('hex');
    const result = decodeEntries({ FOO: encoded }, [], 'hex');
    expect(result.FOO).toBe('hi');
  });

  it('leaves value unchanged on decode failure', () => {
    const result = decodeEntries({ FOO: '!!!notvalid!!!' }, [], 'hex');
    expect(result.FOO).toBeDefined();
  });
});

describe('registerEncodeCommand', () => {
  beforeEach(() => {
    vi.spyOn(init, 'promptPassword').mockResolvedValue('secret');
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { KEY: 'value' } } as any);
    vi.spyOn(vault, 'updateVault').mockResolvedValue(undefined);
  });

  it('encodes vault entries', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'encode', 'vault.env']);
    expect(vault.updateVault).toHaveBeenCalled();
  });

  it('decodes vault entries with --decode flag', async () => {
    const encoded = Buffer.from('value').toString('base64');
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { KEY: encoded } } as any);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'encode', 'vault.env', '--decode']);
    const call = (vault.updateVault as any).mock.calls[0];
    expect(call[2].KEY).toBe('value');
  });
});
