import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * A precise countdown timer that compensates for throttled intervals.
 * `durationSeconds` is the initial value; `onEnd` fires once at zero.
 */
export function useCountdown(
  durationSeconds: number,
  running: boolean,
  onEnd?: () => void,
) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const endFired = useRef(false)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd
  const hasReset = useRef(false)

  const reset = useCallback((duration?: number) => {
    setRemaining(duration ?? durationSeconds)
    endFired.current = false
    hasReset.current = true
  }, [durationSeconds])

  useEffect(() => {
    if (!running) return
    if (hasReset.current) {
      hasReset.current = false
    }
    const start = Date.now()
    const initial = remaining
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const next = Math.max(0, initial - elapsed)
      setRemaining(next)
      if (next <= 0) {
        clearInterval(id)
        if (!endFired.current) {
          endFired.current = true
          onEndRef.current?.()
        }
      }
    }, 500)
    return () => clearInterval(id)
  }, [running, remaining, durationSeconds])

  return { remaining, reset }
}

/** Simple interval ticker (1 per second) for UI clocks */
export function useTicker(active: boolean, intervalMs = 1000): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setCount((c) => c + 1), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])
  return count
}
