import { Either } from "fp-ts/Either";
import { Option } from "fp-ts/Option";
import { CacheKey } from "@/domain/types";

export interface ICacheService {
  get(key: CacheKey): Promise<Either<Error, Option<string>>>;
  set(
    key: CacheKey,
    value: string,
    ttlSeconds: number
  ): Promise<Either<Error, void>>;
  del(key: CacheKey): Promise<Either<Error, void>>;
}
