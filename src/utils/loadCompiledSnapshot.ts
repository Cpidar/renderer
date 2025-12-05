import fs from 'fs/promises';
import path from 'path';
import { normalizeSnapshot } from './normalizeSnapshot'; // create if not present or reuse your normalize

const SNAPSHOT_DIR = path.resolve(process.cwd(), 'templates', 'snapshots');
const COMPILED_DIR = path.resolve(process.cwd(), 'templates', 'compiled');

export async function loadCompiledSnapshot(templateId: string) {
  const compiledPath = path.join(COMPILED_DIR, `${templateId}.json`);
  try {
    const raw = await fs.readFile(compiledPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    // fallback to scanning snapshots
  }

  // scan snapshots for a matching templateId/slug/name
  const files = await fs.readdir(SNAPSHOT_DIR).catch(() => []);
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const p = path.join(SNAPSHOT_DIR, f);
    try {
      const raw = await fs.readFile(p, 'utf8');
      const j = JSON.parse(raw);
      const id = j.templateId ?? j.slug ?? j.name ?? f.replace('.json', '');
      if (String(id) === String(templateId)) {
        // normalize / compile on the fly
        const normalized = normalizeSnapshot(j);
        // attempt to write compiled
        try {
          await fs.mkdir(COMPILED_DIR, { recursive: true });
          await fs.writeFile(path.join(COMPILED_DIR, `${templateId}.json`), JSON.stringify(normalized), 'utf8');
        } catch (e) { /* ignore */ }
        return normalized;
      }
    } catch (e) { /* ignore per-file parse errors */ }
  }

  throw new Error(`Template "${templateId}" not found in compiled or snapshots`);
}
