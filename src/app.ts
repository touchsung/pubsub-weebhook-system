import Fastify, { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import fastifyCors from "@fastify/cors";
import { Config, envOptions } from "@/config";
import { createDatabaseConnection } from "@/infrastructure/database/connection";
import { createRedisConnection } from "@/infrastructure/cache/connection";
import { DIContainer } from "@/infrastructure/container";
import { SubscriberRepository } from "@/repositories/implementations/SubscriberRepository";
import { SubscribeDataRepository } from "@/repositories/implementations/SubscribeDataRepository";
import { CacheService } from "@/services/implementations/CacheService";
import { WebhookService } from "@/services/implementations/WebhookService";
import { PubSubService } from "@/services/implementations/PubSubService";
import apiRoutes from "@/routes/api";

export const createApp = async (): Promise<FastifyInstance> => {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
  });

  await fastify.register(fastifyEnv, envOptions);

  await fastify.register(fastifyCors, {
    origin: true,
  });

  const config = fastify.config;

  fastify.log.info(
    {
      NODE_ENV: config.NODE_ENV,
      PORT: config.PORT,
      DB_HOST: config.DB_HOST,
      DB_PORT: config.DB_PORT,
      DB_NAME: config.DB_NAME,
      REDIS_URL: config.REDIS_URL,
      CACHE_TTL_SECONDS: config.CACHE_TTL_SECONDS,
    },
    "Configuration loaded"
  );

  const container = new DIContainer();
  fastify.decorate("diContainer", container);

  const dbConnection = await createDatabaseConnection(config);
  container.register("dbConnection", () => dbConnection);

  const redisConnection = createRedisConnection(config);
  container.register("redisConnection", () => redisConnection);

  container.register(
    "subscriberRepository",
    () => new SubscriberRepository(container.resolve("dbConnection"))
  );
  container.register(
    "subscribeDataRepository",
    () => new SubscribeDataRepository(container.resolve("dbConnection"))
  );

  container.register(
    "cacheService",
    () => new CacheService(container.resolve("redisConnection"))
  );
  container.register("webhookService", () => new WebhookService());
  container.register(
    "pubSubService",
    () =>
      new PubSubService(
        container.resolve("subscriberRepository"),
        container.resolve("subscribeDataRepository"),
        container.resolve("cacheService"),
        container.resolve("webhookService"),
        config.CACHE_TTL_SECONDS
      )
  );

  await fastify.register(apiRoutes);

  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  }));

  fastify.addHook("onClose", async () => {
    fastify.log.info("Shutting down gracefully...");
    await dbConnection.end();
    redisConnection.disconnect();
  });

  return fastify;
};
