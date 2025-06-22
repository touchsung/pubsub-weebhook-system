import { Either, right, left, isLeft } from "fp-ts/Either";
import { Option, isSome } from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { IPubSubService } from "@/services/interfaces/IPubSubService";
import { ICacheService } from "@/services/interfaces/ICacheService";
import { IWebhookService } from "@/services/interfaces/IWebhookService";
import { ISubscriberRepository } from "@/repositories/interfaces/ISubscriberRepository";
import { ISubscribeDataRepository } from "@/repositories/interfaces/ISubscribeDataRepository";
import { Subscriber, CreateSubscriber } from "@/domain/entities/Subscriber";
import {
  SubscribeData,
  CreateSubscribeData,
} from "@/domain/entities/SubscribeData";
import { createCacheKey, WebhookPayload } from "@/domain/types";
import { SubscriberNotFoundError, MessageNotFoundError } from "@/domain/errors";

export class PubSubService implements IPubSubService {
  constructor(
    private readonly subscriberRepo: ISubscriberRepository,
    private readonly subscribeDataRepo: ISubscribeDataRepository,
    private readonly cacheService: ICacheService,
    private readonly webhookService: IWebhookService,
    private readonly cacheTtlSeconds: number
  ) {}

  async subscribe(data: CreateSubscriber): Promise<Either<Error, Subscriber>> {
    const upsertResult = await this.subscriberRepo.upsertByUrl(data);

    if (isLeft(upsertResult)) {
      return left(upsertResult.left);
    }

    const { subscriber, wasUpdated } = upsertResult.right;

    if (wasUpdated) {
      console.log(
        `Subscriber updated for URL: ${data.url} (sub_id: ${subscriber.sub_id})`
      );
    } else {
      console.log(
        `New subscriber created for URL: ${data.url} (sub_id: ${subscriber.sub_id})`
      );
    }

    return right(subscriber);
  }

  async unsubscribe(sub_id: number): Promise<Either<Error, void>> {
    const subscriberResult = await this.subscriberRepo.findById(sub_id);

    if (isLeft(subscriberResult)) {
      return left(subscriberResult.left);
    }

    if (!isSome(subscriberResult.right)) {
      return left(new SubscriberNotFoundError(sub_id));
    }

    const subscriber = subscriberResult.right.value;

    if (!subscriber.is_active) {
      return left(new SubscriberNotFoundError(sub_id));
    }

    const deactivateResult = await this.subscriberRepo.deactivateById(sub_id);

    if (isLeft(deactivateResult)) {
      return left(deactivateResult.left);
    }

    console.log(
      `Subscriber deactivated: ${subscriber.url} (sub_id: ${sub_id})`
    );
    return right(undefined);
  }

  async publishData(
    data: CreateSubscribeData
  ): Promise<Either<Error, SubscribeData>> {
    return this.subscribeDataRepo.create(data);
  }

  async requestDataAndPublish(
    tx_id: number
  ): Promise<Either<Error, SubscribeData>> {
    const cacheKey = createCacheKey(tx_id);
    const cachedResult = await this.cacheService.get(cacheKey);

    if (isLeft(cachedResult)) {
      return left(cachedResult.left);
    }

    let messageData: SubscribeData;

    if (isSome(cachedResult.right)) {
      messageData = {
        tx_id,
        message: cachedResult.right.value,
      };
      console.log(`Using cached data for tx_id: ${tx_id}`);
    } else {
      const dbResult = await this.subscribeDataRepo.findById(tx_id);

      if (isLeft(dbResult)) {
        return left(dbResult.left);
      }

      if (!isSome(dbResult.right)) {
        return left(new MessageNotFoundError(tx_id));
      }

      messageData = dbResult.right.value;

      await this.cacheService.set(
        cacheKey,
        messageData.message,
        this.cacheTtlSeconds
      );
      console.log(`Cached data for tx_id: ${tx_id}`);
    }

    const subscribersResult = await this.subscriberRepo.findAllActive();

    if (isLeft(subscribersResult)) {
      return left(subscribersResult.left);
    }

    const activeSubscribers = subscribersResult.right;
    console.log(
      `Broadcasting to ${activeSubscribers.length} active subscribers`
    );

    if (activeSubscribers.length > 0) {
      const payload: WebhookPayload = {
        tx_id: messageData.tx_id,
        message: messageData.message,
        timestamp: new Date().toISOString(),
      };

      await this.webhookService.deliverToAllSubscribers(
        activeSubscribers,
        payload
      );
    } else {
      console.log(`No active subscribers found for tx_id: ${tx_id}`);
    }

    return right(messageData);
  }

  async getSubscriberStats(): Promise<
    Either<Error, { total: number; active: number; inactive: number }>
  > {
    const allSubscribersResult = await this.subscriberRepo.findAll();

    if (isLeft(allSubscribersResult)) {
      return left(allSubscribersResult.left);
    }

    const allSubscribers = allSubscribersResult.right;
    const active = allSubscribers.filter((s) => s.is_active).length;
    const inactive = allSubscribers.length - active;

    return right({
      total: allSubscribers.length,
      active,
      inactive,
    });
  }

  async reactivateSubscriber(
    sub_id: number
  ): Promise<Either<Error, Subscriber>> {
    const subscriberResult = await this.subscriberRepo.findById(sub_id);

    if (isLeft(subscriberResult)) {
      return left(subscriberResult.left);
    }

    if (!isSome(subscriberResult.right)) {
      return left(new SubscriberNotFoundError(sub_id));
    }

    const activateResult = await this.subscriberRepo.activateById(sub_id);

    if (isLeft(activateResult)) {
      return left(activateResult.left);
    }

    console.log(`Subscriber reactivated: (sub_id: ${sub_id})`);
    return right(activateResult.right);
  }
}
