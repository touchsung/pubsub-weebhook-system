import { Either, right, left } from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";
import * as TE from "fp-ts/TaskEither";
import jwt from "jsonwebtoken";
import { IWebhookService } from "@/services/interfaces/IWebhookService";
import { Subscriber } from "@/domain/entities/Subscriber";
import { WebhookPayload } from "@/domain/types";
import { WebhookDeliveryError } from "@/domain/errors";
import { tryCatchAsync } from "@/utils/functional/Either";

export class WebhookService implements IWebhookService {
  async deliverToSubscriber(
    subscriber: Subscriber,
    payload: WebhookPayload
  ): Promise<Either<Error, void>> {
    return tryCatchAsync(async () => {
      const token = jwt.sign(payload, subscriber.secret, { expiresIn: "1h" });

      const response = await fetch(subscriber.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new WebhookDeliveryError(
          subscriber.url,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
    });
  }

  async deliverToAllSubscribers(
    subscribers: Subscriber[],
    payload: WebhookPayload
  ): Promise<Either<Error, void>> {
    return tryCatchAsync(async () => {
      const deliveryPromises = subscribers.map((subscriber) =>
        this.deliverToSubscriber(subscriber, payload)
      );

      const results = await Promise.allSettled(deliveryPromises);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Webhook delivery failed for subscriber ${subscribers[index].sub_id}:`,
            result.reason
          );
        }
      });
    });
  }
}
