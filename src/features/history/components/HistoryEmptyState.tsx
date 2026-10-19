import { Calendar, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@shared/components/ui/Card'
import type { HistoryTab } from '../types'

interface EmptyStateProps {
  activeTab: HistoryTab
}

const emptyMessages = {
  daily: {
    title: 'No daily snapshots yet',
    description: 'Daily snapshots are created automatically each night. Check back tomorrow!',
    icon: Calendar,
  },
  weekly: {
    title: 'No weekly goal snapshots yet',
    description: 'Weekly goal progress snapshots are created at the end of each week.',
    icon: Target,
  },
  monthly: {
    title: 'No monthly goal snapshots yet',
    description: 'Monthly goal progress snapshots are created at the end of each month.',
    icon: TrendingUp,
  },
  yearly: {
    title: 'No yearly goal snapshots yet',
    description: 'Yearly goal progress snapshots are created at the end of each year.',
    icon: TrendingUp,
  },
}

export function HistoryEmptyState({ activeTab }: EmptyStateProps) {
  const { title, description, icon: Icon } = emptyMessages[activeTab]

  return (
    <Card variant="elevated">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-6 p-4 rounded-2xl bg-surface-elevated border border-border">
          <Icon className="mx-auto h-16 w-16 text-text-muted/30" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-text-primary">{title}</h3>
        <p className="text-text-secondary max-w-md">{description}</p>
      </CardContent>
    </Card>
  )
}