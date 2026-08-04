import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Icon, type IconName } from './Icon'

export type BadgeTone = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'muted'

const tones: Record<BadgeTone, string> = {
  default: 'bg-surface2 text-text2 border-border',
  primary: 'bg-primary/10 text-primary border-primary/25',
  success: 'bg-success/10 text-success border-success/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  info: 'bg-info/10 text-info border-info/25',
  muted: 'bg-transparent text-text3 border-border',
}

export function Badge({
  children,
  tone = 'default',
  icon,
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  icon?: IconName
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
        className,
      )}
    >
      {icon ? <Icon name={icon} size={11} /> : null}
      {children}
    </span>
  )
}
