import mysql from "mysql2/promise";
import { Config } from "@/config";

export const createDatabaseConnection = async (config: Config) => {
  return mysql.createConnection({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    timezone: "+00:00",
  });
};
