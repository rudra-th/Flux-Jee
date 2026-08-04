import { useEffect, type RefObject } from 'react'

export type KeyHandler = (e: KeyboardEvent) => void

/**
 * Register keyboard shortcuts on the window.
 * `enabled` can gate (e.g. only when test is running).
 */
export function useKeyboard(
  handlers: Record<string, KeyHandler>,
  enabled = true,
  deps: unknown[] = [],
) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }
      const key = e.key
      const ctrl = e.ctrlKey || e.metaKey
      const combo = ctrl ? `ctrl+${key.toLowerCase()}` : key.toLowerCase()
      const handler = handlers[combo] ?? handlers[key]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])
}

/** Scroll a ref'd element into view smoothly */
export function useScrollIntoView<T extends HTMLElement>(
  ref: RefObject<T | null>,
  dependency: unknown,
) {
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [dependency, ref])
}
