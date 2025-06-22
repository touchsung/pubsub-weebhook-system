import { Either } from "fp-ts/Either";
import { Option } from "fp-ts/Option";
import {
  SubscribeData,
  CreateSubscribeData,
} from "@/domain/entities/SubscribeData";

export interface ISubscribeDataRepository {
  create(data: CreateSubscribeData): Promise<Either<Error, SubscribeData>>;
  findById(tx_id: number): Promise<Either<Error, Option<SubscribeData>>>;
}
