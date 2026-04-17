import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { openVault } from '../../crypto';
import { getExpiredKeys } from './ttl';

export function registerWatchCommand(program: Command): void {
  program
    .command('watch <vault>')
    .description('Watch a vault file for changes and report expired TTL keys')
    .option('-p, --password <password>', 'vault password')
    .option('-i, --interval <ms>', 'polling interval in milliseconds', '5000')
    .action(async (vaultPath: string, opts) => {
      const password = opts.password;
      if (!password) {
        console.error('Error: password is required (--password)');
        process.exit(1);
      }

      const interval = parseInt(opts.interval, 10);
      const resolved = path.resolve(vaultPath);

      if (!fs.existsSync(resolved)) {
        console.error(`Vault not found: ${resolved}`);
        process.exit(1);
      }

      console.log(`Watching ${resolved} every ${interval}ms...`);

      let lastMtime = fs.statSync(resolved).mtimeMs;

      const check = async () => {
        try {
          const stat = fs.statSync(resolved);
          if (stat.mtimeMs !== lastMtime) {
            lastMtime = stat.mtimeMs;
            console.log(`[${new Date().toISOString()}] Vault changed.`);
          }

          const entries = await openVault(resolved, password);
          const expired = getExpiredKeys(resolved, Object.keys(entries));
          if (expired.length > 0) {
            console.warn(`[${new Date().toISOString()}] Expired keys: ${expired.join(', ')}`);
          }
        } catch (e: any) {
          console.error(`Watch error: ${e.message}`);
        }
      };

      await check();
      setInterval(check, interval);
    });
}
