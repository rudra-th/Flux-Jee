import { json, readKey, clientIp, rateLimited, callGemini, MODEL } from '../_shared.js'

export const config = { maxDuration: 30 }

const TYPES = ['concept', 'formula', 'reaction'] as const

interface CardRequest {
  subject?: string
  chapter?: string
  count?: number
}

export async function POST(req: Request): Promise<Response> {
  const ip = clientIp(req)
  if (rateLimited(ip)) return json(429, { error: 'Too many requests. Try again shortly.' })

  const key = readKey(req)
  if (!key) return json(503, { error: 'AI is not configured on this deployment yet.' })

  let body: CardRequest
  try {
    body = (await req.json()) as CardRequest
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const subject = body.subject?.trim()
  const chapter = body.chapter?.trim()
  if (!subject || !chapter) return json(400, { error: 'subject and chapter are required' })

  const count = Math.min(Math.max(Math.floor(body.count ?? 6), 3), 12)

  const system =
    'You generate concise JEE Main/Advanced revision flashcards from the official JEE syllabus. ' +
    'Return ONLY a JSON object (no markdown fences, no commentary) of the form ' +
    `{"cards":[{"type":"concept|formula|reaction","front":"...","back":"..."}]} ` +
    'Rules: ' +
    '- front is a short prompt/question, back is the crisp answer (1-3 sentences). ' +
    '- Use LaTeX math inside $...$ delimiters when notation is needed (e.g. $F = ma$). ' +
    '- Exactly the requested number of cards, mixing concept/formula/reaction types as appropriate. ' +
    '- Cover the most exam-worthy facts of that chapter; never fabricate formulas.'

  const user = `Subject: ${subject}\nChapter: ${chapter}\nGenerate ${count} flashcards.`

  let data: { cards?: Array<{ type?: string; front?: string; back?: string }> }
  try {
    data = (await callGemini(key, system, user, { json: true })) as typeof data
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500
    return json(status >= 400 && status < 500 ? 502 : 500, {
      error: (err as Error).message,
    })
  }

  const cards = (data?.cards ?? [])
    .filter((c) => c && c.front && c.back)
    .map((c) => ({
      type: (TYPES as readonly string[]).includes(String(c.type ?? '')) ? c.type : 'concept',
      front: String(c.front).trim(),
      back: String(c.back).trim(),
    }))
    .slice(0, count)

  if (cards.length === 0) return json(502, { error: 'The model returned no usable flashcards.' })
  return json(200, { model: MODEL, cards })
}
