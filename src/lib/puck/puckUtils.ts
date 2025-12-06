import { type Data } from '@measured/puck'; // Import official Puck Data type

export function collectTypesFromPuck(data: Data, set = new Set<string>()): Set<string> {
  if (!data) return set;

  set.add('Page');

  const collect = (content: Data['content']) => {
    for (const c of content || []) {
      if (c?.type) set.add(c.type);
      for (const key in c?.props || {}) {
        const val = c.props[key];
        if (Array.isArray(val) && val.length > 0 && val[0]?.type) {
          collect(val);
        }
      }
    }
  };

  collect(data.content);

  return set;
}