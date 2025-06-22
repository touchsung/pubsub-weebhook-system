import { Either, right, left, isLeft } from "fp-ts/Either";
import { isSome } from "fp-ts/Option";
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
    return this.subscriberRepo.create(data);
  }

  async unsubscribe(sub_id: number): Promise<Either<Error, void>> {
    const subscriberResult = await this.subscriberRepo.findById(sub_id);

    if (isLeft(subscriberResult)) {
      return left(subscriberResult.left);
    }

    if (!isSome(subscriberResult.right)) {
      return left(new SubscriberNotFoundError(sub_id));
    }

    const deleteResult = await this.subscriberRepo.deleteById(sub_id);

    if (isLeft(deleteResult)) {
      return left(deleteResult.left);
    }

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
    }

    const subscribersResult = await this.subscriberRepo.findAll();

    if (isLeft(subscribersResult)) {
      return left(subscribersResult.left);
    }

    const payload: WebhookPayload = {
      tx_id: messageData.tx_id,
      message: messageData.message,
      timestamp: new Date().toISOString(),
    };

    await this.webhookService.deliverToAllSubscribers(
      subscribersResult.right,
      payload
    );

    return right(messageData);
  }
}
