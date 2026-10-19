import { forwardRef } from 'react'
import { Circle, CheckCircle, MinusCircle, RotateCcw, MoreVertical } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { Button } from '@shared/components/ui/Button'
import { DropdownMenu, type DropdownMenuItem } from '@shared/components/ui/DropdownMenu'
import type { TaskWithStatus } from '../types'
import { canDeleteTask } from '../types'

interface TaskCardProps {
  task: TaskWithStatus
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
  isToggling?: boolean
  className?: string
}

const statusConfig = {
  not: { icon: Circle, className: 'text-text-muted', nextLabel: 'Mark as partial' },
  partial: { icon: MinusCircle, className: 'text-warning', nextLabel: 'Mark as done' },
  done: { icon: CheckCircle, className: 'text-success', nextLabel: 'Mark as not started' },
  skipped: { icon: Circle, className: 'text-text-muted/50', nextLabel: 'Skipped' },
} as const

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, onToggle, onDelete, isToggling, className, ...props }, ref) => {
    const { icon: StatusIcon, className: statusColor, nextLabel } = statusConfig[task.status as keyof typeof statusConfig]
    const isMain = task.priority === 'main'
    const isSkipped = task.status === 'skipped' || task.isSkipped

    const canDelete = canDeleteTask(task)

    const statusBackground = task.status === 'done'
      ? 'bg-success/10 border-success/25'
      : task.status === 'partial'
        ? 'bg-warning/10 border-warning/25'
        : 'bg-gray-500/10 border-gray-500/25'

    const menuItems: DropdownMenuItem[] = [
      { label: 'Delete', onClick: () => onDelete(task.id), className: 'text-danger', disabled: isSkipped || !canDelete },
    ]

    return (
      <div
        ref={ref}
        className={cn(
          'group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:border-border-hover hover:shadow-md',
          statusBackground,
          className
        )}
        {...props}
      >
        {/* 3-State Toggle Button */}
        {!isSkipped ? (
          <button
            onClick={() => onToggle(task.id)}
            disabled={isToggling}
            className={cn(
              'flex-shrink-0 p-2 rounded-lg transition-all duration-200',
              statusColor,
              'hover:scale-110 hover:bg-current/10 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
              isToggling && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={nextLabel}
            aria-pressed={task.status !== 'not'}
          >
            <StatusIcon className="h-6 w-6" strokeWidth={2.5} />
          </button>
        ) : (
          <div className="flex-shrink-0 p-2">
            <StatusIcon className="h-6 w-6" strokeWidth={2.5} />
          </div>
        )}

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className={cn(
              'font-medium text-text-primary truncate',
              isSkipped && 'text-text-muted'
            )}>
              {task.title}
            </h3>
            
            {/* Priority Badge */}
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
              isMain
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-secondary/10 text-secondary border border-secondary/20'
            )}>
              {isMain ? 'Main' : 'Side'}
            </span>

            {/* Recurring Badge */}
            {task.type === 'recurring' && !task.isRecurringOverride && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 bg-purple/10 text-purple border border-purple/20 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Recurring
              </span>
            )}

            {/* Override Badge */}
            {task.isRecurringOverride && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 bg-orange/10 text-orange border border-orange/20 flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-orange" />
                Override
              </span>
            )}

            {/* Skipped Badge */}
            {isSkipped && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 bg-gray/10 text-gray border border-gray/20">
                Skipped
              </span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm" className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="More options" disabled={isSkipped}>
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

TaskCard.displayName = 'TaskCard'
