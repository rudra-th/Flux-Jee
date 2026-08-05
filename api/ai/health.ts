import { json, readKey } from '../_shared.js'

export async function GET(req: Request): Promise<Response> {
  const configured = Boolean(readKey(req))
  return json(200, { configured })
}
