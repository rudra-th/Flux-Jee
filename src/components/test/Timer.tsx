import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'
import { formatClock } from '@/utils/time'
import { useUIStore } from '@/stores/uiStore'

export function Timer({
  remaining,
  total,
  running,
  paused = false,
  warnings = [600, 300, 120, 60, 10],
}: {
  remaining: number
  total: number
  running: boolean
  paused?: boolean
  warnings?: number[]
}) {
  const pushToast = useUIStore((s) => s.pushToast)
  const [fired, setFired] = useState<Set<number>>(new Set())

  const pct = total > 0 ? (remaining / total) * 100 : 0
  const critical = remaining <= 60
  const urgent = remaining <= 600 && remaining > 60

  useEffect(() => {
    if (remaining === total) setFired(new Set())
  }, [remaining, total])

  useEffect(() => {
    if (!running || paused) return
    for (const w of warnings) {
      if (remaining === w && !fired.has(w)) {
        setFired((f) => new Set(f).add(w))
        pushToast(
          remaining > 60
            ? `⏰ ${Math.floor(remaining / 60)} minute(s) remaining!`
            : `⚠️ Only ${remaining} seconds left!`,
          remaining <= 60 ? 'error' : 'warning',
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running, paused])

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex flex-col items-center">
        <svg width="44" height="44" viewBox="0 0 44 44" className={cn('-rotate-90', paused && 'opacity-50')}>
          <circle cx="22" cy="22" r="19" fill="none" stroke="var(--surface-3)" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            stroke={critical ? 'var(--danger)' : urgent ? 'var(--warning)' : 'var(--success)'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 19}
            strokeDashoffset={2 * Math.PI * 19 * (1 - pct / 100)}
            className="transition-all duration-500"
          />
        </svg>
        <span
          className={cn(
            'absolute font-mono text-[10px] font-bold',
            critical ? 'text-danger' : urgent ? 'text-warning' : 'text-text',
          )}
        >
          {formatClock(remaining)}
        </span>
      </div>
      {paused && (
        <span className="text-[11px] font-semibold text-warning">PAUSED</span>
      )}
    </div>
  )
}
