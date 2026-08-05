import { json, readKey, clientIp, rateLimited, callGemini, MODEL } from '../_shared.ts'

export const config = { maxDuration: 30 }

interface TutorMessage {
  role?: 'user' | 'assistant' | 'model'
  content?: string
}

interface QuestionContext {
  text?: string
  options?: Array<{ key?: string; text?: string }>
  correct?: string
  solution?: string
}

interface TutorRequest {
  messages?: TutorMessage[]
  question?: QuestionContext
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })
  const ip = clientIp(req)
  if (rateLimited(ip)) return json(429, { error: 'Too many requests. Try again shortly.' })

  const key = readKey(req)
  if (!key) return json(503, { error: 'AI is not configured on this deployment yet.' })

  let body: TutorRequest
  try {
    body = (await req.json()) as TutorRequest
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const messages = (body.messages ?? [])
    .map((m) => String(m.content ?? '').trim())
    .filter((m) => m.length > 0)
    .slice(-8)
  const q = body.question ?? {}
  if (messages.length === 0 && !q.text) {
    return json(400, { error: 'Nothing to ask about.' })
  }

  const system =
    'You are a patient, precise JEE tutor for Physics, Chemistry and Mathematics. ' +
    'You explain concepts step by step, always showing working and reasoning. ' +
    'Use LaTeX math inside $...$ delimiters for any expression (e.g. $E = mc^2$). ' +
    'Keep answers focused and readable (short paragraphs, numbered steps where helpful). ' +
    'If the user attached a question, answer it AND explain why the correct option is right ' +
    'and why the wrong ones are wrong. Never reveal the answer label unless asked to explain it.'

  const parts: string[] = []
  if (q.text) {
    let block = `ATTACHED QUESTION:\n${q.text}`
    if (q.options && q.options.length > 0) {
      block += `\nOPTIONS:\n${q.options.map((o) => `${o.key ?? '?'}. ${o.text ?? ''}`).join('\n')}`
    }
    if (q.correct) block += `\nCORRECT ANSWER: ${q.correct}`
    if (q.solution) block += `\nOFFICIAL SOLUTION: ${q.solution}`
    parts.push(block)
  }
  if (messages.length > 0) parts.push(messages.join('\n\n'))

  const prompt =
    parts.join('\n\n---\n\n') +
    '\n\n---\nRespond now. If the user asked a general question, just answer it conversationally.'

  let reply: string
  try {
    reply = (await callGemini(key, system, prompt, { temperature: 0.3 })) as string
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500
    return json(status >= 400 && status < 500 ? 502 : 500, {
      error: (err as Error).message,
    })
  }

  return json(200, { model: MODEL, reply })
}
