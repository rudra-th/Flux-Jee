import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Icon, type IconName } from './Icon'

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
  className,
}: {
  icon?: IconName
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface2">
        <Icon name={icon} size={26} className="text-text3" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text">{title}</p>
        {description ? <p className="mt-1 max-w-sm text-xs text-text2">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface p-5', className)}>
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="mt-3 h-8 w-3/5" />
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  )
}
