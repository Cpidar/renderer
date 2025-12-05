// apps/storefront/src/lib/tenant/__tests__/loadTenantPage.snapshot.test.ts

import { loadTenantPage } from "../../tenant/loadTenantPage";

import {
  fetchTenantById,
  fetchPageBySlug,
  fetchProductBySlug,
  fetchTemplateSnapshotFromPayload,
} from "../../data/payload";

import { safeDeserialize } from "../../puck/safeDeserialize";
import { mergeTemplateWithPage } from "../../templates/mergeEngine";
import { collectTypesFromPuck } from "../../puck/puckUtils";
import { preloadComponents } from "../../puck/componentRegistry.server";
import { getRedisJSON, setRedisJSON } from "../../cache";

// Mock dependencies
jest.mock("../../data/payload", () => ({
  fetchTenantById: jest.fn(),
  fetchPageBySlug: jest.fn(),
  fetchProductBySlug: jest.fn(),
  fetchTemplateSnapshotFromPayload: jest.fn(),
}));

jest.mock("../../puck/safeDeserialize", () => ({
  safeDeserialize: jest.fn((x) => x),
}));

jest.mock("../../templates/mergeEngine", () => ({
  mergeTemplateWithPage: jest.fn(() => ({ merged: true })),
}));

jest.mock("../../puck/puckUtils", () => ({
  collectTypesFromPuck: jest.fn(() => ["ComponentA"]),
}));

jest.mock("../../puck/componentRegistry.server", () => ({
  preloadComponents: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../cache", () => ({
  getRedisJSON: jest.fn(),
  setRedisJSON: jest.fn(),
}));

describe("loadTenantPage snapshot", () => {
  const tenantId = "tenant123";
  const path = "/products/lamp";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("matches snapshot for a typical tenant/page/product/template flow", async () => {
    const tenant = {
      id: tenantId,
      templateVersion: "tmpl1",
      templateOverrides: { color: "blue" },
    };
    const product = { id: "prod1", templateVersion: "tmpl1" };
    const page = { slug: path, puckData: { content: "json" }, templateVersion: "tmpl1" };
    const templateSnapshot = { version: "v1", layout: "grid" };

    (fetchTenantById as jest.Mock).mockResolvedValue(tenant);
    (fetchProductBySlug as jest.Mock).mockResolvedValue(product);
    (fetchPageBySlug as jest.Mock).mockResolvedValue(page);
    (fetchTemplateSnapshotFromPayload as jest.Mock).mockResolvedValue(templateSnapshot);

    const result = await loadTenantPage(tenantId, path, { useCache: false });

    expect(result).toMatchSnapshot();
  });
});