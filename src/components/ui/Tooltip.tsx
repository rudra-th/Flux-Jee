import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [el, setEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!show || !el) return
    const rect = el.getBoundingClientRect()
    const offset = 8
    let x = rect.left + rect.width / 2
    let y = rect.top
    if (side === 'top') y = rect.top - offset
    if (side === 'bottom') y = rect.bottom + offset
    if (side === 'left') {
      x = rect.left - offset
      y = rect.top + rect.height / 2
    }
    if (side === 'right') {
      x = rect.right + offset
      y = rect.top + rect.height / 2
    }
    setCoords({ x, y })
  }, [show, el, side])

  const posClass = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2 translate-y-0',
    left: '-translate-x-full -translate-y-1/2',
    right: 'translate-x-0 -translate-y-1/2',
  }[side]

  return (
    <>
      <span
        ref={setEl}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="inline-flex"
      >
        {children}
      </span>
      {show && (
        <div
          className={cn(
            'pointer-events-none fixed z-[90] max-w-xs rounded-lg border border-border bg-surface3 px-2.5 py-1.5 text-xs font-medium text-text shadow-lg',
            posClass,
            className,
          )}
          style={{ left: coords.x, top: coords.y }}
        >
          {content}
        </div>
      )}
    </>
  )
}
