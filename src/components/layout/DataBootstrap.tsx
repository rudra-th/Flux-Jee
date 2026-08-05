import { useEffect, useRef, useState } from 'react'
import { db } from '@/db'
import {
  importRealQuestions,
  importMainBank,
  importAdvBank,
  import2025Questions,
  importMmjeeQuestions,
} from '@/db/seed'
import { useUIStore } from '@/stores/uiStore'
import { applyTheme, useSettingsStore } from '@/stores/settingsStore'

type Stage = 'checking' | 'importing' | 'done' | 'error'

/**
 * Ensures the local question database is populated before the app renders.
 * Runs once: imports the bundled real JEE banks (eQOURSE PYQ, Grafite JEE Main,
 * JEEBench Advanced, JEE Main 2025, mmJEE-Eval Advanced). These steps are
 * resilient — if an import fails the app still works with whatever loaded.
 * A progress screen prevents users from ever landing on an empty app.
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
          // Existing database: run the additive real-bank imports in the
          // background so every install gets the latest bundled questions.
          setStage('done')
          Promise.allSettled([
            importRealQuestions(),
            importMainBank(),
            importAdvBank(),
            import2025Questions(),
            importMmjeeQuestions(),
          ]).then(([pyq, bank, adv, j2025, mmjee]) => {
            const total =
              (pyq.status === 'fulfilled' ? pyq.value : 0) +
              (bank.status === 'fulfilled' ? bank.value : 0) +
              (adv.status === 'fulfilled' ? adv.value : 0) +
              (j2025.status === 'fulfilled' ? j2025.value : 0) +
              (mmjee.status === 'fulfilled' ? mmjee.value : 0)
            if (total > 0) pushToast(`${total} questions added`, 'success')
          })
          return
        }
        setNeedsBootstrap(true)
        setStage('importing')
        setProgress(0)

        let imported = 0
        try {
          imported = await importRealQuestions({
            signal: { cancelled: false },
            progress: (done, total) => setProgress(Math.round((done / total) * 100)),
          })
        } catch {
          imported = 0
        }
        let bank = 0
        try {
          bank = await importMainBank({
            signal: { cancelled: false },
            progress: (done, total) => setProgress(Math.round((done / total) * 100)),
          })
        } catch {
          bank = 0
        }
        let adv = 0
        try {
          adv = await importAdvBank({
            signal: { cancelled: false },
            progress: (done, total) => setProgress(Math.round((done / total) * 100)),
          })
        } catch {
          adv = 0
        }
        let j2025 = 0
        try {
          j2025 = await import2025Questions({
            signal: { cancelled: false },
            progress: (done, total) => setProgress(Math.round((done / total) * 100)),
          })
        } catch {
          j2025 = 0
        }
        let mmjee = 0
        try {
          mmjee = await importMmjeeQuestions({
            signal: { cancelled: false },
            progress: (done, total) => setProgress(Math.round((done / total) * 100)),
          })
        } catch {
          mmjee = 0
        }
        setProgress(100)
        setStage('done')
        pushToast(
          `${imported} real JEE PYQs${bank ? ` + ${bank} JEE Main bank` : ''}${
            adv ? ` + ${adv} JEE Advanced` : ''
          }${j2025 ? ` + ${j2025} JEE Main 2025` : ''}${
            mmjee ? ` + ${mmjee} mmJEE-Eval` : ''
          } ready`,
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
            {stage === 'importing'
              ? 'Importing real JEE questions…'
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
