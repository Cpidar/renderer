// lib/blockCache.ts
import { getRedisJSON, setRedisJSON } from '../cache'

/**
 * blockHtml caching is optional but powerful:
 * blockCacheKey = `block:html:${pageHash}:${blockId}`
 * store pre-rendered HTML string (or serialized React render output)
 * In Node SSR with streaming, you might store static blocks as HTML snippets.
 */

export async function getBlockHTML(pageHash: string, blockId: string) {
  const key = `block:html:${pageHash}:${blockId}`
  return getRedisJSON(key)
}
export async function setBlockHTML(pageHash: string, blockId: string, html: string, ttl = 60 * 60) {
  const key = `block:html:${pageHash}:${blockId}`
  return setRedisJSON(key, html, ttl)
}
