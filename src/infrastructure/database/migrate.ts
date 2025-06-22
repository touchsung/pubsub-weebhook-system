import { createApp } from "@/app";
import { createDatabaseConnection } from "./connection";
import { Config } from "@/config";

const migrations = [
  `CREATE TABLE IF NOT EXISTS subscriber (
    sub_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sub_id (sub_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS subscribe_data (
    tx_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tx_id (tx_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

export const runMigrations = async (config: Config) => {
  const connection = await createDatabaseConnection(config);
  try {
    for (const migration of migrations) {
      await connection.execute(migration);
    }
    console.log("Database migrations completed successfully");
  } finally {
    await connection.end();
  }
};

const start = async () => {
  try {
    const app = await createApp();
    const config = app.getEnvs() as Config;
    await runMigrations(config);
    console.log("Migration success");
  } catch (err) {
    console.error("Failed to migrate server:", err);
  } finally {
    process.exit(1);
  }
};

start();
