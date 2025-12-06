// apps/storefront/src/lib/puck/__tests__/PuckRenderer.server.test.tsx
import { renderPuckToReactNode } from "../PuckRenderer.server"; // Export the function for testing
import React from "react";
import { renderToString } from "react-dom/server";
import { type Data } from "@measured/puck";
import { requireComponent } from "../componentRegistry.server";
import { getRedisJSON } from "@/lib/cache";

// Mock dependencies
jest.mock("../componentRegistry.server", () => ({
  requireComponent: jest.fn((type) =>
    type === "Page"
      ? ({ children }: { children: any }) => <div>{children}</div>
      : ({ props }: { props: any }) => <span>{props.title}</span>
  ),
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
    const html = renderToString(<>{node}</>);
    expect(html).toContain("<span>Welcome</span>");
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
    const html = renderToString(<>{node}</>);
    expect(html).toContain("<span>Nested</span>");
  });

  it("should use cache if available", async () => {
    (requireComponent as any).mockImplementation((type: string) => {
      const Component = () => <div>{type}</div>;
      Component.displayName = `Component_${type}`;
      return Component;
    });
    (getRedisJSON as any).mockResolvedValue({
      html: "<cached>Content</cached>",
    });
    const data: Data = {
      content: [{ type: "Hero", props: { id: "1" } }],
      root: {},
    };
    const node = await renderPuckToReactNode(data, "slug", "hash");
    const html = renderToString(<>{node}</>);
    expect(html).toContain("<cached>Content</cached>");
  });

  // Add tests for sanitization, root props, errors
});
