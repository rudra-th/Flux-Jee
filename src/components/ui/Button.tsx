import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Icon, type IconName } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary2 shadow-sm shadow-primary/20 disabled:opacity-50',
  secondary:
    'bg-surface2 text-text hover:bg-surface3 border border-border disabled:opacity-50',
  ghost: 'text-text2 hover:text-text hover:bg-surface2 disabled:opacity-50',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 disabled:opacity-50',
  success: 'bg-success/10 text-success hover:bg-success/20 border border-success/20 disabled:opacity-50',
  outline:
    'border border-border2 text-text hover:bg-surface2 hover:border-primary/40 disabled:opacity-50',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
  icon: 'h-9 w-9 justify-center',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconRight?: IconName
  loading?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'focus-ring inline-flex select-none items-center justify-center rounded-lg font-medium transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <Icon name={icon} size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
      ) : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === 'xs' ? 14 : 16} /> : null}
    </button>
  )
}
