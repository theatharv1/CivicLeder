import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  storageDriver: (process.env.STORAGE_DRIVER ?? "local") as "local",
  storagePath: process.env.STORAGE_PATH ?? "./uploads",
  corsOrigins: process.env.CORS_ORIGINS ?? "*",
};

export function assertConfig(): void {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
}
