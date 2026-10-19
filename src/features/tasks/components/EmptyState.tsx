import { CheckCircle, Plus, Calendar, Lightbulb } from 'lucide-react'
import { Button } from '@shared/components/ui/Button'

interface EmptyStateProps {
  onCreateTask: () => void
  hasMainTasks?: boolean
  mainCount?: number
}

export function EmptyState({ onCreateTask, hasMainTasks = false, mainCount = 0 }: EmptyStateProps) {
  const maxMainTasks = 4
  const remainingMainSlots = maxMainTasks - mainCount

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-6 p-4 rounded-2xl bg-surface-elevated border border-border">
        <CheckCircle className="mx-auto h-16 w-16 text-text-muted/30" />
      </div>
      
      <h2 className="mb-2 text-2xl font-bold text-text-primary">
        {hasMainTasks ? 'Great start!' : 'No tasks yet'}
      </h2>
      
      <p className="mb-6 max-w-xs text-text-secondary">
        {hasMainTasks
          ? `You have ${mainCount} main task${mainCount !== 1 ? 's' : ''} today. Add more to fill your day!`
          : 'Start your day by adding your first task. You can add up to 4 main tasks.'}
      </p>

      <Button size="lg" onClick={onCreateTask} className="w-full sm:w-auto">
        <Plus className="h-5 w-5 mr-2" />
        {hasMainTasks ? 'Add Another Task' : 'Create Your First Task'}
      </Button>

      {/* Tips */}
      <div className="mt-8 w-full max-w-md space-y-3 text-left">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated border border-border">
          <Lightbulb className="flex-shrink-0 h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-text-primary">3-State Progress</p>
            <p className="text-sm text-text-secondary">Click the circle to cycle: Not started → In progress → Done</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated border border-border">
          <Calendar className="flex-shrink-0 h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-text-primary">Main vs Side Tasks</p>
            <p className="text-sm text-text-secondary">Main tasks count 2× weight (max 4/day). Side tasks count 1× weight.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-elevated border border-border">
          <Lightbulb className="flex-shrink-0 h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-text-primary">Recurring Tasks</p>
            <p className="text-sm text-text-secondary">Set tasks to repeat daily within a date range. Each day gets independent status.</p>
          </div>
        </div>
      </div>

      {hasMainTasks && remainingMainSlots > 0 && (
        <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-primary font-medium">
            {remainingMainSlots} main task slot{remainingMainSlots !== 1 ? 's' : ''} remaining today
          </p>
        </div>
      )}
    </div>
  )
}