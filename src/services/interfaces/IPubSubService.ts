import { Either } from "fp-ts/Either";
import { Subscriber, CreateSubscriber } from "@/domain/entities/Subscriber";
import {
  SubscribeData,
  CreateSubscribeData,
} from "@/domain/entities/SubscribeData";

export interface IPubSubService {
  subscribe(data: CreateSubscriber): Promise<Either<Error, Subscriber>>;
  unsubscribe(sub_id: number): Promise<Either<Error, void>>;
  publishData(data: CreateSubscribeData): Promise<Either<Error, SubscribeData>>;
  requestDataAndPublish(tx_id: number): Promise<Either<Error, SubscribeData>>;
}
