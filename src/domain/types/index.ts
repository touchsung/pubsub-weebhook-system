export interface WebhookPayload {
  tx_id: number;
  message: string;
  timestamp: string;
}

export interface CacheKey {
  readonly value: string;
}

export const createCacheKey = (tx_id: number): CacheKey => ({
  value: `message:${tx_id}`,
});
