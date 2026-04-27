import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function chunkEntries(
  entries: Record<string, string>,
  size: number
): Record<string, string>[] {
  const keys = Object.keys(entries);
  const chunks: Record<string, string>[] = [];
  for (let i = 0; i < keys.length; i += size) {
    const chunk: Record<string, string> = {};
    keys.slice(i, i + size).forEach((k) => {
      chunk[k] = entries[k];
    });
    chunks.push(chunk);
  }
  return chunks;
}

export function registerChunkCommand(program: Command): void {
  program
    .command('chunk <vault> <size>')
    .description('Split vault entries into chunks of given size and print as JSON')
    .option('-p, --password <password>', 'vault password')
    .action(async (vaultPath: string, sizeStr: string, options: { password?: string }) => {
      const size = parseInt(sizeStr, 10);
      if (isNaN(size) || size < 1) {
        console.error('Error: size must be a positive integer');
        process.exit(1);
      }
      const password = options.password ?? (await promptPassword('Enter vault password: '));
      try {
        const vault = await openVault(vaultPath, password);
        const chunks = chunkEntries(vault.entries, size);
        chunks.forEach((chunk, idx) => {
          console.log(`--- Chunk ${idx + 1} ---`);
          Object.entries(chunk).forEach(([k, v]) => console.log(`${k}=${v}`));
        });
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
