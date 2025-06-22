import { Either } from "fp-ts/Either";
import { Option } from "fp-ts/Option";
import { Subscriber, CreateSubscriber } from "@/domain/entities/Subscriber";

export interface ISubscriberRepository {
  create(data: CreateSubscriber): Promise<Either<Error, Subscriber>>;
  findById(sub_id: number): Promise<Either<Error, Option<Subscriber>>>;
  findByUrl(url: string): Promise<Either<Error, Option<Subscriber>>>;
  findAll(): Promise<Either<Error, Subscriber[]>>;
  findAllActive(): Promise<Either<Error, Subscriber[]>>;
  updateById(
    sub_id: number,
    updates: Partial<Subscriber>
  ): Promise<Either<Error, Subscriber>>;
  updateByUrl(
    url: string,
    updates: Partial<Subscriber>
  ): Promise<Either<Error, Subscriber>>;
  activateById(sub_id: number): Promise<Either<Error, Subscriber>>;
  deactivateById(sub_id: number): Promise<Either<Error, Subscriber>>;
  upsertByUrl(
    data: CreateSubscriber
  ): Promise<Either<Error, { subscriber: Subscriber; wasUpdated: boolean }>>;
}
