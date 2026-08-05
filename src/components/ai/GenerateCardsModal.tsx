import { useMemo, useState } from 'react'
import { Modal, Field, Select, Button, Icon, SegmentedControl } from '@/components/ui'
import { SUBJECTS } from '@/constants/syllabus'
import type { SubjectId } from '@/types/core'
import { aiGenerateCards, AiError } from '@/services/ai'
import { saveAiFlashcards } from '@/engines/flashcards/engine'
import { useUIStore } from '@/stores/uiStore'

interface Props {
  open: boolean
  onClose: () => void
  onGenerated: (count: number) => void
}

export function GenerateCardsModal({ open, onClose, onGenerated }: Props) {
  const pushToast = useUIStore((s) => s.pushToast)
  const [subject, setSubject] = useState<SubjectId>('physics')
  const [chapterId, setChapterId] = useState('')
  const [count, setCount] = useState(6)
  const [busy, setBusy] = useState(false)

  const chapters = useMemo(() => SUBJECTS.find((s) => s.id === subject)?.chapters ?? [], [subject])
  const chapter = useMemo(() => chapters.find((c) => c.id === chapterId), [chapters, chapterId])

  const generate = async () => {
    if (!chapter) return
    setBusy(true)
    try {
      const cards = await aiGenerateCards({
        subject: SUBJECTS.find((s) => s.id === subject)?.name ?? subject,
        chapter: chapter.name,
        count,
      })
      const created = await saveAiFlashcards(
        cards.map((c) => ({ type: c.type, subject, chapter: chapter.name, front: c.front, back: c.back })),
      )
      pushToast(`Generated ${created} AI flashcards`, 'success')
      onGenerated(created)
      onClose()
    } catch (err) {
      if (err instanceof AiError && err.status === 503) {
        pushToast('AI is not configured on this deployment yet', 'warning')
      } else if (err instanceof AiError) {
        pushToast(err.message, 'error')
      } else {
        pushToast('Failed to generate flashcards. Check your connection.', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="AI Flashcards"
      subtitle="Generate concept, formula and reaction cards for a chapter"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} disabled={!chapter} onClick={() => void generate()}>
            <Icon name="sparkles" size={15} /> Generate
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Subject">
          <Select value={subject} onChange={(e) => {
            setSubject(e.target.value as SubjectId)
            setChapterId('')
          }}>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Chapter">
          <Select value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
            <option value="">Select a chapter…</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cards to generate">
          <SegmentedControl
            options={[
              { value: '4', label: '4' },
              { value: '6', label: '6' },
              { value: '8', label: '8' },
              { value: '10', label: '10' },
            ]}
            value={String(count)}
            onChange={(v) => setCount(Number(v))}
          />
        </Field>
        <p className="text-[11px] leading-relaxed text-text3">
          AI-generated cards are stored in your device like any other flashcard. You can delete them from your deck at
          any time.
        </p>
      </div>
    </Modal>
  )
}
