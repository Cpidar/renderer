// pages/api/revalidate.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = req.query.secret || req.headers['x-revalidate-secret']
  if (secret !== process.env.REVALIDATE_SECRET) return res.status(401).json({ ok: false })
  const path = Array.isArray(req.query.path) ? req.query.path[0] : (req.query.path as string)
  try {
    // Next 13+: use res.revalidate
    // @ts-ignore
    if (res.revalidate) await res.revalidate(path || '/')
    // fallback older
    // @ts-ignore
    if (res.unstable_revalidate) await res.unstable_revalidate(path || '/')
    return res.json({ revalidated: true, path })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'failed' })
  }
}
