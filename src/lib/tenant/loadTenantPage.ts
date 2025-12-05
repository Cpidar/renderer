// apps/storefront/src/lib/tenant/loadTenantPage.ts
/**
 * loadTenantPage.ts
 *
 * Central data-loading pipeline used by the storefront universal page resolver.
 * Responsibilities:
 *  - Resolve page & product data from Payload (or worker/Redis cache)
 *  - safeDeserialize JSON blobs stored in CMS
 *  - Fetch template snapshot (worker cache preferred)
 *  - Merge template + tenant overrides + page overrides
 *  - Compute pageHash (used for block caching & ISR)
 *  - Preload components used on page (so SSR can import them)
 *
 * Returns a structured object ready for rendering:
 *  {
 *    tenant, page, product, templateSnapshot, merged, pageHash, cacheHit
 *  }
 */

import crypto from "crypto";

// Use existing helper functions in your codebase (adjust imports if different)
import {
  fetchTenantById,
  fetchPageBySlug,
  fetchProductBySlug,
  fetchTemplateSnapshotFromPayload,
} from "../data/payload";

import { safeDeserialize } from "../puck/safeDeserialize";
import { mergeTemplateWithPage } from "../templates/mergeEngine";
import { collectTypesFromPuck } from "../puck/puckUtils";
import { preloadComponents } from "../puck/componentRegistry.server";
import { getRedisJSON, setRedisJSON } from "../cache"; // optional cache helpers


export type LoadTenantPageResult = {
  tenant: any | null;
  page: any | null;
  product: any | null;
  templateSnapshot: any | null;
  merged: any | null;
  pageHash: string | null;
  cacheHit: boolean;
};

/** Utility: compute sha256 hash of a string */
function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * loadTenantPage
 * @param tenantId string - tenant id (or slug if you prefer)
 * @param path string - requested path (e.g. '/', '/products/lamp')
 * @param opts object - { useCache: boolean, preview: boolean }
 */
export async function loadTenantPage(
  tenantId: string,
  path: string,
  opts: { useCache?: boolean; preview?: boolean } = {}
): Promise<LoadTenantPageResult> {
  const useCache = opts.useCache ?? true;
  const preview = opts.preview ?? false;

  // 1) Load tenant (fast)
  const tenant = await fetchTenantById(tenantId);
  if (!tenant) {
    return { tenant: null, page: null, product: null, templateSnapshot: null, merged: null, pageHash: null, cacheHit: false };
  }

  // Cache key for the merged snapshot / page-level HTML (optional)
  const mergedCacheKey = `tenant:${tenantId}:page:${path}`;;

  // 2) Try fast cache (if allowed)
  if (useCache && !preview) {
    try {
      const cached = await getRedisJSON(mergedCacheKey);
      if (cached) {
        // const parsed = JSON.parse(cached);
        // WARNING: we assume worker cached only sanitized JSON
        return {
          tenant,
          page: cached.page ?? null,
          product: cached.product ?? null,
          templateSnapshot: cached.templateSnapshot ?? null,
          merged: cached.merged ?? null,
          pageHash: cached.pageHash ?? null,
          cacheHit: true,
        };
      }
    } catch (err) {
      // ignore cache errors — continue to origin fetch
      console.warn("loadTenantPage - redis get error:", err);
    }
  }

  // 3) Resolve product page (product takes priority)
  const product = await fetchProductBySlug(tenant.id || tenant._id || tenant.slug, path);

  // 4) Load CMS page (Puck JSON) for provided path
  const page = await fetchPageBySlug(tenant.id || tenant._id || tenant.slug, path);

  // 5) safeDeserialize stored JSON blobs (always do this BEFORE merge)
  let pageData: any = null;
  try {
    pageData = page?.puckData ? safeDeserialize(page.puckData) : null;
  } catch (err) {
    console.error("safeDeserialize(page.puckData) failed:", err);
    pageData = null;
  }

  // 6) Template snapshot resolution:
  // prefer product.templateVersion -> page.templateVersion -> tenant.templateVersion -> tenant.template
  const templateId =
    (product && product.templateVersion) ||
    (page && page.templateVersion) ||
    tenant.templateVersion ||
    tenant.template ||
    null;

  let templateSnapshot: any = null;
  if (templateId) {
    try {
      // This function is expected to fetch the normalized snapshot shape
      templateSnapshot = await fetchTemplateSnapshotFromPayload(tenant.id || tenant._id || tenant.slug, templateId);
      // ensure it's safe
      templateSnapshot = safeDeserialize(templateSnapshot);
    } catch (err) {
      console.error("fetchTemplateSnapshotFromPayload failed:", err);
      templateSnapshot = null;
    }
  }

  // 7) Tenant overrides (optional) - tenant.themeTokens or tenant.templateOverrides
  const tenantOverrides = tenant.templateOverrides ?? tenant.themeTokens ?? null;

  // 8) Merge template + tenant overrides + page data
  const merged = mergeTemplateWithPage(templateSnapshot ?? {}, tenantOverrides ?? {}, pageData ?? {});

  // 9) Compute pageHash for caching & block cache keys (use merged + product id to be safe)
  const pageHashInput = JSON.stringify({
    templateVersion: templateSnapshot?.version ?? templateSnapshot?.updatedAt ?? null,
    merged,
    productId: product?.id ?? product?._id ?? null,
  });
  const pageHash = sha256Hex(pageHashInput);

  // 10) Preload components used on page (so server dynamic import will be warm)
  try {
    const types = collectTypesFromPuck(merged);
    await preloadComponents(types);
  } catch (err) {
    console.warn("preloadComponents failed:", err);
  }

  // 11) Optionally prime block caches or store merged snapshot for fast subsequent reads
  if (useCache && !preview) {
    try {
      const payload = {
        page: page ?? null,
        product: product ?? null,
        templateSnapshot: templateSnapshot ?? null,
        merged,
        pageHash,
      };
      await setRedisJSON(mergedCacheKey, JSON.stringify(payload), 60 * 5); // 5 min TTL
    } catch (err) {
      console.warn("loadTenantPage - redis set failed:", err);
    }
  }

  return {
    tenant,
    page,
    product,
    templateSnapshot,
    merged,
    pageHash,
    cacheHit: false,
  };
}

/** Example usage (inside app/(tenant)/page.tsx):
 *
 *  const { tenant, merged, pageHash } = await loadTenantPage(tenantId, path, { useCache: true, preview: false });
 *  return <PuckRenderer puckJson={merged} />
 *
 */
