import { Command } from 'commander';
import { openVault, updateVault } from '../../crypto/vault';
import { promptPassword } from './init';

export function encodeEntries(
  entries: Record<string, string>,
  keys: string[],
  encoding: 'base64' | 'hex'
): Record<string, string> {
  const result = { ...entries };
  const targets = keys.length > 0 ? keys : Object.keys(entries);
  for (const key of targets) {
    if (key in result) {
      const buf = Buffer.from(result[key], 'utf8');
      result[key] = encoding === 'base64' ? buf.toString('base64') : buf.toString('hex');
    }
  }
  return result;
}

export function decodeEntries(
  entries: Record<string, string>,
  keys: string[],
  encoding: 'base64' | 'hex'
): Record<string, string> {
  const result = { ...entries };
  const targets = keys.length > 0 ? keys : Object.keys(entries);
  for (const key of targets) {
    if (key in result) {
      try {
        result[key] = Buffer.from(result[key], encoding).toString('utf8');
      } catch {
        // leave unchanged if decode fails
      }
    }
  }
  return result;
}

export function registerEncodeCommand(program: Command): void {
  const cmd = program
    .command('encode <vault>')
    .description('Encode or decode values in a vault')
    .option('-k, --keys <keys>', 'comma-separated keys to encode/decode (default: all)')
    .option('-e, --encoding <enc>', 'encoding format: base64 or hex', 'base64')
    .option('-d, --decode', 'decode instead of encode')
    .action(async (vaultPath: string, opts) => {
      const password = await promptPassword('Vault password: ');
      const encoding = opts.encoding === 'hex' ? 'hex' : 'base64';
      const keys: string[] = opts.keys ? opts.keys.split(',').map((k: string) => k.trim()) : [];
      const vault = await openVault(vaultPath, password);
      const updated = opts.decode
        ? decodeEntries(vault.entries, keys, encoding)
        : encodeEntries(vault.entries, keys, encoding);
      await updateVault(vaultPath, password, updated);
      const action = opts.decode ? 'Decoded' : 'Encoded';
      console.log(`${action} ${Object.keys(updated).length} entries using ${encoding}.`);
    });
  return;
}
