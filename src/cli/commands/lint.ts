import { Command } from 'commander';
import * as fs from 'fs';
import { openVault } from '../../crypto';

export interface LintIssue {
  key: string;
  message: string;
  severity: 'warn' | 'error';
}

export function lintEntries(entries: Record<string, string>): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const [key, value] of Object.entries(entries)) {
    if (key !== key.toUpperCase()) {
      issues.push({ key, message: 'Key should be uppercase', severity: 'warn' });
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(key.toUpperCase())) {
      issues.push({ key, message: 'Key contains invalid characters (use A-Z, 0-9, _)', severity: 'error' });
    }
    if (value.trim() === '') {
      issues.push({ key, message: 'Value is empty', severity: 'warn' });
    }
    if (value.length > 1024) {
      issues.push({ key, message: 'Value exceeds 1024 characters', severity: 'warn' });
    }
    if (/\s/.test(key)) {
      issues.push({ key, message: 'Key contains whitespace', severity: 'error' });
    }
  }

  return issues;
}

export function registerLintCommand(program: Command): void {
  program
    .command('lint <vault>')
    .description('Check vault entries for common issues')
    .option('-p, --password <password>', 'vault password')
    .option('--strict', 'exit with error on warnings')
    .action(async (vaultPath: string, options) => {
      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }
      const password = options.password;
      if (!password) {
        console.error('Password is required (--password)');
        process.exit(1);
      }
      try {
        const vault = await openVault(vaultPath, password);
        const issues = lintEntries(vault.entries);
        if (issues.length === 0) {
          console.log('No issues found.');
          return;
        }
        let hasError = false;
        for (const issue of issues) {
          const prefix = issue.severity === 'error' ? '✖' : '⚠';
          console.log(`${prefix} [${issue.severity.toUpperCase()}] ${issue.key}: ${issue.message}`);
          if (issue.severity === 'error') hasError = true;
        }
        if (hasError || options.strict) process.exit(1);
      } catch {
        console.error('Failed to open vault. Check your password.');
        process.exit(1);
      }
    });
}
