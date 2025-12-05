/**
 * Registry: componentType -> dynamic loader for the server.
 * Keep this list in sync with your components folder.
 * Add components lazily here. Keep this file small: only registrations (strings -> import()).
 * Only components used on a page will be imported (preload).
 */

export const registryMap: Record<string, () => Promise<any>> = {
  Hero: () => import('../../components/Hero'),
  Footer: () => import('../../components/Footer'),
  Page: () => import('../../components/Page'),
  ProductGrid: () => import('../../components/ProductGrid'),
  Section: () => import('../../components/Section'),
  Callout: () => import('../../components/Callout')
}

/**
 * preloadComponents(types: Set<string>)
 * Preloads server component modules for types used on the page.
 */

export async function preloadComponents(types: Set<string>) {
  const loaders: Promise<any>[] = []
  for (const t of types) {
    const l = registryMap[t]
    if (l) loaders.push(l())
  }
  await Promise.all(loaders)
}

/**
 * Attempt to load component for a Puck block type.
 * Returns: { Component } where Component is a React component (server export)
 */
export async function requireComponent(type: string) {
  const loader = registryMap[type]
  if (!loader) {
    // Optional: return a simple fallback component rather than throwing
    // return () => () => React.createElement('div', null, `[Missing block: ${type}]`)
    throw new Error(`Puck requireComponent: Unknown component type "${type}". Update requireComponent.server.ts registry.`)
  }
  const mod = await loader()
  // mod.default is the typical case; fallback to mod if default not present
  return mod?.default ?? mod
}
