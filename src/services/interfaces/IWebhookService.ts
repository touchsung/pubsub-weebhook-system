import { Either } from "fp-ts/Either";
import { Subscriber } from "@/domain/entities/Subscriber";
import { WebhookPayload } from "@/domain/types";

export interface IWebhookService {
  deliverToSubscriber(
    subscriber: Subscriber,
    payload: WebhookPayload
  ): Promise<Either<Error, void>>;
  deliverToAllSubscribers(
    subscribers: Subscriber[],
    payload: WebhookPayload
  ): Promise<Either<Error, void>>;
}
