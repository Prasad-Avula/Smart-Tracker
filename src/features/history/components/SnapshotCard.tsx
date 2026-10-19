import { ChevronDown, ChevronUp, Calendar, Target, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { formatDate } from '@shared/utils/dateUtils'
import { Card, CardContent } from '@shared/components/ui/Card'
import { ProgressBar } from '@shared/components/ui/ProgressBar'
import { Button } from '@shared/components/ui/Button'
import type { DailySnapshot, GoalSnapshot, TaskSnapshotItem, GoalSnapshotItem } from '../types'

interface SnapshotCardProps {
  snapshot: DailySnapshot | GoalSnapshot
  type: 'daily' | 'goal'
  isExpanded?: boolean
  onToggle?: () => void
}

function StatusBadge({ status, text, priority }: { status: string; text: string; priority?: 'main' | 'side' }) {
  const colors = {
    completed: 'bg-green/10 text-green border-green/20',
    partial: 'bg-warning/10 text-warning border-warning/20',
    not_done: 'bg-red/10 text-red border-red/20',
  }
  const cardColors = {
    completed: 'bg-success/10 border-success/25',
    partial: 'bg-warning/10 border-warning/25',
    not_done: 'bg-danger/10 border-danger/25',
  }
  const icons = {
    completed: <CheckCircle2 className="h-3.5 w-3.5" />,
    partial: <MinusCircle className="h-3.5 w-3.5" />,
    not_done: <XCircle className="h-3.5 w-3.5" />,
  }
  const priorityIndicator = priority === 'main' ? '🎯' : priority === 'side' ? '📅' : ''

  const statusKey = status as keyof typeof colors

  return (
    <div className={cn(
      'flex items-center gap-2 p-2.5 rounded-lg border transition-colors hover:bg-surface-hover',
      cardColors[statusKey] || cardColors.not_done,
    )}>
      <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs', colors[status as keyof typeof colors] || colors.not_done)}>
        {icons[status as keyof typeof icons] || icons.not_done}
      </span>
      <span className="font-medium text-text-primary flex-1 truncate">{priorityIndicator} {text}</span>
      <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', colors[status as keyof typeof colors] || colors.not_done)}>
        {status.replace('_', ' ')}
      </span>
    </div>
  )
}

export function SnapshotCard({
  snapshot,
  type,
  isExpanded = false,
  onToggle,
}: SnapshotCardProps) {
  const isDaily = type === 'daily'
  const dailySnap = snapshot as DailySnapshot
  const goalSnap = snapshot as GoalSnapshot

  const dateLabel = isDaily
    ? formatDate(dailySnap.date)
    : goalSnap.periodKey

  const periodLabel = isDaily
    ? 'Daily'
    : goalSnap.period.charAt(0).toUpperCase() + goalSnap.period.slice(1)

  const progress = isDaily ? dailySnap.progress : goalSnap.progress

  return (
    <Card variant="elevated" className="overflow-hidden">
      <Button
        variant="ghost"
        className="w-full justify-between p-4 gap-4"
        onClick={onToggle}
        disabled={!onToggle}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'p-2 rounded-lg flex-shrink-0',
              isDaily ? 'bg-blue/10 text-blue' : 'bg-purple/10 text-purple'
            )}
          >
            {isDaily ? <Calendar className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-text-primary truncate">{dateLabel}</p>
            <p className="text-xs text-text-muted">{periodLabel} Snapshot</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right min-w-[80px]">
            <ProgressBar
              value={progress}
              size="sm"
              showLabel
              variant={
                progress >= 75
                  ? 'success'
                  : progress >= 50
                  ? 'warning'
                  : 'primary'
              }
            />
          </div>
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </Button>

      {isExpanded && onToggle && (
        <CardContent className="px-4 pb-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4 pt-2">
            {isDaily ? (
              <>
                {dailySnap.tasks && dailySnap.tasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Main Tasks</p>
                    <div className="space-y-1.5 ml-2">
                      {dailySnap.tasks.filter(t => t.priority === 'main').map((task: TaskSnapshotItem) => (
                        <StatusBadge key={task.id} status={task.status} text={task.text} priority="main" />
                      ))}
                    </div>
                  </div>
                )}
                {dailySnap.tasks && dailySnap.tasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Side Tasks</p>
                    <div className="space-y-1.5 ml-2">
                      {dailySnap.tasks.filter(t => t.priority === 'side').map((task: TaskSnapshotItem) => (
                        <StatusBadge key={task.id} status={task.status} text={task.text} priority="side" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {goalSnap.goals && goalSnap.goals.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Goals</p>
                    <div className="space-y-1.5 ml-2">
                      {goalSnap.goals.map((goal: GoalSnapshotItem) => (
                        <StatusBadge key={goal.id} status={goal.status} text={goal.text} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
