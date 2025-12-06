// apps/storefront/src/lib/tenant/__tests__/loadTenantPage.test.ts
import { loadTenantPage } from '../loadTenantPage';

// Mock dependencies
jest.mock('../../data/payload', () => ({
  fetchTenantById: jest.fn(),
  fetchPageBySlug: jest.fn(),
  fetchProductBySlug: jest.fn(),
  fetchTemplateSnapshotFromPayload: jest.fn(),
}));

jest.mock('../../puck/safeDeserialize', () => ({
  safeDeserialize: jest.fn((data) => data),
}));

jest.mock('../../templates/mergeEngine', () => ({
  mergeTemplateWithPage: jest.fn((template, overrides, pageData) => ({ ...template, ...overrides, ...pageData })),
}));

jest.mock('../../puck/puckUtils', () => ({
  collectTypesFromPuck: jest.fn(() => new Set(['Hero'])),
}));

jest.mock('../../puck/componentRegistry.server', () => ({
  preloadComponents: jest.fn(),
}));

jest.mock('../../cache', () => ({
  getRedisJSON: jest.fn(),
  setRedisJSON: jest.fn(),
}));

import {
  fetchTenantById,
  fetchPageBySlug,
  fetchProductBySlug,
  fetchTemplateSnapshotFromPayload,
} from '../../data/payload';
import { safeDeserialize } from '../../puck/safeDeserialize';
import { mergeTemplateWithPage } from '../../templates/mergeEngine';
import { collectTypesFromPuck } from '../../puck/puckUtils';
import { preloadComponents } from '../../puck/componentRegistry.server';
import { getRedisJSON, setRedisJSON } from '../../cache';

describe('loadTenantPage', () => {
  it('should return nulls if tenant not found', async () => {
    (fetchTenantById as any).mockResolvedValue(null);
    const result = await loadTenantPage('slug', '/');
    expect(result.tenant).toBeNull();
    expect(result.cacheHit).toBe(false);
  });

  it('should load from cache if available', async () => {
    (fetchTenantById as any).mockResolvedValue({ slug: 'test' });
    (getRedisJSON as any).mockResolvedValue({ merged: {}, pageHash: 'hash' });
    const result = await loadTenantPage('test', '/');
    expect(result.cacheHit).toBe(true);
    expect(result.merged).toEqual({});
  });

  it('should fetch and merge data without cache', async () => {
    (fetchTenantById as any).mockResolvedValue({ slug: 'test', template: 'temp1' });
    (fetchProductBySlug as any).mockResolvedValue(null);
    (fetchPageBySlug as any).mockResolvedValue({ puckData: { content: [] } });
    (fetchTemplateSnapshotFromPayload as any).mockResolvedValue({ content: [] });
    (safeDeserialize as any).mockImplementation((d: any) => d);
    (mergeTemplateWithPage as any).mockReturnValue({ content: [] });
    (collectTypesFromPuck as any).mockReturnValue(new Set());
    (preloadComponents as any).mockResolvedValue(undefined);
    (setRedisJSON as any).mockResolvedValue(undefined);

    const result = await loadTenantPage('test', '/');
    expect(result.cacheHit).toBe(false);
    expect(result.merged).toEqual({ content: [] });
    expect(result.pageHash).toBeDefined();
  });

  // Add more tests for preview mode, product priority, errors, etc.
});