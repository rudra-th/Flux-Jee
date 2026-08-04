import { cn } from '@/utils/cn'
import type { QuestionStatus } from '@/types/core'

export interface PaletteItem {
  index: number
  status: QuestionStatus
  isCurrent: boolean
}

export const PALETTE_LEGEND: Array<{ label: string; color: string; icon?: 'circle' }> = [
  { label: 'Not Visited', color: 'var(--palette-notvisited)' },
  { label: 'Visited', color: 'var(--palette-notvisited)', icon: 'circle' },
  { label: 'Answered', color: 'var(--palette-answered)' },
  { label: 'Marked for Review', color: 'var(--palette-marked)' },
  { label: 'Marked + Answered', color: 'var(--palette-answeredmarked)' },
]

export function PaletteLegend() {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 shrink-0 rounded border border-border2 bg-surface2" />
        <span className="text-xs text-text2">Not Visited</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 shrink-0 rounded border border-border2" style={{ backgroundColor: 'var(--surface-3)' }} />
        <span className="text-xs text-text2">Visited</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 shrink-0 rounded" style={{ backgroundColor: 'var(--palette-answered)' }} />
        <span className="text-xs text-text2">Answered</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 shrink-0 rounded" style={{ backgroundColor: 'var(--palette-marked)' }} />
        <span className="text-xs text-text2">Marked for Review</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 shrink-0 rounded" style={{ backgroundColor: 'var(--palette-answeredmarked)' }} />
        <span className="text-xs text-text2">Marked + Answered</span>
      </div>
    </div>
  )
}

export function statusColor(status: QuestionStatus): string {
  switch (status) {
    case 'answered':
      return 'var(--palette-answered)'
    case 'marked':
      return 'var(--palette-marked)'
    case 'answered-marked':
      return 'var(--palette-answeredmarked)'
    case 'visited':
      return 'var(--surface-3)'
    default:
      return 'transparent'
  }
}

export function QuestionPalette({
  items,
  onSelect,
  sectionLabel,
  answeredCount,
  totalCount,
}: {
  items: PaletteItem[]
  onSelect: (index: number) => void
  sectionLabel?: string
  answeredCount?: number
  totalCount?: number
}) {
  return (
    <div>
      {sectionLabel && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text3">{sectionLabel}</p>
          {answeredCount !== undefined && totalCount !== undefined && (
            <p className="text-[11px] text-text3">
              {answeredCount}/{totalCount}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-5 gap-1.5">
        {items.map((item) => (
          <button
            key={item.index}
            onClick={() => onSelect(item.index)}
            className={cn(
              'focus-ring relative flex h-8 items-center justify-center rounded-md border text-xs font-semibold transition-all duration-100',
              item.isCurrent
                ? 'border-transparent text-white shadow-md'
                : 'border-border2 text-text2 hover:border-primary/40',
            )}
            style={{
              backgroundColor: item.isCurrent
                ? 'var(--palette-current)'
                : item.status === 'not-visited'
                  ? 'var(--bg)'
                  : statusColor(item.status),
              outline: item.isCurrent ? '2px solid var(--palette-current)' : undefined,
              outlineOffset: item.isCurrent ? 2 : undefined,
            }}
            aria-label={`Question ${item.index + 1}, ${item.status.replace('-', ' ')}`}
          >
            {item.index + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
