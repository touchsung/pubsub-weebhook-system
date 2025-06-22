import { Either, left, right, isLeft } from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { DomainError } from "@/domain/errors";

export const tryCatch = <T>(fn: () => T): Either<Error, T> => {
  try {
    return right(fn());
  } catch (error) {
    return left(error instanceof Error ? error : new Error(String(error)));
  }
};

export const tryCatchAsync = async <T>(
  fn: () => Promise<T>
): Promise<Either<Error, T>> => {
  try {
    const result = await fn();
    return right(result);
  } catch (error) {
    return left(error instanceof Error ? error : new Error(String(error)));
  }
};

export const mapError =
  <E1, E2, A>(f: (e: E1) => E2) =>
  (either: Either<E1, A>): Either<E2, A> =>
    isLeft(either) ? left(f(either.left)) : either;
