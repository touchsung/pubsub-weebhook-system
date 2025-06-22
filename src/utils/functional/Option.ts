import { Option, some, none, isSome } from "fp-ts/Option";

export const fromNullable = <T>(value: T | null | undefined): Option<T> =>
  value == null ? none : some(value);

export const toUndefined = <T>(option: Option<T>): T | undefined =>
  isSome(option) ? option.value : undefined;
