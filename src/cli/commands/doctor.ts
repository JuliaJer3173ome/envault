import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { readVault } from '../../crypto/vault';
import { readLocks } from './lock';
import { readTtls, getExpiredKeys } from './ttl';

export interface DoctorResult {
  file: string;
  readable: boolean;
  locked: boolean;
  expiredKeys: string[];
  warnings: string[];
}

export function diagnoseVault(vaultPath: string): DoctorResult {
  const warnings: string[] = [];
  let readable = false;
  let locked = false;
  let expiredKeys: string[] = [];

  if (!fs.existsSync(vaultPath)) {
    warnings.push('Vault file does not exist.');
    return { file: vaultPath, readable, locked, expiredKeys, warnings };
  }

  const stat = fs.statSync(vaultPath);
  if (stat.size === 0) {
    warnings.push('Vault file is empty.');
  }

  try {
    const raw = fs.readFileSync(vaultPath, 'utf-8');
    JSON.parse(raw);
    readable = true;
  } catch {
    warnings.push('Vault file is not valid JSON or is corrupted.');
  }

  try {
    const locks = readLocks();
    locked = !!locks[path.resolve(vaultPath)];
    if (locked) warnings.push('Vault is currently locked.');
  } catch {
    warnings.push('Could not read lock state.');
  }

  try {
    const ttls = readTtls(vaultPath);
    expiredKeys = getExpiredKeys(ttls);
    if (expiredKeys.length > 0) {
      warnings.push(`${expiredKeys.length} key(s) have expired TTLs: ${expiredKeys.join(', ')}`);
    }
  } catch {
    // ttl file may not exist, that's fine
  }

  return { file: vaultPath, readable, locked, expiredKeys, warnings };
}

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor <vault>')
    .description('Check vault health: readability, lock state, and expired TTLs')
    .action((vault: string) => {
      const result = diagnoseVault(vault);
      console.log(`\nDoctor report for: ${result.file}`);
      console.log(`  Readable : ${result.readable ? '✓' : '✗'}`);
      console.log(`  Locked   : ${result.locked ? 'yes' : 'no'}`);
      console.log(`  Expired  : ${result.expiredKeys.length} key(s)`);
      if (result.warnings.length === 0) {
        console.log('  Status   : All checks passed ✓');
      } else {
        console.log('  Warnings :');
        result.warnings.forEach(w => console.log(`    - ${w}`));
      }
    });
}
