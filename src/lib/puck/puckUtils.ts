export function collectTypesFromPuck(puckJson: any, set = new Set<string>()) {
  if (!puckJson) return set
  const comps = puckJson.components || puckJson.blocks || []
  for (const c of comps) {
    if (c?.type) set.add(c.type)
    if (c?.children) {
      if (Array.isArray(c.children)) c.children.forEach((ch: any) => collectTypesFromPuck(ch, set))
      else collectTypesFromPuck(c.children, set)
    }
  }
  return set
}
