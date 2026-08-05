import { useState } from 'react'
import { Card, CardHeader, Button, Switch, Select, Field, Input, Icon, SegmentedControl, Modal, Badge } from '@/components/ui'
import { useSettingsStore, applyTheme } from '@/stores/settingsStore'
import { useUIStore } from '@/stores/uiStore'
import type { ThemeId } from '@/types/settings'
import { resetDatabase } from '@/db'
import {
  importRealQuestions,
  importMainBank,
  importAdvBank,
  import2025Questions,
  importMmjeeQuestions,
  PYQ_SOURCE,
  BANK_SOURCE,
  ADV_SOURCE,
  J2025_SOURCE,
  MMJEE_SOURCE,
} from '@/db/seed'
import { PageHeader } from '@/components/layout/AppShell'
import { cn } from '@/utils/cn'
import { useQuery } from '@tanstack/react-query'
import { aiHealth } from '@/services/ai'

const THEMES: Array<{ id: ThemeId; label: string; desc: string }> = [
  { id: 'dark', label: 'Dark', desc: 'Classic dark UI' },
  { id: 'light', label: 'Light', desc: 'Bright and clean' },
  { id: 'oled', label: 'OLED', desc: 'Deep blacks, saves battery' },
  { id: 'highcontrast', label: 'High Contrast', desc: 'Maximum readability' },
]

export default function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings)
  const set = useSettingsStore((s) => s.set)
  const reset = useSettingsStore((s) => s.reset)
  const pushToast = useUIStore((s) => s.pushToast)

  const [busy, setBusy] = useState<'import' | 'bank' | 'reset' | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const apply = (patch: Parameters<typeof set>[0]) => {
    set(patch)
    applyTheme({ ...settings, ...patch })
  }

  const handleImportPyq = async () => {
    setBusy('import')
    try {
      const count = await importRealQuestions({ progress: () => {} })
      pushToast(`Imported ${count} real JEE PYQs`, 'success')
    } finally {
      setBusy(null)
    }
  }

  const handleImportBank = async () => {
    setBusy('bank')
    try {
      const main = await importMainBank({ progress: () => {} })
      const adv = await importAdvBank({ progress: () => {} })
      pushToast(`Imported ${main + adv} real JEE questions`, 'success')
    } finally {
      setBusy(null)
    }
  }

  const handleImport2025 = async () => {
    setBusy('bank')
    try {
      const j2025 = await import2025Questions({ progress: () => {} })
      const mmjee = await importMmjeeQuestions({ progress: () => {} })
      pushToast(`Imported ${j2025 + mmjee} real JEE questions`, 'success')
    } finally {
      setBusy(null)
    }
  }

  const handleReset = async () => {
    setConfirmReset(false)
    setBusy('reset')
    try {
      await resetDatabase()
      reset()
      applyTheme(settings)
      pushToast('Database and settings reset', 'success')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Personalize your JEE Arena experience" />

      <div className="space-y-4">
        {/* Appearance */}
        <Card>
          <CardHeader title="Appearance" />
          <div className="px-5 pb-5">
            <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => apply({ theme: t.id })}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    settings.theme === t.id ? 'border-primary/60 bg-primary/10' : 'border-border bg-surface2 hover:border-border2',
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <ThemeSwatch id={t.id} active={settings.theme === t.id} />
                    <span className="text-sm font-semibold text-text">{t.label}</span>
                  </div>
                  <p className="text-[11px] text-text3">{t.desc}</p>
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Font Scale">
                <SegmentedControl
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'large', label: 'Large' },
                    { value: 'xlarge', label: 'XL' },
                  ]}
                  value={settings.fontScale}
                  onChange={(v) => apply({ fontScale: v })}
                />
              </Field>
              <Field label="Target Exam">
                <Select value={settings.examTarget} onChange={(e) => apply({ examTarget: e.target.value as 'jee-main' | 'jee-advanced' })}>
                  <option value="jee-main">JEE Main</option>
                  <option value="jee-advanced">JEE Advanced</option>
                </Select>
              </Field>
            </div>
          </div>
        </Card>

        {/* Test preferences */}
        <Card>
          <CardHeader title="Test Preferences" />
          <div className="space-y-3 px-5 pb-5">
            <Toggle label="Sound Effects" desc="Play sounds on correct/wrong & submit" checked={settings.soundEnabled} onChange={(v) => apply({ soundEnabled: v })} />
            <Toggle label="Show Timer" desc="Display countdown during tests" checked={settings.showTimer} onChange={(v) => apply({ showTimer: v })} />
            <Toggle label="Auto Submit" desc="Automatically submit when time runs out" checked={settings.autoSubmit} onChange={(v) => apply({ autoSubmit: v })} />
            <Toggle label="Reduced Motion" desc="Minimize animations" checked={settings.reducedMotion} onChange={(v) => apply({ reducedMotion: v })} />
            <Toggle label="Offline Mode" desc="Cache everything for offline use" checked={settings.offlineMode} onChange={(v) => apply({ offlineMode: v })} />
          </div>
        </Card>

        {/* AI assistant */}
        <Card>
          <CardHeader title="AI Assistant" />
          <div className="space-y-4 px-5 pb-5">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface2 p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon name="brain" size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-text">AI Tutor</p>
                  <p className="text-[11px] text-text3">Step-by-step doubts &amp; explanations</p>
                </div>
              </div>
              <AiStatusBadge />
            </div>

            <div className="rounded-xl border border-border p-3">
              <p className="mb-2 text-xs font-medium text-text">Optional: use your own Gemini API key</p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="AIza… (leave blank to use the shared key)"
                  value={settings.geminiApiKey ?? ''}
                  onChange={(e) => apply({ geminiApiKey: e.target.value })}
                  autoComplete="off"
                />
                {settings.geminiApiKey ? (
                  <Button variant="outline" onClick={() => apply({ geminiApiKey: '' })}>
                    Clear
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-text3">
                Your key is stored only in this browser and is sent only to this app's AI endpoint for the current
                request — it is never uploaded to our servers or shown in the source code.
              </p>
            </div>
          </div>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader title="Profile" />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
            <Field label="Name">
              <Input value={settings.userName} onChange={(e) => apply({ userName: e.target.value })} />
            </Field>
            <Field label="Daily Goal (questions)">
              <Input type="number" min={5} value={settings.dailyGoal} onChange={(e) => apply({ dailyGoal: Number(e.target.value) })} />
            </Field>
            <Field label="Target Year">
              <Input type="number" value={settings.targetYear} onChange={(e) => apply({ targetYear: Number(e.target.value) })} />
            </Field>
          </div>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader title="Data & Storage" />
          <div className="space-y-3 px-5 pb-5">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface2 p-3">
              <div>
                <p className="text-sm font-medium text-text">Import Real JEE PYQs</p>
                <p className="text-[11px] text-text3">
                  {PYQ_SOURCE.count} real JEE Main questions from {PYQ_SOURCE.name} ({PYQ_SOURCE.license})
                </p>
              </div>
              <Button size="sm" variant="outline" loading={busy === 'import'} onClick={() => void handleImportPyq()}>
                <Icon name="download" size={14} /> Import
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface2 p-3">
              <div>
                <p className="text-sm font-medium text-text">Import Real JEE Main & Advanced Banks</p>
                <p className="text-[11px] text-text3">
                  {BANK_SOURCE.count} real JEE Main (AIEEE 2002–2024) + {ADV_SOURCE.count} real JEE Advanced
                  (2016–2023) questions from {BANK_SOURCE.name} & {ADV_SOURCE.name}
                </p>
              </div>
              <Button size="sm" variant="outline" loading={busy === 'bank'} onClick={() => void handleImportBank()}>
                <Icon name="download" size={14} /> Import
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface2 p-3">
              <div>
                <p className="text-sm font-medium text-text">Import Real JEE Main 2025 & JEE Advanced (2026)</p>
                <p className="text-[11px] text-text3">
                  {J2025_SOURCE.count} real JEE Main 2025 (Jan) + {MMJEE_SOURCE.count} real JEE Advanced
                  (2019–2026) questions from {J2025_SOURCE.name} & {MMJEE_SOURCE.name}
                </p>
              </div>
              <Button size="sm" variant="outline" loading={busy === 'bank'} onClick={() => void handleImport2025()}>
                <Icon name="download" size={14} /> Import
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface2 p-3">
              <div>
                <p className="text-sm font-medium text-danger">Reset Everything</p>
                <p className="text-[11px] text-text3">Wipe database, progress and settings</p>
              </div>
              <Button size="sm" variant="danger" loading={busy === 'reset'} onClick={() => setConfirmReset(true)}>
                <Icon name="trash" size={14} /> Reset
              </Button>
            </div>
          </div>
        </Card>

        <Modal
          open={confirmReset}
          onClose={() => setConfirmReset(false)}
          title="Reset everything?"
          subtitle="This wipes the question bank, all your test history, mistakes, flashcards and settings. This cannot be undone."
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button variant="danger" loading={busy === 'reset'} onClick={() => void handleReset()}>
                <Icon name="trash" size={14} /> Yes, reset
              </Button>
            </>
          }
        >
          <p className="text-sm text-text2">
            You will need to reseed the question bank afterwards. Are you sure?
          </p>
        </Modal>

        <p className="px-1 text-center text-[11px] text-text3">
          JEE Arena v0.1.0 · Data stored locally in your browser · {settings.offlineMode ? 'Offline ready' : 'Online only'}
        </p>
      </div>
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-[11px] text-text3">{desc}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

function ThemeSwatch({ id, active }: { id: ThemeId; active: boolean }) {
  const bg = id === 'dark' ? '#0b1120' : id === 'light' ? '#ffffff' : id === 'oled' ? '#000000' : '#ffffff'
  const fg = id === 'light' || id === 'highcontrast' ? '#0f172a' : '#e2e8f0'
  const accent = id === 'highcontrast' ? '#facc15' : '#6366f1'
  return (
    <span className={cn('inline-flex h-5 w-8 items-center justify-center rounded border text-[8px] font-bold', active && 'border-primary')} style={{ backgroundColor: bg, color: fg, borderColor: active ? accent : 'rgba(128,128,128,0.4)' }}>
      <span style={{ color: accent }}>Aa</span>
    </span>
  )
}

function AiStatusBadge() {
  const { data } = useQuery({ queryKey: ['ai-health'], queryFn: aiHealth, retry: false })
  const configured = data?.configured ?? false
  if (!configured) return <Badge tone="warning">Not configured</Badge>
  const provider = data?.provider ?? 'Gemini'
  return (
    <Badge tone="success">
      {provider} server key configured
    </Badge>
  )
}
