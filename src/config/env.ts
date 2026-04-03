import path from "node:path";

export function getConfig() {
  return {
    port: Number(process.env.PORT ?? 3000),
    databasePath: process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "finance.db")
  };
}
