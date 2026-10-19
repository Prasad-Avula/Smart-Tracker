import { cn } from '@shared/utils/cn'

interface BrandProps {
  className?: string
}

export function Brand({ className }: BrandProps) {
  return (
    <div className={cn('flex h-8 min-w-0 items-center gap-2', className)}>
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
        <span className="text-sm font-bold text-white">ST</span>
      </div>
      <span className="truncate text-lg font-semibold text-text-primary">Smart Tracker</span>
    </div>
  )
}
