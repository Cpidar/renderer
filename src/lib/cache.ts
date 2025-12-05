import Redis from 'ioredis';
const REDIS_URL = process.env.REDIS_URL || "";
export const redis = REDIS_URL ? new Redis(REDIS_URL) : null;

export async function getRedisJSON(key: string) {
  if (!redis) return null;
  const raw = await redis.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

export async function setRedisJSON(key: string, value: any, ttl = 60) {
  if (!redis) return null;

  const s = typeof value === 'string' ? value : JSON.stringify(value);
  await redis.set(key, s, 'EX', ttl);
}

export function blockKey(tenant: string, pageHash: string, blockId: string) {
  return `block:${tenant}:${pageHash}:${blockId}`;
}
