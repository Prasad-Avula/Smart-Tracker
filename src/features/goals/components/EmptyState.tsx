import { Target, Plus } from 'lucide-react'
import { Button } from '@shared/components/ui/Button'

interface EmptyStateProps {
  onCreateGoal: () => void
  hasGoals?: boolean
  completedCount?: number
  totalCount?: number
}

export function EmptyState({ onCreateGoal, hasGoals = false, completedCount = 0, totalCount = 0 }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 p-2 rounded-xl bg-surface-elevated border border-border">
        <Target className="mx-auto h-8 w-8 text-text-muted/30" />
      </div>
      
      <h2 className="mb-2 text-2xl font-bold text-text-primary">
        {hasGoals ? 'Goals completed!' : 'No goals yet'}
      </h2>
      
      <p className="mb-6 max-w-xs text-text-secondary">
        {hasGoals
          ? `You've completed ${completedCount} of ${totalCount} goals. Add more to keep growing!`
          : 'Start by setting your first goal. Choose weekly, monthly, or yearly periods.'}
      </p>

      <Button size="lg" onClick={onCreateGoal} className="w-full sm:w-auto">
        <Plus className="h-5 w-5 mr-2" />
        {hasGoals ? 'Add Another Goal' : 'Create Your First Goal'}
      </Button>
    </div>
  )
}