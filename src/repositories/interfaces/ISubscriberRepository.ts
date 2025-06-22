import { Either } from "fp-ts/Either";
import { Option } from "fp-ts/Option";
import { Subscriber, CreateSubscriber } from "@/domain/entities/Subscriber";

export interface ISubscriberRepository {
  create(data: CreateSubscriber): Promise<Either<Error, Subscriber>>;
  findById(sub_id: number): Promise<Either<Error, Option<Subscriber>>>;
  findAll(): Promise<Either<Error, Subscriber[]>>;
  deleteById(sub_id: number): Promise<Either<Error, boolean>>;
}
