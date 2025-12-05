/**
 * normalize-snapshot.ts
 * - Prunes editor-only metadata
 * - Produces lean Puck-ready shape:
 *   { templateId, version, tokens, tree: [ { id,type,props,children } ], meta }
 *
 * Keep this conservative and safe: remove functions, remove admin-only fields.
 */

export function normalizeSnapshot(snapshot: any) {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;

  function stripNode(node: any): any {
    if (!node || typeof node !== 'object') return node;
    const { id, type, props, children } = node;
    const safeProps: any = {};
    if (props && typeof props === 'object') {
      for (const k of Object.keys(props)) {
        const v = props[k];
        // drop any functions / prototypes / editor-only markers
        if (typeof v === 'function') continue;
        if (k === '__editorMeta') continue;
        safeProps[k] = v;
      }
    }
    return {
      id: id ?? undefined,
      type,
      props: safeProps,
      children: Array.isArray(children) ? children.map(stripNode) : [],
    };
  }

  const out: any = {
    templateId: snapshot.templateId ?? snapshot.slug ?? snapshot.name ?? 'unknown',
    version: snapshot.version ?? snapshot.updatedAt ?? Date.now(),
    tokens: snapshot.tokens ?? snapshot.themeTokens ?? {},
    meta: Object.assign({}, snapshot.meta ?? {}, { normalizedAt: new Date().toISOString() }),
    tree: Array.isArray(snapshot.components) ? snapshot.components.map(stripNode) : (snapshot.tree ? (Array.isArray(snapshot.tree) ? snapshot.tree.map(stripNode) : [stripNode(snapshot.tree)]) : []),
  };

  return out;
}
