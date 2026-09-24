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
}

export function createStorage(): StorageProvider {
  return new LocalStorageProvider();
}
