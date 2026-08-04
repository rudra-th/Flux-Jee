import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { Icon, type IconName } from './Icon'

const baseInput =
  'focus-ring w-full rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-text placeholder:text-text3 transition-colors hover:border-border2'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(baseInput, className)} {...rest} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(baseInput, 'resize-y leading-relaxed', className)} {...rest} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(baseInput, 'appearance-none pr-8', className)} {...rest}>
        {children}
      </select>
    )
  },
)

export function SelectWithChevron({
  icon,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { icon?: IconName }) {
  return (
    <div className={cn('relative', className)}>
      <select
        className={cn(baseInput, 'appearance-none pr-8', icon && 'pl-9')}
        {...rest}
      >
        {children}
      </select>
      {icon ? (
        <Icon name={icon} size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
      ) : null}
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text3"
      />
    </div>
  )
}

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label className="block text-xs font-medium text-text2">{label}</label>
      ) : null}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {hint && !error ? <p className="text-xs text-text3">{hint}</p> : null}
    </div>
  )
}
