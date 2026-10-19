import { forwardRef } from 'react'
import { Circle, CheckCircle, MoreVertical, Calendar } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { Button } from '@shared/components/ui/Button'
import { DropdownMenu, type DropdownMenuItem } from '@shared/components/ui/DropdownMenu'
import { formatDate } from '@shared/utils/dateUtils'
import type { GoalWithStatus } from '../types'

interface GoalCardProps {
  goal: GoalWithStatus
  onToggle: (goalId: string) => void
  onEdit: (goal: GoalWithStatus) => void
  onDelete: (goalId: string) => void
  className?: string
}

const statusConfig = {
  not: { icon: Circle, className: 'text-text-muted', nextLabel: 'Mark as achieved' },
  done: { icon: CheckCircle, className: 'text-success', nextLabel: 'Mark as not started' },
} as const

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return !Number.isNaN(new Date(`${value}T12:00:00`).getTime())
}

function formatGoalDate(value: unknown): string {
  return isDateKey(value) ? formatDate(value, 'dd/MM/yyyy') : '—'
}

export const GoalCard = forwardRef<HTMLDivElement, GoalCardProps>(
  ({ goal, onToggle, onEdit, onDelete, className, ...props }, ref) => {
    const { icon: StatusIcon, className: statusColor, nextLabel } = statusConfig[goal.status]
    const isDone = goal.status === 'done'

    const statusBackground = isDone
      ? 'bg-success/10 border-success/25'
      : 'bg-gray-500/10 border-gray-500/25'

    const displayEndDate = formatGoalDate(goal.endDate)

    const menuItems: DropdownMenuItem[] = [
      { label: 'Edit', onClick: () => onEdit(goal), disabled: isDone },
      { type: 'separator', label: '', onClick: () => {} } as DropdownMenuItem,
      { label: 'Delete', onClick: () => onDelete(goal.id), className: 'text-danger', disabled: isDone },
    ]

    return (
      <div
        ref={ref}
        className={cn(
          'group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:border-border-hover hover:shadow-md',
          statusBackground,
          className
        )}
        {...props}
      >
        {/* 3-State Toggle Button */}
        {!isDone ? (
          <button
            onClick={() => onToggle(goal.id)}
            className={cn(
              'flex-shrink-0 p-2 rounded-lg transition-all duration-200 mt-0.5',
              statusColor,
              'hover:scale-110 hover:bg-current/10 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current'
            )}
            aria-label={nextLabel}
            aria-pressed={goal.status !== 'not'}
          >
            <StatusIcon className="h-6 w-6" strokeWidth={2.5} />
          </button>
        ) : (
          <div className="flex-shrink-0 p-2 mt-0.5">
            <StatusIcon className="h-6 w-6" strokeWidth={2.5} />
          </div>
        )}

        {/* Goal Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className={cn(
              'font-medium text-text-primary truncate flex-1 min-w-[150px]',
            )}>
              {goal.title}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-text-primary flex-shrink-0">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                DO BEFORE {displayEndDate}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm" className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="More options" disabled={isDone}>
              <MoreVertical className="h-5 w-5 text-text-muted" />
            </Button>
          }
          items={menuItems}
          align="end"
        />
      </div>
    )
  }
)

GoalCard.displayName = 'GoalCard'
