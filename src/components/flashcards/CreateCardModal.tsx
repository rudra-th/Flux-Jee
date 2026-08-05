import { useMemo, useState } from 'react'
import { Modal, Field, Select, Button, Icon, SegmentedControl, Textarea } from '@/components/ui'
import { SUBJECTS } from '@/constants/syllabus'
import type { SubjectId } from '@/types/core'
import type { FlashcardType } from '@/types/progress'
import { createFlashcard } from '@/engines/flashcards/engine'
import { useUIStore } from '@/stores/uiStore'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}

const TYPES: Array<{ value: FlashcardType; label: string }> = [
  { value: 'concept', label: 'Concept' },
  { value: 'formula', label: 'Formula' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'custom', label: 'Custom' },
]

export function CreateCardModal({ open, onClose, onCreated }: Props) {
  const pushToast = useUIStore((s) => s.pushToast)
  const [subject, setSubject] = useState<SubjectId>('physics')
  const [chapterId, setChapterId] = useState('')
  const [type, setType] = useState<FlashcardType>('concept')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [saving, setSaving] = useState(false)

  const chapters = useMemo(() => SUBJECTS.find((s) => s.id === subject)?.chapters ?? [], [subject])
  const chapter = useMemo(() => chapters.find((c) => c.id === chapterId), [chapters, chapterId])

  const canSave = front.trim().length > 0 && back.trim().length > 0

  const save = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const id = await createFlashcard({
        type,
        subject,
        chapter: chapter?.name ?? 'General',
        front: front.trim(),
        back: back.trim(),
        tags: [chapter?.name ?? 'General', 'custom'],
      })
      pushToast('Flashcard created', 'success')
      onCreated(id)
      setFront('')
      setBack('')
      onClose()
    } catch {
      pushToast('Could not save the flashcard', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create flashcard"
      subtitle="Write your own question and answer. Use $...$ or \\(...\\) for math."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} disabled={!canSave} onClick={() => void save()}>
            <Icon name="check" size={15} /> Create card
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Subject">
            <Select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value as SubjectId)
                setChapterId('')
              }}
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Chapter (optional)">
            <Select value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
              <option value="">General</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Card type">
          <SegmentedControl options={TYPES} value={type} onChange={setType} />
        </Field>

        <Field label="Question (front)">
          <Textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={2}
            placeholder="e.g. What is the derivative of $x^2$?"
          />
        </Field>

        <Field label="Answer (back)">
          <Textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={3}
            placeholder="e.g. $\\frac{d}{dx}x^2 = 2x$"
          />
        </Field>

        <p className="text-[11px] leading-relaxed text-text3">
          Your card is stored on this device like any other flashcard and will be due for review immediately (box 1).
        </p>
      </div>
    </Modal>
  )
}
