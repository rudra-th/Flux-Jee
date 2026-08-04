import { useEffect, useRef, useState } from 'react'
import { db } from '@/db'
import { seedDatabase, importRealQuestions } from '@/db/seed'
import { useUIStore } from '@/stores/uiStore'
import { applyTheme, useSettingsStore } from '@/stores/settingsStore'

const SEED_PER_TOPIC = 4

type Stage = 'checking' | 'seeding' | 'importing' | 'done' | 'error'

/**
 * Ensures the local question database is populated before the app renders.
 * Runs once: seeds the full-syllabus generated bank, then imports the bundled
 * real JEE PYQ dataset (1913 questions, eQOURSE CC BY 4.0). Both steps are
 * resilient — if the network import fails the generated bank is still enough
 * to run every mode. A progress screen prevents users from ever landing on an
 * empty app.
 */
export function DataBootstrap({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>('checking')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [needsBootstrap, setNeedsBootstrap] = useState(false)
  const ranRef = useRef(false)
  const pushToast = useUIStore((s) => s.pushToast)

  useEffect(() => {
    const settings = useSettingsStore.getState().settings
    applyTheme(settings)
  }, [])

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const bootstrap = async () => {
      try {
        const count = await db.questions.count()
        if (count > 0) {
          setStage('done')
          return
        }
        setNeedsBootstrap(true)
        setStage('seeding')

        const seeded = await seedDatabase({
          perTopic: SEED_PER_TOPIC,
          signal: { cancelled: false },
          progress: (done, total) => setProgress(Math.round((done / total) * 100)),
        })
        setProgress(100)

        setStage('importing')
        setProgress(0)
        let imported = 0
        try {
          imported = await importRealQuestions({
            signal: { cancelled: false },
            progress: (done, total) => setProgress(Math.round((done / total) * 100)),
          })
        } catch {
          // Network import failed — the generated bank is sufficient.
          imported = 0
        }
        setProgress(100)
        setStage('done')
        pushToast(
          `${seeded} questions ready${imported ? ` + ${imported} real JEE PYQs` : ''}`,
          'success',
        )
      } catch (err) {
        setStage('error')
        setError(err instanceof Error ? err.message : 'Failed to prepare the question bank.')
      }
    }
    void bootstrap()
  }, [pushToast])

  if (!needsBootstrap && stage === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (stage === 'done' || !needsBootstrap) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <span className="text-2xl font-black text-primary">J</span>
          </div>
          <h1 className="text-lg font-bold text-text">Preparing your question bank</h1>
          <p className="mt-1 text-sm text-text2">
            {stage === 'seeding'
              ? 'Building the full-syllabus question set…'
              : stage === 'importing'
                ? 'Importing real JEE PYQs…'
                : stage === 'error'
                  ? 'Something went wrong'
                  : 'Almost ready…'}
          </p>
        </div>

        {stage === 'error' ? (
          <div className="space-y-3">
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-center text-xs text-text">
              {error}
            </p>
            <button
              onClick={() => {
                setStage('checking')
                setNeedsBootstrap(false)
                ranRef.current = false
                window.location.reload()
              }}
              className="w-full rounded-lg border border-primary bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-surface3">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center font-mono text-xs text-text3">{progress}%</p>
          </>
        )}
      </div>
    </div>
  )
}
