// src/lib/puck/renderer.tsx
import React from 'react';

// import { renderToStaticMarkup } from 'react-dom/server';
import sanitizeHtml from 'sanitize-html';

import { blockKey, getRedisJSON } from '../cache';
import { requireComponent } from './componentRegistry.server';

/**
 * This renderer expects a normalized `puckJson`:
 * {
 *   components: [{ id, type, props, children }, ... ],
 *   tokens: { ... }
 * }
 *
 * It:
 * - preloads needed components
 * - for each block: check block-level cache -> if found stream it (return string wrapped)
 * - otherwise import component and render it (server-component),
 *   sanitize outputs for any dangerouslySetInnerHTML blocks
 *
 * NOTE: For pure React Server Component rendering, you typically return elements.
 * For block-level caching as 'HTML snippets' you'd need to render to string via renderToString
 * which can increase CPU. Use selectively for static blocks only.
 */

/**
 * Server-side Puck renderer using requireComponent.
 * Input: puckJson { components: [...] }
 */
export async function renderPuckToReactNodes(
  puckJson: any,
  tenantSlug: string,
  pageHash: string | null
): Promise<React.ReactNode[]> {
  const blocks = puckJson?.components || puckJson?.blocks || [];

  async function renderNode(node: any, idx = 0): Promise<React.ReactNode> {
    if (!node) return null;

    if (pageHash) {
      const cacheKey = blockKey(tenantSlug, pageHash, node.id || node.type);
      const cached = await getRedisJSON(cacheKey);
      if (cached && cached.html) {
        // Return a wrapper that injects HTML (server safe)
        return (
          <div
            key={cacheKey}
            dangerouslySetInnerHTML={{ __html: cached.html }}
          />
        );
      }
    }

    const Comp = await requireComponent(node.type);
    const props = { ...(node.props || {}) };

    if (props?.html) props.html = sanitizeHtml(props.html);

    const children = node.children || [];
    const renderedChildren = await Promise.all(
      children.map((c: any, i: number) => renderNode(c, i))
    );

    const element = React.createElement(Comp, { key: node.id || idx, ...props }, renderedChildren);

    // Optionally serialize element to HTML and store (requires renderToStaticMarkup)
    // Tradeoff: storing HTML reduces server CPU but prevents partial streaming and RSC boundaries. Use for heavy repeated blocks (product grids).

    // if (cacheKey) {
    //   const html = renderToStaticMarkup(element);
    //   await setBlockCache(cacheKey, { html }, 60); // ttl
    // }
    return element;
  }

  const rendered = await Promise.all(blocks.map((b: any, i: number) => renderNode(b, i)));
  return rendered;
}

// Server component wrapper
export default async function PuckRenderer({
  puckJson,
  tenantSlug,
  pageHash
}: {
  puckJson: any;
  tenantSlug: string;
  pageHash: string | null;
}) {
  const nodes = await renderPuckToReactNodes(puckJson, tenantSlug, pageHash);
  return <div data-puck-root>{nodes}</div>;
}

// TODO: enhance by adding streaming via renderToPipeableStream and partial hydration boundaries ("use client").
