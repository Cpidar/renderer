/**
 * load-template-snapshot.ts
 *
 * Runtime snapshot loader used by loadTenantPage and preview flows.
 * Behavior:
 *  - LRU memory cache (fast)
 *  - Optional persistent KV (Redis / Upstash) if REDIS_URL present
 *  - Compiled file under templates/compiled/<id>.json preferred
 *  - Fallback: raw snapshot under templates/snapshots/*.json (scans to match id)
 *  - Normalizes snapshot and persists compiled artifact & KV for subsequent reads
 * 
 * Caching:
 *  - LLRU memory (fast) — tuned to max:500 / TTL 1h (adjust to your infra)
 *  - Redis (optional) — set REDIS_URL to enable cross-instance caching (Upstash recommended for edge)
 */

import fs from 'fs/promises';
import path from 'path';
import LRU from 'lru-cache';
import Redis from 'ioredis';
import { normalizeSnapshot } from '../../utils/normalizeSnapshot';
import type { TemplateSnapshot } from '../../templates/types';

const PROJECT_ROOT = process.cwd();
const COMPILED_DIR = path.resolve(PROJECT_ROOT, 'templates', 'compiled');
const SNAPSHOT_DIR = path.resolve(PROJECT_ROOT, 'templates', 'snapshots');

// LRU in-memory cache — tuned for moderate cardinality.
// If you want unlimited caching change to Map or increase `max`.
const memoryCache = new LRU<string, TemplateSnapshot>({
  max: 500, // keep most recent 500 templates in memory (tune for your memory budget)
  ttl: 1000 * 60 * 60, // 1 hour
});

// Optional persistent cache using Redis (e.g., Upstash). Provide REDIS_URL env var.
const REDIS_URL = process.env.REDIS_URL || '';
let redisClient: Redis | null = null;
if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL);
    redisClient.on('error', (e) => console.warn('redis error', e?.message ?? e));
  } catch (e) {
    console.warn('redis init failed', (e as Error).message);
    redisClient = null;
  }
}

async function tryReadCompiledFile(id: string): Promise<TemplateSnapshot | null> {
  const p = path.join(COMPILED_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(p, 'utf8');
    const json = JSON.parse(raw);
    return json as TemplateSnapshot;
  } catch (err) {
    return null;
  }
}

async function tryScanSnapshotsForId(id: string): Promise<any | null> {
  try {
    const files = await fs.readdir(SNAPSHOT_DIR);
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const p = path.join(SNAPSHOT_DIR, f);
      try {
        const raw = await fs.readFile(p, 'utf8');
        const j = JSON.parse(raw);
        const tid = j.templateId ?? j.slug ?? j.name ?? path.basename(f, '.json');
        if (String(tid) === String(id)) return j;
      } catch (e) {
        // ignore parse error for this file
      }
    }
  } catch (err) {
    // ignore dir read errors
  }
  return null;
}

/**
 * Persist compiled normalized snapshot to compiled dir (best-effort)
 */
async function persistCompiledFile(id: string, normalized: TemplateSnapshot) {
  try {
    await fs.mkdir(COMPILED_DIR, { recursive: true });
    const out = path.join(COMPILED_DIR, `${id}.json`);
    await fs.writeFile(out, JSON.stringify(normalized), 'utf8');
  } catch (err) {
    // don't fail the flow if write fails
    console.warn('persistCompiledFile failed', (err as Error).message);
  }
}

/**
 * Persist to Redis / Upstash as JSON string (best-effort)
 */
async function persistToKV(id: string, normalized: TemplateSnapshot) {
  if (!redisClient) return;
  try {
    const key = `template:compiled:${id}`;
    await redisClient.set(key, JSON.stringify(normalized), 'EX', 60 * 60 * 6); // 6h TTL
  } catch (err) {
    console.warn('persistToKV failed', (err as Error).message);
  }
}

/**
 * Try fetch from persistent KV (redis)
 */
async function tryReadFromKV(id: string): Promise<TemplateSnapshot | null> {
  if (!redisClient) return null;
  try {
    const key = `template:compiled:${id}`;
    const raw = await redisClient.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as TemplateSnapshot;
  } catch (err) {
    console.warn('tryReadFromKV error', (err as Error).message);
    return null;
  }
}

/**
 * Primary exported loader
 */
export async function loadTemplateSnapshot(templateId: string): Promise<TemplateSnapshot> {
  const id = String(templateId);

  // 1) memory cache
  const mem = memoryCache.get(id);
  if (mem) return mem;

  // 2) persistent KV
  const kv = await tryReadFromKV(id);
  if (kv) {
    memoryCache.set(id, kv);
    return kv;
  }

  // 3) compiled file on disk
  const compiled = await tryReadCompiledFile(id);
  if (compiled) {
    memoryCache.set(id, compiled);
    // store into KV for other instances
    persistToKV(id, compiled).catch(() => {});
    return compiled;
  }

  // 4) try raw snapshot file (direct match)
  try {
    const rawCandidatePath = path.join(SNAPSHOT_DIR, `${id}.json`);
    try {
      const raw = await fs.readFile(rawCandidatePath, 'utf8');
      const j = JSON.parse(raw);
      const normalized = normalizeSnapshot(j);
      memoryCache.set(id, normalized);
      // persist compiled file + KV asynchronously
      persistCompiledFile(id, normalized).catch(() => {});
      persistToKV(id, normalized).catch(() => {});
      return normalized;
    } catch (e) {
      // continue to scan fallback
    }

    // 5) scan snapshots folder for matching templateId/slug/name
    const scanned = await tryScanSnapshotsForId(id);
    if (scanned) {
      const normalized = normalizeSnapshot(scanned);
      memoryCache.set(id, normalized);
      persistCompiledFile(id, normalized).catch(() => {});
      persistToKV(id, normalized).catch(() => {});
      return normalized;
    }
  } catch (err) {
    // ignore and continue to failing case
  }

  throw new Error(`Template snapshot "${id}" not found in compiled files or snapshots`);
}
