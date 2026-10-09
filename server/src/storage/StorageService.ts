import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config/env.js";

export interface StorageProvider {
  save(
    relativePath: string,
    data: Buffer,
    contentType?: string
  ): Promise<{ storagePath: string }>;
}

export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root = path.join(config.storagePath, "report-evidence")) {
    this.root = path.resolve(root);
  }

  async save(
    relativePath: string,
    data: Buffer,
    _contentType?: string
  ): Promise<{ storagePath: string }> {
    const safe = relativePath.replace(/\.\./g, "").replace(/^\/+/, "");
    const full = path.join(this.root, safe);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return { storagePath: safe };
  }

  /** Absolute path for a stored file, or null if it would escape the root. */
  resolve(relativePath: string): string | null {
    const full = path.resolve(this.root, relativePath);
    return full.startsWith(this.root + path.sep) ? full : null;
  }
}

export function createStorage(): StorageProvider {
  return new LocalStorageProvider();
}

export function createPublicAlertStorage(): LocalStorageProvider {
  return new LocalStorageProvider(path.join(config.storagePath, "public-alerts"));
}
