import * as t from "io-ts";

export const SubscriberCodec = t.type({
  sub_id: t.number,
  url: t.string,
  secret: t.string,
  is_active: t.boolean,
});

export const CreateSubscriberCodec = t.type({
  url: t.string,
});

export const UpdateSubscriberCodec = t.type({
  url: t.string,
  is_active: t.boolean,
});

export type Subscriber = t.TypeOf<typeof SubscriberCodec>;
export type CreateSubscriber = t.TypeOf<typeof CreateSubscriberCodec>;
export type UpdateSubscriber = t.TypeOf<typeof UpdateSubscriberCodec>;

export const isActiveSubscriber = (subscriber: Subscriber): boolean =>
  subscriber.is_active;

export const createInactiveSubscriber = (
  subscriber: Subscriber
): Subscriber => ({
  ...subscriber,
  is_active: false,
});

export const createActiveSubscriber = (subscriber: Subscriber): Subscriber => ({
  ...subscriber,
  is_active: true,
});
