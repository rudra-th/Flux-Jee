/// <reference types="node" />
/**
 * Shared serverless helpers for the AI endpoints.
 *
 * Security: provider API keys live ONLY in environment variables
 * (set via `vercel env add` / `.env.local` for local dev). They are never
 * bundled into the client. Callers may optionally send their own Gemini key
 * via the `x-api-key` header (stored only in their own browser), which
 * overrides the server key for that single request.
 */

export type AiProvider = 'gemini' | 'groq' | 'openrouter'

export const PROVIDER: AiProvider = (process.env.AI_PROVIDER ?? 'gemini') as AiProvider
export const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS ?? 4096)
export const TEMPERATURE = Number(process.env.AI_TEMPERATURE ?? 0.4)

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
export const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct:free'

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

/** The server-side key for the active provider (never the client header). */
export function serverKey(): string | null {
  const env =
    PROVIDER === 'groq'
      ? process.env.GROQ_API_KEY
      : PROVIDER === 'openrouter'
        ? process.env.OPENROUTER_API_KEY
        : process.env.GEMINI_API_KEY
  return env && env.trim() ? env.trim() : null
}

/** Effective key for a request: client's Gemini key (BYOK) or the server key. */
export function readKey(req: Request): string | null {
  if (PROVIDER === 'gemini') {
    const headerValue = header(req, 'x-api-key')
    if (headerValue && headerValue.trim()) return headerValue.trim()
  }
  return serverKey()
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

interface AiCallOptions {
  json?: boolean
  maxOutputTokens?: number
  temperature?: number
}

/**
 * Unified AI call that dispatches to the configured provider.
 * `key` is the effective key for Gemini (server or BYOK header).
 */
export async function callAI(
  key: string | null,
  system: string,
  user: string,
  opts: AiCallOptions = {},
): Promise<unknown> {
  if (PROVIDER === 'groq') return callGroq(system, user, opts)
  if (PROVIDER === 'openrouter') return callOpenRouter(system, user, opts)
  if (!key) throw new Error('No Gemini API key configured')
  return callGemini(key, system, user, opts)
}

/** Human-readable provider label for the Settings badge. */
export function providerLabel(): string {
  if (PROVIDER === 'groq') return 'Groq'
  if (PROVIDER === 'openrouter') return 'OpenRouter'
  return 'Gemini'
}

/**
 * Calls the Gemini generateContent REST API and returns the model text.
 * When `json` is true the model is instructed to emit pure JSON and the
 * parsed object is returned.
 */
async function callGemini(
  key: string,
  system: string,
  user: string,
  opts: AiCallOptions = {},
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
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  const text = await res.text()
  if (!res.ok) {
    throw apiError('Gemini', res.status, text)
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned a non-JSON response')
  }

  const candidate = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    ?.candidates?.[0]
  const parts = candidate?.content?.parts
  const reply = (parts ?? [])
    .map((p) => p.text ?? '')
    .filter((t) => t.length > 0)
    .join('\n')
    .trim()
  if (!reply) throw new Error('Gemini returned an empty response')

  if (!opts.json) return reply
  return parseJsonReply(reply)
}

/** OpenAI-compatible chat completion call (Groq). */
async function callGroq(
  system: string,
  user: string,
  opts: AiCallOptions = {},
): Promise<unknown> {
  const key = serverKey()
  if (!key) throw new Error('No Groq API key configured')
  return openAiCompatible('Groq', 'https://api.groq.com/openai/v1/chat/completions', GROQ_MODEL, key, system, user, opts)
}

/** OpenAI-compatible chat completion call (OpenRouter). */
async function callOpenRouter(
  system: string,
  user: string,
  opts: AiCallOptions = {},
): Promise<unknown> {
  const key = serverKey()
  if (!key) throw new Error('No OpenRouter API key configured')
  return openAiCompatible('OpenRouter', 'https://openrouter.ai/api/v1/chat/completions', OPENROUTER_MODEL, key, system, user, opts)
}

async function openAiCompatible(
  name: string,
  url: string,
  model: string,
  key: string,
  system: string,
  user: string,
  opts: AiCallOptions = {},
): Promise<unknown> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: opts.temperature ?? TEMPERATURE,
    max_tokens: opts.maxOutputTokens ?? MAX_TOKENS,
    ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) {
    throw apiError(name, res.status, text)
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`${name} returned a non-JSON response`)
  }

  const content = (data as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
    ?.content
  const reply = (content ?? '').trim()
  if (!reply) throw new Error(`${name} returned an empty response`)

  if (!opts.json) return reply
  return parseJsonReply(reply)
}

function apiError(name: string, status: number, text: string): Error & { status: number } {
  const err = new Error(`${name} API error ${status}: ${text.slice(0, 400)}`) as Error & { status: number }
  err.status = status
  return err
}

/** Strip markdown fences / surrounding prose and parse JSON from a model reply. */
export function parseJsonReply(reply: string): unknown {
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
