import deepmerge from 'deepmerge'
import crypto from 'crypto'

/**
 * mergeEngine responsibilities:
 * - normalize template snapshot + page puckData + tenant tokens
 * - compute templateVersion and page fingerprint
 * - return merged object, plus metadata { templateVersion, pageHash }
 */

// Normalizer: ensures stable keys / defaults
function normalizeTemplate(template: any) {
  // keep only required fields for rendering: tokens, layout, blocks defaults
  return {
    templateName: template.templateName || 'unnamed',
    version: template.version || '0.0.0',
    tokens: template.tokens || {},
    layout: template.layout || {},
    defaults: template.defaults || {},
    snapshotMeta: template.snapshotMeta || {}
  }
}

// custom array merge: if objects have id, merge by id, else replace with src
function arrayMerge(dest: any[], src: any[]) {
  if (!src || src.length === 0) return dest;
  if (!dest) return src;
  if (src[0] && src[0].id) {
    const map: Record<string, any> = {};
    dest.forEach(d => { if (d?.id) map[d.id] = d; });
    src.forEach(s => { if (s?.id) map[s.id] = deepmerge(map[s.id] ?? {}, s); });
    return Object.values(map);
  }
  return src;
}

/**
 * Merge template snapshot and puck page. Returns merged object.
 * - baseTemplate: snapshot from Payload in format of puck editor data payload
 * - pageOverrides: puckData (which contains components array, props overrides)
 * - tenantOverrides: tenant theme tokens (optional - override template.tokens)
 
 *  Notes on override model:

 * - Tenant overrides intended to change theme tokens, default props, or swap components
 * - Page overrides only change page-level blocks and props
 * - Restrict tenantOverrides via Payload admin permissions (only admin role allowed)
 */


export function mergeTemplateWithPage(baseTemplate: any, tenantOverrides: any, pageOverrides: any) {
  const normalizedTemplate = normalizeTemplate(baseTemplate || {});
  const merged = deepmerge.all([normalizedTemplate, tenantOverrides || {}, pageOverrides || {}], { arrayMerge });
  return merged;
}
