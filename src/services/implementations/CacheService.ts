import { Either } from "fp-ts/Either";
import { Option, some, none } from "fp-ts/Option";
import { Redis } from "ioredis";
import { ICacheService } from "@/services/interfaces/ICacheService";
import { CacheKey } from "@/domain/types";
import { tryCatchAsync } from "@/utils/functional/Either";

export class CacheService implements ICacheService {
  constructor(private readonly redis: Redis) {}

  async get(key: CacheKey): Promise<Either<Error, Option<string>>> {
    return tryCatchAsync(async () => {
      const value = await this.redis.get(key.value);
      return value !== null ? some(value) : none;
    });
  }

  async set(
    key: CacheKey,
    value: string,
    ttlSeconds: number
  ): Promise<Either<Error, void>> {
    return tryCatchAsync(async () => {
      await this.redis.setex(key.value, ttlSeconds, value);
    });
  }

  async del(key: CacheKey): Promise<Either<Error, void>> {
    return tryCatchAsync(async () => {
      await this.redis.del(key.value);
    });
  }
}
