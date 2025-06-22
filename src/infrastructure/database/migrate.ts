import { createApp } from "@/app";
import { createDatabaseConnection } from "./connection";
import { Config } from "@/config";

const migrations = [
  `CREATE TABLE IF NOT EXISTS subscriber (
    sub_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_sub_id (sub_id),
    INDEX idx_url (url(100)),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    INDEX idx_url_active (url(100), is_active),
    
    -- Unique constraint on URL
    UNIQUE KEY unique_url (url)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS subscribe_data (
    tx_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_tx_id (tx_id),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
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
  } catch (err) {
    console.error("Failed to migrate server:", err);
  } finally {
    process.exit(1);
  }
};

start();
