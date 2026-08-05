import { json, readKey } from '../_shared.ts'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return json(405, { error: 'Method not allowed' })
  const configured = Boolean(readKey(req))
  return json(200, { configured })
}
