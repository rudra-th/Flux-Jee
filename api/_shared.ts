/// <reference types="node" />
/**
 * Shared serverless helpers for the Gemini AI endpoints.
 *
 * Security: the Gemini API key lives ONLY in `process.env.GEMINI_API_KEY`
 * (set via `vercel env add GEMINI_API_KEY` / `.env.local` for local dev).
 * It is never bundled into the client. Callers may optionally send their own
 * key via the `x-api-key` header (stored only in their own browser), which
 * overrides the server key for that single request.
 */

export const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
export const MAX_TOKENS = Number(process.env.GEMINI_MAX_TOKENS ?? 4096)
export const TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE ?? 0.4)

export const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

/** Reads a header from either a WHATWG Headers instance or a plain object. */
export function header(req: Request, name: string): string | null {
  const lower = name.toLowerCase()
  const h = req.headers as unknown
  if (h && typeof (h as { get?: unknown }).get === 'function') {
    return (h as Headers).get(name)
  }
  const raw = (h as Record<string, unknown>)[lower]
  if (raw == null) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return String(raw)
}

export function readKey(req: Request): string | null {
  const headerValue = header(req, 'x-api-key')
  if (headerValue && headerValue.trim()) return headerValue.trim()
  const env = process.env.GEMINI_API_KEY
  return env && env.trim() ? env.trim() : null
}

export function clientIp(req: Request): string {
  const fwd = header(req, 'x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown'
  return header(req, 'x-real-ip') ?? 'unknown'
}

/** Very light per-IP rate limit (best-effort; Vercel instances are ephemeral). */
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20
const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimited(ip: string): boolean {
  const now = Date.now()
  const hit = hits.get(ip)
  if (!hit || now > hit.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  hit.count += 1
  return hit.count > MAX_PER_WINDOW
}

interface GeminiOptions {
  json?: boolean
  maxOutputTokens?: number
  temperature?: number
}

/**
 * Calls the Gemini generateContent REST API and returns the model text.
 * When `json` is true the model is instructed to emit pure JSON and the
 * parsed object is returned.
 */
export async function callGemini(
  key: string,
  system: string,
  user: string,
  opts: GeminiOptions = {},
): Promise<unknown> {
  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${system}\n\n${user}` }],
      },
    ],
    generationConfig: {
      temperature: opts.temperature ?? TEMPERATURE,
      maxOutputTokens: opts.maxOutputTokens ?? MAX_TOKENS,
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
    },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  const text = await res.text()
  if (!res.ok) {
    const err = new Error(`Gemini API error ${res.status}: ${text.slice(0, 400)}`)
    ;(err as Error & { status?: number }).status = res.status
    throw err
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned a non-JSON response')
  }

  const parts = extractParts(data)
  const reply = parts.join('\n').trim()
  if (!reply) throw new Error('Gemini returned an empty response')

  if (!opts.json) return reply
  return parseJsonReply(reply)
}

function extractParts(data: unknown): string[] {
  const candidate = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    ?.candidates?.[0]
  const parts = candidate?.content?.parts
  if (!parts) return []
  return parts.map((p) => p.text ?? '').filter((t) => t.length > 0)
}

/** Strip markdown fences / surrounding prose and parse JSON from a model reply. */
function parseJsonReply(reply: string): unknown {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/)
  const target = fenced ? fenced[1] ?? reply : reply
  const start = target.indexOf('{')
  const end = target.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(target.slice(start, end + 1))
    } catch {
      // fall through to a direct attempt
    }
  }
  return JSON.parse(target)
}
