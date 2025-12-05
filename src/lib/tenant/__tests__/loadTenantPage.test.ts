/**
 * @jest-environment node
 */
import crypto from "crypto";
import { loadTenantPage } from "../loadTenantPage";

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

import { fetchTenantById, fetchPageBySlug, fetchProductBySlug, fetchTemplateSnapshotFromPayload } from "../../data/payload";
import { safeDeserialize } from "../../puck/safeDeserialize";
import { mergeTemplateWithPage } from "../../templates/mergeEngine";
import { collectTypesFromPuck } from "../../puck/puckUtils";
import { preloadComponents } from "../../puck/componentRegistry.server";
import { getRedisJSON, setRedisJSON } from "../../cache";

describe("loadTenantPage", () => {
  const tenantId = "tenant123";
  const path = "/products/lamp";

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it("returns cached result when cache hit", async () => {
    const tenant = { id: tenantId };
    (fetchTenantById as jest.Mock).mockResolvedValue(tenant);
    (getRedisJSON as jest.Mock).mockResolvedValue({
      page: { slug: path },
      product: { id: "prod1" },
      templateSnapshot: { version: "v1" },
      merged: { merged: true },
      pageHash: "abc123",
    });

    const result = await loadTenantPage(tenantId, path, { useCache: true });

    expect(result.cacheHit).toBe(true);
    expect(result.page?.slug).toBe(path);
    expect(result.product?.id).toBe("prod1");
    expect(result.pageHash).toBe("abc123");
  });


  it("returns nulls if tenant not found", async () => {
    (fetchTenantById as jest.Mock).mockResolvedValue(null);

    const result = await loadTenantPage(tenantId, path);

    expect(result).toEqual({
      tenant: null,
      page: null,
      product: null,
      templateSnapshot: null,
      merged: null,
      pageHash: null,
      cacheHit: false,
    });
  });

  it("fetches fresh data when cache miss", async () => {
    const tenant = { id: tenantId, templateVersion: "tmpl1" };
    const product = { id: "prod1" };
    const page = { slug: path, puckData: { content: "json" } };
    const templateSnapshot = { version: "v1" };

    (fetchTenantById as jest.Mock).mockResolvedValue(tenant);
    (getRedisJSON as jest.Mock).mockResolvedValue(null);
    (fetchProductBySlug as jest.Mock).mockResolvedValue(product);
    (fetchPageBySlug as jest.Mock).mockResolvedValue(page);
    (fetchTemplateSnapshotFromPayload as jest.Mock).mockResolvedValue(templateSnapshot);

    const result = await loadTenantPage(tenantId, path, { useCache: true });

    expect(result.tenant).toEqual(tenant);
    expect(result.product).toEqual(product);
    expect(result.page).toEqual(page);
    expect(result.templateSnapshot).toEqual(templateSnapshot);
    expect(result.merged).toEqual({ merged: true });
    expect(typeof result.pageHash).toBe("string");
    expect(result.cacheHit).toBe(false);

    expect(setRedisJSON).toHaveBeenCalled();
    expect(preloadComponents).toHaveBeenCalledWith(["ComponentA"]);
  });

  it("calls mergeTemplateWithPage with templateSnapshot, tenantOverrides, and pageData", async () => {
    const tenant = {
      id: tenantId,
      templateVersion: "tmpl1",
      templateOverrides: { color: "blue" },
    };
    const page = { slug: path, puckData: { content: "json" } };
    const product = { id: "prod1" };
    const templateSnapshot = { version: "v1" };

    (fetchTenantById as jest.Mock).mockResolvedValue(tenant);
    (getRedisJSON as jest.Mock).mockResolvedValue(null);
    (fetchProductBySlug as jest.Mock).mockResolvedValue(product);
    (fetchPageBySlug as jest.Mock).mockResolvedValue(page);
    (fetchTemplateSnapshotFromPayload as jest.Mock).mockResolvedValue(templateSnapshot);

    await loadTenantPage(tenantId, path);

    expect(mergeTemplateWithPage).toHaveBeenCalledWith(
      templateSnapshot,
      tenant.templateOverrides,
      page.puckData
    );
  });

  it("falls back to tenant.themeTokens if templateOverrides not present", async () => {
    const tenant = {
      id: tenantId,
      templateVersion: "tmpl1",
      themeTokens: { font: "serif" },
    };
    const page = { slug: path, puckData: { content: "json" } };
    const templateSnapshot = { version: "v1" };

    (fetchTenantById as jest.Mock).mockResolvedValue(tenant);
    (getRedisJSON as jest.Mock).mockResolvedValue(null);
    (fetchProductBySlug as jest.Mock).mockResolvedValue(null);
    (fetchPageBySlug as jest.Mock).mockResolvedValue(page);
    (fetchTemplateSnapshotFromPayload as jest.Mock).mockResolvedValue(templateSnapshot);

    await loadTenantPage(tenantId, path);

    expect(mergeTemplateWithPage).toHaveBeenCalledWith(
      templateSnapshot,
      tenant.themeTokens,
      page.puckData
    );
  });

  it("handles safeDeserialize errors gracefully", async () => {
    const tenant = { id: tenantId };
    const page = { slug: path, puckData: "{bad json}" };

    (fetchTenantById as jest.Mock).mockResolvedValue(tenant);
    (getRedisJSON as jest.Mock).mockResolvedValue(null);
    (fetchProductBySlug as jest.Mock).mockResolvedValue(null);
    (fetchPageBySlug as jest.Mock).mockResolvedValue(page);
    (safeDeserialize as jest.Mock).mockImplementation(() => {
      throw new Error("bad json");
    });

    const result = await loadTenantPage(tenantId, path);

    expect(result.page).toEqual(page);
    expect(result.merged).toEqual({ merged: true });
  });

  // test("fetches tenant, page, template and caches merged result", async () => {
  //   (getRedisJSON as jest.Mock).mockResolvedValue(null);

  //   const mockTenant = { id: "t1", hostname: HOST };
  //   const mockPage = { content: [{ type: "hero", text: "Hello" }] };
  //   const mockTemplate = { components: [{ type: "footer" }] };

  //   (payloadHelpers.fetchTenantById as jest.Mock).mockResolvedValue(mockTenant);
  //   (payloadHelpers.fetchPageBySlug as jest.Mock).mockResolvedValue(mockPage);
  //   (payloadHelpers.fetchTemplateSnapshotFromPayload as jest.Mock).mockResolvedValue(mockTemplate);

  //   const result = await loadTenantPage(HOST, SLUG);

  //   expect(payloadHelpers.fetchTenantById).toHaveBeenCalledWith(HOST);
  //   expect(payloadHelpers.fetchPageBySlug).toHaveBeenCalledWith("t1", SLUG);
  //   expect(payloadHelpers.fetchTemplateSnapshotFromPayload).toHaveBeenCalledWith("t1");

  //   const expectedMerged = {
  //     tenant: mockTenant,
  //     page: mockPage.content,
  //     template: mockTemplate.components,
  //   };

  //   expect(setRedisJSON).toHaveBeenCalledWith(
  //     CACHE_KEY,
  //     JSON.stringify(expectedMerged),
  //     "EX",
  //     60
  //   );

  //   expect(result).toEqual(expectedMerged);
  // });

  // test("handles missing page gracefully (page = null)", async () => {
  //   (getRedisJSON as jest.Mock).mockResolvedValue(null);

  //   const mockTenant = { id: "t42", hostname: HOST };
  //   const mockTemplate = { components: [{ type: "banner" }] };

  //   (payloadHelpers.fetchTenantById as jest.Mock).mockResolvedValue(mockTenant);
  //   (payloadHelpers.fetchPageBySlug as jest.Mock).mockResolvedValue(null);
  //   (payloadHelpers.fetchTemplateSnapshotFromPayload as jest.Mock).mockResolvedValue(mockTemplate);

  //   const result = await loadTenantPage(HOST, SLUG);

  //   expect(result.page).toBeNull();
  //   expect(result.templateSnapshot).toEqual(mockTemplate.components);
  // });
});
