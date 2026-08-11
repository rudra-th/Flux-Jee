import { useEffect, useMemo, useState } from 'react'
import { Card, Button, Badge, Icon, EmptyState, Input, Chip, RichText } from '@/components/ui'
import { searchQuestions, searchCount } from '@/engines/search/engine'
import type { Question } from '@/types/question'
import { SUBJECTS } from '@/constants/syllabus'
import { PageHeader } from '@/components/layout/AppShell'
import { QuestionViewer } from '@/components/question/QuestionViewer'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Question[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [count, setCount] = useState(0)

  useEffect(() => {
    void searchCount().then(setCount)
  }, [])

  const doSearch = async (q: string) => {
    setQuery(q)
    setSearching(true)
    try {
      const res = await searchQuestions(q, 60)
      setResults(res)
      setSearched(true)
      setSelectedId(null)
    } finally {
      setSearching(false)
    }
  }

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (subjectFilter !== 'all' && r.subject !== subjectFilter) return false
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      return true
    })
  }, [results, subjectFilter, typeFilter])

  const suggestions = useMemo(() => {
    if (query.trim()) return []
    return ['Projectile Motion', 'Thermodynamics', 'Organic Chemistry', 'Probability', 'Matrices', 'Newton Laws', 'Integration', 'Chemical Bonding']
  }, [query])

  return (
    <div>
      <PageHeader title="Question Search" subtitle={`Search ${count.toLocaleString()} questions across the syllabus`} />

      <div className="mx-auto mb-4 max-w-xl">
        <div className="flex gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              const v = e.target.value
              setQuery(v)
              if (!v) { setResults([]); setSearched(false) }
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') void doSearch(query) }}
            placeholder="Search by topic, formula, concept…"
            className="h-11"
          />
          <Button onClick={() => void doSearch(query)} loading={searching}><Icon name="search" size={16} /></Button>
        </div>

        {!searched && !query && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {suggestions.map((s) => (
              <Chip key={s} onClick={() => void doSearch(s)}>{s}</Chip>
            ))}
          </div>
        )}
      </div>

      {query && !searched && <p className="mb-3 text-center text-xs text-text3">Press Enter or tap search to run the query.</p>}

      {searched && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-text3">{filtered.length} results</span>
            <div className="ml-1 flex flex-wrap gap-1.5">
              <Chip selected={subjectFilter === 'all'} onClick={() => setSubjectFilter('all')}>All subjects</Chip>
              {SUBJECTS.map((s) => (
                <Chip key={s.id} selected={subjectFilter === s.id} onClick={() => setSubjectFilter(s.id)}>{s.name}</Chip>
              ))}
            </div>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {['all', 'single', 'multiple', 'integer', 'matrix'].map((t) => (
                <Chip key={t} selected={typeFilter === t} onClick={() => setTypeFilter(t)}>{t === 'all' ? 'All types' : t}</Chip>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <EmptyState icon="search" title="No results" description="Try a different keyword or clear your filters." action={<Button variant="outline" onClick={() => { setQuery(''); setResults([]); setSearched(false) }}>Clear</Button>} />
          )}

          <div className="space-y-2">
            {filtered.map((q) => (
              <Card key={q.id} className="p-0">
                <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setSelectedId(selectedId === q.id ? null : q.id)}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Badge tone="muted">{q.year}</Badge>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{q.content.text ?? q.microTopic}</p>
                      <p className="text-[11px] text-text3">{q.chapter} · {q.microTopic} · {q.type}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded bg-surface2 px-1.5 py-0.5 text-[10px] font-medium text-text3 sm:inline">{SUBJECTS.find((s) => s.id === q.subject)?.name}</span>
                    <Icon name={selectedId === q.id ? 'chevron-up' : 'chevron-down'} size={16} className="text-text3" />
                  </div>
                </button>
                {selectedId === q.id && (
                  <div className="border-t border-border px-4 py-4">
                    <QuestionViewer question={q} locked showCorrect />
                    <div className="mt-4">
                      <p className="mb-1 text-xs font-semibold text-primary">Solution</p>
                      {q.solution.detailed ? <RichText content={q.solution.detailed} paragraphs /> : null}
                      {q.solution.images?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {q.solution.images.map((src, i) => (
                            <img key={i} src={src} alt={`Solution diagram ${i + 1}`} className="max-h-48 rounded border border-border" />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
