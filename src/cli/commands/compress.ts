import { Command } from 'commander';
import * as fs from 'fs';
import * as zlib from 'zlib';
import * as path from 'path';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(prompt, (ans) => { rl.close(); resolve(ans); }));
}

export function compressVault(vaultPath: string): string {
  const outPath = vaultPath + '.gz';
  const data = fs.readFileSync(vaultPath);
  const compressed = zlib.gzipSync(data);
  fs.writeFileSync(outPath, compressed);
  return outPath;
}

export function decompressVault(gzPath: string): string {
  if (!gzPath.endsWith('.gz')) throw new Error('File does not have .gz extension');
  const outPath = gzPath.slice(0, -3);
  const data = fs.readFileSync(gzPath);
  const decompressed = zlib.gunzipSync(data);
  fs.writeFileSync(outPath, decompressed);
  return outPath;
}

export function registerCompressCommand(program: Command): void {
  const cmd = program.command('compress');

  cmd
    .command('pack <vault>')
    .description('Compress a vault file to .gz')
    .action((vault: string) => {
      try {
        const resolved = path.resolve(vault);
        if (!fs.existsSync(resolved)) {
          console.error(`Vault not found: ${resolved}`);
          process.exit(1);
        }
        const out = compressVault(resolved);
        console.log(`Compressed vault saved to: ${out}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cmd
    .command('unpack <file>')
    .description('Decompress a .gz vault file')
    .action((file: string) => {
      try {
        const resolved = path.resolve(file);
        if (!fs.existsSync(resolved)) {
          console.error(`File not found: ${resolved}`);
          process.exit(1);
        }
        const out = decompressVault(resolved);
        console.log(`Decompressed vault saved to: ${out}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
