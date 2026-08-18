import { useEffect, useRef, useState } from 'react'
import { Button, Card, Icon, Textarea, EmptyState } from '@/components/ui'
import { RichText } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { aiTutorChat, AiError, type TutorMessage } from '@/services/ai'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const SUGGESTIONS = [
  'Explain Newton\u2019s second law with an example',
  'How do I apply the integration by parts formula?',
  'Walk me through the SN1 mechanism step by step',
  'What is the difference between AC and DC current?',
  'Derive the lens maker\u2019s formula',
  'How to balance redox equations quickly?',
]

interface ChatEntry {
  role: 'user' | 'assistant'
  content: string
}

export default function TutorPage() {
  const pushToast = useUIStore((s) => s.pushToast)
  const [messages, setMessages] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || busy) return
    setInput('')
    const next: ChatEntry[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setBusy(true)
    try {
      const history: TutorMessage[] = next.map((m) => ({ role: m.role, content: m.content }))
      const reply = await aiTutorChat({ messages: history })
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (err) {
      if (err instanceof AiError && err.status === 503) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content:
              'The AI assistant is not configured on this deployment yet. Add a server AI key in the project settings (or your own Gemini key in Settings → AI) and try again.',
          },
        ])
      } else if (err instanceof AiError) {
        pushToast(err.message, 'error')
      } else {
        pushToast('Failed to reach the AI assistant. Check your connection.', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Tutor"
        subtitle="Ask doubts, get step-by-step explanations in Physics, Chemistry and Maths"
      />

      <Card className="mx-auto flex max-w-3xl flex-col" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10">
            <EmptyState
              icon="brain"
              title="How can I help you today?"
              description="Ask any JEE doubt — from a formula to a full derivation — and get a step-by-step explanation."
            />
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="focus-ring rounded-full border border-border bg-surface2 px-3 py-1.5 text-xs text-text2 transition-colors hover:border-primary/50 hover:text-text"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-primary text-white'
                      : 'border border-border bg-surface2 text-text',
                  )}
                >
                  {m.role === 'user' ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  ) : (
                    <RichText content={m.content} paragraphs />
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface2 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text3" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text3 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text3 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="flex items-end gap-2 border-t border-border p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder="Ask a doubt… (Enter to send, Shift+Enter for a new line)"
            rows={1}
            className="max-h-40 flex-1 resize-none"
          />
          <Button onClick={() => void send()} loading={busy} className="shrink-0" size="lg">
            <Icon name="arrow-up-right" size={18} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
