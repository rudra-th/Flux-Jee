import { useUIStore } from '@/stores/uiStore'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { Icon, type IconName } from './Icon'

const toastIcon: Record<string, IconName> = {
  info: 'info',
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert',
}

const toastColor: Record<string, string> = {
  info: 'text-info',
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
}

export function Toaster() {
  const { toasts, dismissToast } = useUIStore()

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface2 px-3 py-3 shadow-lg"
            role="status"
          >
            <Icon name={toastIcon[t.type] ?? 'info'} size={18} className={cn('mt-0.5 shrink-0', toastColor[t.type])} />
            <p className="flex-1 text-sm text-text">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              className="focus-ring rounded p-0.5 text-text3 transition-colors hover:text-text"
              aria-label="Dismiss"
            >
              <Icon name="close" size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
