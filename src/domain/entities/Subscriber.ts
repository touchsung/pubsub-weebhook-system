import * as t from "io-ts";

export const SubscriberCodec = t.type({
  sub_id: t.number,
  url: t.string,
  secret: t.string,
});

export const CreateSubscriberCodec = t.type({
  url: t.string,
});

export type Subscriber = t.TypeOf<typeof SubscriberCodec>;
export type CreateSubscriber = t.TypeOf<typeof CreateSubscriberCodec>;
