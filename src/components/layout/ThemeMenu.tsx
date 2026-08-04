import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui'
import { useSettingsStore } from '@/stores/settingsStore'
import type { ThemeId } from '@/types/settings'

const THEMES: Array<{ id: ThemeId; label: string; icon: 'moon' | 'sun' | 'monitor' | 'contrast' }> = [
  { id: 'dark', label: 'NTA Dark', icon: 'moon' },
  { id: 'light', label: 'NTA Light', icon: 'sun' },
  { id: 'oled', label: 'OLED', icon: 'monitor' },
  { id: 'highcontrast', label: 'High Contrast', icon: 'contrast' },
]

export function ThemeMenu() {
  const { settings, set } = useSettingsStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = THEMES.find((t) => t.id === settings.theme) ?? THEMES[0]!

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-text2 transition-colors hover:bg-surface2 hover:text-text"
        aria-label="Change theme"
      >
        <Icon name={current.icon} size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-border bg-surface2 p-1.5 shadow-xl">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                set({ theme: t.id })
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface3"
            >
              <Icon
                name={t.icon}
                size={16}
                className={t.id === settings.theme ? 'text-primary' : 'text-text2'}
              />
              <span
                className={
                  t.id === settings.theme ? 'font-semibold text-text' : 'text-text2'
                }
              >
                {t.label}
              </span>
              {t.id === settings.theme ? (
                <Icon name="check" size={14} className="ml-auto text-primary" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
