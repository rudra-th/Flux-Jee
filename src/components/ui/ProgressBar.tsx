import { cn } from '@/utils/cn'

export function ProgressBar({
  value,
  max = 100,
  color,
  className,
  size = 'md',
}: {
  value: number
  max?: number
  color?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full overflow-hidden rounded-full bg-surface3',
        size === 'sm' && 'h-1',
        size === 'md' && 'h-1.5',
        size === 'lg' && 'h-2.5',
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: color ?? 'var(--primary)' }}
      />
    </div>
  )
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color,
  label,
}: {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color ?? 'var(--primary)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label ?? <span className="text-xl font-bold text-text">{Math.round(value)}%</span>}
      </div>
    </div>
  )
}
