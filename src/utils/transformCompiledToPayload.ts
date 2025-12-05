export function transformCompiledToPayload({ snapshot, tenantId }: { snapshot: any, tenantId: string }) {
  // snapshot: normalized template snapshot (tree, meta, sampleProducts)
  const pages = [
    {
      tenant: tenantId,
      slug: '/',
      title: 'Home',
      puckData: snapshot.tree,
      templateVersion: snapshot.version,
      published: true,
    }
  ];

  const products = (snapshot.sampleProducts || []).map((p: any) => ({
    tenant: tenantId,
    name: p.title,
    slug: p.slug,
    price: p.price,
    description: p.description,
    images: p.image ? [{ src: p.image }] : [],
    templateVersion: snapshot.version,
    published: true,
  }));

  const templateSettings = {
    tenant: tenantId,
    templateId: snapshot.id ?? snapshot.templateId,
    version: snapshot.version,
    meta: snapshot.meta ?? {},
  };

  const templateComponents = (snapshot.components || []).map((c: any) => ({
    template: snapshot.id,
    slug: c.slug || c.type || c.id,
    props: c.props || {},
    style: c.style || {},
  }));

  return { pages, products, templateSettings, templateComponents };
}
