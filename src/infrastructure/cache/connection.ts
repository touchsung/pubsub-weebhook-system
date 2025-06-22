import { Redis } from "ioredis";
import { Config } from "@/config";

export const createRedisConnection = (config: Config): Redis => {
  return new Redis(config.REDIS_URL, {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  });
};
