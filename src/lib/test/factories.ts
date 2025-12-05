// factories.ts
// Small, type-safe factories for Tenant / Page / Template / Product
// Usage: const tenant = tenantFactory({ slug: 'acme' });

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  template?: string;
  templateVersion?: string;
  themeTokens?: Record<string, any>;
  templateOverrides?: any;
};

export type Page = {
  id?: string;
  tenant: string;
  slug: string;
  title?: string;
  puckData?: any; // Puck JSON
  templateVersion?: string;
};

export type Template = {
  id?: string;
  slug: string;
  name: string;
  snapshot: any;
  defaults?: any;
  settings?: any;
};

export type Product = {
  id?: string;
  tenant: string;
  name: string;
  slug: string;
  price: number;
  description?: string;
  images?: Array<{ src: string }>;
  templateVersion?: string;
};

// Generic builder helper
function build<T>(defaults: T) {
  return (overrides?: Partial<T>): T => ({ ...(defaults as any), ...(overrides as any) });
}

export const tenantFactory = build<Tenant>({
  id: 'tenant-1',
  slug: 'tenant-1',
  name: 'Tenant One',
  domain: 'tenant1.local',
  template: 'modern-template',
  templateVersion: 'v1',
  themeTokens: {},
  templateOverrides: null,
});

export const pageFactory = (overrides?: Partial<Page>): Page =>
  build<Page>({
    id: 'page-home',
    tenant: 'tenant-1',
    slug: '/',
    title: 'Home',
    puckData: { components: [{ id: 'hero-1', type: 'HeroMain', props: { title: 'Hello' } }] },
    templateVersion: undefined,
  })(overrides);

export const templateFactory = (overrides?: Partial<Template>): Template =>
  build<Template>({
    id: 'template-1',
    slug: 'modern',
    name: 'Modern',
    snapshot: {
      templateId: 'modern',
      version: 'v1',
      components: [{ id: 'hero', type: 'HeroMain', props: {} }],
      defaults: {},
      settings: {},
    },
    defaults: {},
    settings: {},
  })(overrides);

export const productFactory = (overrides?: Partial<Product>): Product =>
  build<Product>({
    id: 'prod-1',
    tenant: 'tenant-1',
    name: 'Lamp',
    slug: 'lamp',
    price: 120,
    description: 'A lamp',
    images: [{ src: '/img/lamp.jpg' }],
  })(overrides);
