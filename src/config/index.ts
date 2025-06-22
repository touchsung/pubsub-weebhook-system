import { FastifyEnvOptions } from "@fastify/env";
export const envSchema = {
  type: "object",
  required: [],
  properties: {
    NODE_ENV: {
      type: "string",
      default: "development",
    },
    PORT: {
      type: "integer",
      default: 3000,
    },
    LOG_LEVEL: {
      type: "string",
      default: "info",
    },
    DB_HOST: {
      type: "string",
      default: "localhost",
    },
    DB_PORT: {
      type: "integer",
      default: 3306,
    },
    DB_USER: {
      type: "string",
      default: "dbuser",
    },
    DB_PASSWORD: {
      type: "string",
      default: "dbpassword",
    },
    DB_NAME: {
      type: "string",
      default: "pubsub_webhook",
    },
    REDIS_URL: {
      type: "string",
      default: "redis://localhost:6379",
    },
    CACHE_TTL_SECONDS: {
      type: "integer",
      default: 1,
    },
    JWT_SECRET: {
      type: "string",
      default: "your-secret-key",
    },
    WEBHOOK_RECEIVER_PORT: {
      type: "integer",
      default: 8000,
    },
  },
};

export interface Config {
  NODE_ENV: string;
  PORT: number;
  LOG_LEVEL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  REDIS_URL: string;
  CACHE_TTL_SECONDS: number;
  JWT_SECRET: string;
  WEBHOOK_RECEIVER_PORT: number;
}

export const envOptions: FastifyEnvOptions = {
  confKey: "config",
  schema: envSchema,
  dotenv: true,
  data: process.env,
};

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}
