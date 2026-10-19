import { cn } from '@shared/utils/cn'

interface ProgressBarProps {
  value: number // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

export function ProgressBar({ 
  value, 
  variant = 'primary', 
  size = 'md', 
  showLabel = false, 
  label, 
  className 
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  
  const variants = {
    primary: 'progress-primary',
    success: 'progress-success',
    warning: 'progress-warning',
    danger: 'progress-danger'
  }
  
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }
  
  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-xs text-text-secondary mb-1.5">
          <span>{label || 'Progress'}</span>
          <span className="font-medium text-text-primary">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={cn('progress-bar', sizes[size])}>
        <div
          className={cn('progress-fill', variants[variant])}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  )
}

interface CircularProgressProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  showValue?: boolean
  className?: string
}

const variants = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger'
}

export function CircularProgress({ 
  value, 
  size = 60, 
  strokeWidth = 6, 
  variant = 'primary', 
  showValue = true,
  className 
}: CircularProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedValue / 100) * circumference
  
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-500 ease-out', variants[variant])}
          style={{ transformOrigin: 'center' }}
        />
      </svg>
      {showValue && (
        <span className="absolute text-center font-medium">
          <span className="text-lg">{Math.round(clampedValue)}%</span>
        </span>
      )}
    </div>
  )
}