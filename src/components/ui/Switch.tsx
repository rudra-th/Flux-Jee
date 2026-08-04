import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-surface3',
        disabled && 'opacity-50',
      )}
    >
      <span
        className={cn(
          'inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[1.35rem]' : 'translate-x-[3px]',
        )}
        style={{ height: 18, width: 18 }}
      />
    </button>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ id: T; label: ReactNode }>
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1 rounded-lg bg-surface2 p-1', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'focus-ring flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150',
            value === tab.id ? 'bg-surface3 text-text shadow-sm' : 'text-text2 hover:text-text',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({
  selected,
  onClick,
  children,
  className,
  disabled,
}: {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-surface text-text2 hover:border-border2 hover:text-text',
        disabled && 'opacity-50',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center rounded-lg border border-border bg-surface p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'focus-ring rounded-md px-3 py-1 text-xs font-medium transition-colors',
            value === o.value ? 'bg-primary text-white' : 'text-text2 hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
