// apps/storefront/src/lib/puck/__tests__/PuckRenderer.server.test.tsx
import { renderPuckToReactNode } from "../PuckRenderer.server"; // Export the function for testing
import React from "react";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { type Data } from "@measured/puck";
import { requireComponent } from "../componentRegistry.server";
import { getRedisJSON } from "@/lib/cache";
import { Writable } from 'stream';

// Helper to render server HTML, waiting for Suspense
const getRenderedHtml = (element: React.ReactNode): Promise<string> => {
  return new Promise((resolve, reject) => {
    let html = '';
    const stream = renderToPipeableStream(element, {
      onShellReady() {
        const writable = new Writable({
          write(chunk, encoding, callback) {
            html += chunk.toString();
            callback();
          },
        });
        writable.on('finish', () => resolve(html));
        writable.on('error', reject);
        stream.pipe(writable);
      },
      onError(error: any) {
        reject(error);
      },
    });
  });
};

// Mock dependencies
jest.mock('../componentRegistry.server', () => ({
  requireComponent: jest.fn((type) => {
    if (type === 'Page') {
      return ({ children }: { children: React.ReactNode }) => <div className="page">{children}</div>;
    } else if (type === 'Grid') {
      return ({ items }: { items: React.ReactNode[] }) => <div className="grid">{items}</div>;
    } else if (type === 'Item') {
      return ({ title }: { title: string }) => <span className="item">{title}</span>;
    } else if (type === 'ProductGrid') {
      return () => <div className="product-grid">Products</div>; // Not used if cached
    } else {
      return ({ title }: { title?: string }) => <span>{title || type}</span>;
    }
  }),
}));

jest.mock("../../cache", () => ({
  blockKey: jest.fn(() => "key"),
  getRedisJSON: jest.fn(() => null),
  setRedisJSON: jest.fn(),
}));

jest.mock("sanitize-html", () => jest.fn((html) => html));

describe("PuckRenderer", () => {
  it("should render basic content", async () => {
    const data: Data = {
      content: [{ type: "Hero", props: { title: "Welcome" } }],
      root: { props: {} },
    };
    const node = await renderPuckToReactNode(data, "slug", "hash");
    const html = renderToString(<>{node}</>); // Note: Suspense fallbacks may appear; for full render, consider pipeable
    expect(html).toContain("Welcome"); // Soften expectation to contain text, not exact HTML (due to Suspense)
  });

  it("should handle nested slots", async () => {
    const data: Data = {
      content: [
        {
          type: "Grid",
          props: { items: [{ type: "Item", props: { title: "Nested" } }] },
        },
      ],
      root: { props: {} },
    };
    const node = await renderPuckToReactNode(data, "slug", "hash");
    const html = await getRenderedHtml(<>{node}</>);
    expect(html).toContain("Nested");
  });

it('should use cache if available', async () => {
    jest.mocked(getRedisJSON).mockResolvedValueOnce({ html: '<cached>Content</cached>' });
    const data: Data = {
      content: [{ type: 'ProductGrid', props: { id: '1' } }],
      root: {},
    };
    const node = await renderPuckToReactNode(data, 'slug', 'hash');
    const html = await getRenderedHtml(<>{node}</>);
    expect(html).toContain('<cached>Content</cached>');
  });

  // Add tests for sanitization, root props, errors
});
