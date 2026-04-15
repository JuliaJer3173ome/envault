import * as fs from 'fs';
import * as path from 'path';
import { encrypt, decrypt, EncryptedPayload } from './encryption';

const VAULT_EXTENSION = '.vault';

export interface VaultFile {
  version: number;
  createdAt: string;
  updatedAt: string;
  payload: EncryptedPayload;
}

export function createVault(envContent: string, password: string): VaultFile {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    payload: encrypt(envContent, password),
  };
}

export function readVault(vaultPath: string): VaultFile {
  const resolved = resolveVaultPath(vaultPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Vault file not found: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, 'utf-8');
  try {
    return JSON.parse(raw) as VaultFile;
  } catch {
    throw new Error(`Vault file is corrupted or not valid JSON: ${resolved}`);
  }
}

export function writeVault(vaultPath: string, vault: VaultFile): void {
  const resolved = resolveVaultPath(vaultPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(resolved, JSON.stringify(vault, null, 2), 'utf-8');
}

export function openVault(vaultPath: string, password: string): string {
  const vault = readVault(vaultPath);
  return decrypt(vault.payload, password);
}

export function updateVault(
  vaultPath: string,
  envContent: string,
  password: string
): VaultFile {
  const existing = readVault(vaultPath);
  const updated: VaultFile = {
    ...existing,
    updatedAt: new Date().toISOString(),
    payload: encrypt(envContent, password),
  };
  writeVault(vaultPath, updated);
  return updated;
}

function resolveVaultPath(vaultPath: string): string {
  return vaultPath.endsWith(VAULT_EXTENSION)
    ? vaultPath
    : `${vaultPath}${VAULT_EXTENSION}`;
}
