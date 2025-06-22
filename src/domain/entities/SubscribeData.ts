import * as t from "io-ts";

export const SubscribeDataCodec = t.type({
  tx_id: t.number,
  message: t.string,
});

export const CreateSubscribeDataCodec = t.type({
  message: t.string,
});

export type SubscribeData = t.TypeOf<typeof SubscribeDataCodec>;
export type CreateSubscribeData = t.TypeOf<typeof CreateSubscribeDataCodec>;
