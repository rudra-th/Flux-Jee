import { useState } from 'react'
import { Button, Card, Icon } from '@/components/ui'
import { NTA_INSTRUCTIONS } from '@/constants/exams'
import { formatDuration } from '@/utils/time'
import { useSettingsStore } from '@/stores/settingsStore'
import type { TestConfig } from '@/types/test'

export function InstructionsScreen({
  config,
  onStart,
  onResume,
  hasDraft,
  timeLeft,
}: {
  config: TestConfig
  onStart: () => void
  onResume?: () => void
  hasDraft?: boolean
  timeLeft?: number
}) {
  const { settings } = useSettingsStore()
  const [agreed, setAgreed] = useState(false)
  const instructions = NTA_INSTRUCTIONS[config.exam] ?? NTA_INSTRUCTIONS['jee-main'] ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-8">
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface2/60 px-6 py-5">
          <h1 className="text-xl font-bold text-text">{config.name}</h1>
          <p className="mt-1 text-sm text-text2">
            {config.exam === 'jee-main' ? 'Joint Entrance Examination (Main)' : config.exam === 'jee-advanced' ? 'Joint Entrance Examination (Advanced)' : 'Practice Test'} · Candidate: {settings.userName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
          {[
            { label: 'Questions', value: String(config.totalQuestions) },
            { label: 'Duration', value: formatDuration(config.durationSeconds) },
            { label: 'Sections', value: String(config.sections.length) },
            { label: 'Negative Marking', value: config.negativeMarking ? 'Yes' : 'No' },
          ].map((s) => (
            <div key={s.label} className="bg-surface px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text3">{s.label}</p>
              <p className="mt-0.5 text-sm font-bold text-text">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
            <Icon name="info" size={16} className="text-primary" />
            General Instructions
          </h2>
          <ol className="space-y-2.5">
            {instructions.map((inst, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-text2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                {inst}
              </li>
            ))}
          </ol>

          <h2 className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold text-text">
            <Icon name="keyboard" size={16} className="text-primary" />
            Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ['1–4', 'Choose option'],
              ['N / P', 'Next / Previous'],
              ['M', 'Mark for review'],
              ['S', 'Save & next'],
              ['Ctrl+Enter', 'Submit test'],
              ['Esc', 'Pause'],
            ].map(([k, a]) => (
              <div key={k} className="flex items-center gap-2 rounded-lg border border-border bg-surface2 px-3 py-1.5">
                <kbd className="rounded border border-border2 bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text">{k}</kbd>
                <span className="text-xs text-text2">{a}</span>
              </div>
            ))}
          </div>

          <label className="mt-6 flex items-center gap-2 text-sm text-text2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[var(--primary)]"
            />
            I have read and understood all the instructions.
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-surface2/40 px-6 py-4">
          {hasDraft && onResume && timeLeft !== undefined ? (
            <>
              <Button variant="secondary" onClick={onResume} disabled={!agreed}>
                <Icon name="refresh" size={16} /> Resume ({formatDuration(timeLeft)} left)
              </Button>
              <Button onClick={onStart} disabled={!agreed}>Restart Test</Button>
            </>
          ) : (
            <Button onClick={onStart} size="lg" disabled={!agreed}>
              <Icon name="play" size={18} /> Start Test
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
