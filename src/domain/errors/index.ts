export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SubscriberNotFoundError extends DomainError {
  readonly code = "SUBSCRIBER_NOT_FOUND";

  constructor(sub_id: number) {
    super(`Subscriber with ID ${sub_id} not found`);
  }
}

export class MessageNotFoundError extends DomainError {
  readonly code = "MESSAGE_NOT_FOUND";

  constructor(tx_id: number) {
    super(`Message with ID ${tx_id} not found`);
  }
}

export class InvalidUrlError extends DomainError {
  readonly code = "INVALID_URL";

  constructor(url: string) {
    super(`Invalid URL: ${url}`);
  }
}

export class WebhookDeliveryError extends DomainError {
  readonly code = "WEBHOOK_DELIVERY_ERROR";

  constructor(url: string, reason: string) {
    super(`Failed to deliver webhook to ${url}: ${reason}`);
  }
}
