import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, Button, Badge, Icon, EmptyState, Chip, Modal, Input, Textarea, Field } from '@/components/ui'
import { db } from '@/db'
import { Latex } from '@/components/ui'
import { SUBJECTS } from '@/constants/syllabus'
import type { SubjectId } from '@/types/core'
import type { FormulaSheet } from '@/types/progress'
import { randomId } from '@/utils/cn'
import { PageHeader } from '@/components/layout/AppShell'

export default function FormulasPage() {
  const [subject, setSubject] = useState<SubjectId>('physics')
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [chapter, setChapter] = useState('')

  const { data: sheets = [], refetch } = useQuery({
    queryKey: ['formulas', subject],
    queryFn: () => db.formulaSheets.where('subject').equals(subject).toArray(),
  })

  const current = sheets.find((s) => s.id === sheetId) ?? null

  const addSheet = async () => {
    if (!title.trim()) return
    const sheet: FormulaSheet = {
      id: randomId('fs-'),
      subject,
      chapter: chapter || 'General',
      title: title.trim(),
      formulas: [],
      createdAt: new Date().toISOString(),
    }
    await db.formulaSheets.put(sheet)
    setSheetId(sheet.id)
    setCreating(false)
    setTitle('')
    setChapter('')
    await refetch()
  }

  const addFormula = async (name: string, latex: string, note?: string) => {
    if (!current) return
    await db.formulaSheets.put({
      ...current,
      formulas: [...current.formulas, { id: randomId('fi-'), name, latex, note }],
    })
    await refetch()
  }

  const removeFormula = async (fid: string) => {
    if (!current) return
    await db.formulaSheets.put({ ...current, formulas: current.formulas.filter((f) => f.id !== fid) })
    await refetch()
  }

  const removeSheet = async () => {
    if (!current) return
    await db.formulaSheets.delete(current.id)
    setSheetId(null)
    await refetch()
  }

  return (
    <div>
      <PageHeader
        title="Formula Sheets"
        subtitle="Your consolidated revision sheets, rendered with LaTeX"
        action={<Button size="sm" onClick={() => setCreating(true)}><Icon name="plus" size={15} /> New Sheet</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {SUBJECTS.map((s) => (
          <Chip key={s.id} selected={subject === s.id} onClick={() => { setSubject(s.id); setSheetId(null) }}>
            {s.name}
          </Chip>
        ))}
      </div>

      {!current && (
        <>
          {!sheets.length && (
            <EmptyState icon="formula" title="No formula sheets" description="Create a revision sheet for your favourite formulas, laws and theorems." />
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map((s) => (
              <Card key={s.id} className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => setSheetId(s.id)}>
                <div className="p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-semibold text-text">{s.title}</h3>
                    <Badge tone="muted">{s.formulas.length}</Badge>
                  </div>
                  <p className="text-xs text-text3">{s.chapter}</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {current && <FormulaSheetView sheet={current} onAdd={addFormula} onRemove={removeFormula} onBack={() => setSheetId(null)} onDelete={() => void removeSheet()} />}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Formula Sheet">
        <div className="space-y-3">
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kinematics Formulas" /></Field>
          <Field label="Chapter"><Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Kinematics" /></Field>
          <Button onClick={() => void addSheet()} className="w-full" disabled={!title.trim()}>Create</Button>
        </div>
      </Modal>
    </div>
  )
}

function FormulaSheetView({
  sheet,
  onAdd,
  onRemove,
  onBack,
  onDelete,
}: {
  sheet: FormulaSheet
  onAdd: (name: string, latex: string, note?: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onBack: () => void
  onDelete: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [latex, setLatex] = useState('')
  const [note, setNote] = useState('')

  const add = async () => {
    if (!name.trim() || !latex.trim()) return
    await onAdd(name.trim(), latex.trim(), note.trim() || undefined)
    setName(''); setLatex(''); setNote(''); setAdding(false)
  }

  return (
    <div>
      <Card className="mb-4 p-0">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}><Icon name="chevron-left" size={16} /></Button>
            <div>
              <h3 className="font-bold text-text">{sheet.title}</h3>
              <p className="text-xs text-text3">{sheet.chapter} · {sheet.formulas.length} formulas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAdding((a) => !a)}><Icon name="plus" size={14} /> Add</Button>
            <Button size="sm" variant="ghost" onClick={onDelete}><Icon name="trash" size={14} /></Button>
          </div>
        </div>
      </Card>

      {adding && (
        <Card className="mb-4">
          <CardHeader title="Add Formula" />
          <div className="space-y-3 px-5 pb-5">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Equation of motion (1st)" /></Field>
            <Field label="LaTeX"><Input value={latex} onChange={(e) => setLatex(e.target.value)} placeholder="e.g. v = u + at" /></Field>
            <Field label="Note (optional)"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <Button onClick={() => void add()} className="w-full" disabled={!name.trim() || !latex.trim()}>Add Formula</Button>
          </div>
        </Card>
      )}

      {sheet.formulas.length === 0 && !adding && (
        <EmptyState icon="formula" title="No formulas yet" description="Add your first formula using the Add button above." />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {sheet.formulas.map((f) => (
          <Card key={f.id} className="relative">
            <button className="absolute right-3 top-3 text-text3 transition-colors hover:text-danger" onClick={() => void onRemove(f.id)} aria-label="Remove formula">
              <Icon name="x" size={14} />
            </button>
            <div className="p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">{f.name}</p>
              <div className="overflow-x-auto rounded-lg bg-surface2 px-4 py-3 text-center text-base text-text">
                <Latex latex={f.latex} display />
              </div>
              {f.note && <p className="mt-2 text-xs text-text3">{f.note}</p>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
