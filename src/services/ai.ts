import { useSettingsStore } from '@/stores/settingsStore'

/**
 * Client-side wrapper for the AI serverless endpoints.
 *
 * The server key is kept in env vars on the backend (AI_PROVIDER + the
 * provider's key) and is never shipped to the browser. If the user provides
 * their own Gemini key in Settings it is stored only in their browser
 * (localStorage) and forwarded via the `x-api-key` header for that request.
 */

export type AiFlashcardType = 'concept' | 'formula' | 'reaction'

export interface AiGeneratedCard {
  type: AiFlashcardType
  front: string
  back: string
}

export interface TutorQuestionContext {
  text: string
  options?: Array<{ key: string; text: string }>
  correct?: string
  solution?: string
}

export interface TutorMessage {
  role: 'user' | 'assistant'
  content: string
}

export class AiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function userKey(): string | undefined {
  const key = useSettingsStore.getState().settings.geminiApiKey?.trim()
  return key || undefined
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const key = userKey()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(key ? { 'x-api-key': key } : {}),
    },
    body: JSON.stringify(body),
  })
  let data: { error?: string } | undefined
  try {
    data = (await res.json()) as { error?: string }
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    throw new AiError(data?.error ?? `Request failed (${res.status})`, res.status)
  }
  return data as T
}

export async function aiGenerateCards(req: {
  subject: string
  chapter: string
  count?: number
}): Promise<AiGeneratedCard[]> {
  const data = await post<{ cards?: AiGeneratedCard[] }>('/api/ai/cards', req)
  return data.cards ?? []
}

export async function aiTutorChat(req: {
  messages: TutorMessage[]
  question?: TutorQuestionContext
}): Promise<string> {
  const data = await post<{ reply?: string }>('/api/ai/tutor', req)
  return data.reply ?? ''
}

export interface AiHealth {
  configured: boolean
  provider?: string | null
}

export async function aiHealth(): Promise<AiHealth> {
  try {
    const res = await fetch('/api/ai/health')
    if (!res.ok) return { configured: false }
    const data = (await res.json()) as { configured?: boolean; provider?: string | null }
    return { configured: Boolean(data.configured), provider: data.provider ?? null }
  } catch {
    return { configured: false, provider: null }
  }
}

/** True when the user has entered their own key in Settings. */
export function hasUserAiKey(): boolean {
  return Boolean(userKey())
}
