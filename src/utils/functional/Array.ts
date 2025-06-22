import { pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";

export const isEmpty = <T>(arr: T[]): boolean => arr.length === 0;

export const head = <T>(arr: T[]): T | undefined =>
  isEmpty(arr) ? undefined : arr[0];

export const safeMap =
  <A, B>(f: (a: A) => B) =>
  (arr: A[]): B[] =>
    pipe(arr, A.map(f));

export const safeFilter =
  <A>(predicate: (a: A) => boolean) =>
  (arr: A[]): A[] =>
    pipe(arr, A.filter(predicate));
