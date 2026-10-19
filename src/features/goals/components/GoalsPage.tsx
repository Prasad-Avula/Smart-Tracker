import { useState, useEffect } from 'react'
import { Plus, Target, CalendarRange, Calendar as CalendarIcon } from 'lucide-react'
import { CircularProgress } from '@shared/components/ui/ProgressBar'
import { Card, CardContent } from '@shared/components/ui/Card'
import { Button } from '@shared/components/ui/Button'
import { useDateStore } from '@features/tasks/store/dateStore'
import { getPeriodKey, getPeriodDateRange, type GoalPeriod } from '../types'
import { useGoals } from '../hooks/useGoals'
import { GoalCard } from './GoalCard'
import { GoalFormModal } from './GoalFormModal'
import { EmptyState } from './EmptyState'
import { cn } from '@shared/utils/cn'
import { formatDate } from '@shared/utils/dateUtils'
import { useParams, useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@shared/hooks/useMediaQuery'

const periodTabs: { key: GoalPeriod; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { key: 'weekly', label: 'Weekly', icon: <CalendarRange className="h-4 w-4" />, shortLabel: 'Week' },
  { key: 'monthly', label: 'Monthly', icon: <CalendarIcon className="h-4 w-4" />, shortLabel: 'Month' },
  { key: 'yearly', label: 'Yearly', icon: <Target className="h-4 w-4" />, shortLabel: 'Year' },
]

export function GoalsPage() {
  const { currentDate } = useDateStore()
  const params = useParams<{ period?: string }>()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 767px)')
  
  // Initialize activePeriod from URL param, default to 'weekly'
  const initialPeriod = (params.period as GoalPeriod) || 'weekly'
  const [activePeriod, setActivePeriod] = useState<GoalPeriod>(initialPeriod)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<ReturnType<typeof useGoals>['goals'][0] | null>(null)

  // Sync URL when activePeriod changes
  const handlePeriodChange = (period: GoalPeriod) => {
    setActivePeriod(period)
    navigate(`/goals/${period}`, { replace: true })
  }

  // Sync activePeriod with URL param when it changes externally (e.g., back/forward, direct link)
  useEffect(() => {
    const urlPeriod = (params.period as GoalPeriod) || 'weekly'
    if (urlPeriod !== activePeriod) {
      setActivePeriod(urlPeriod)
    }
  }, [params.period, activePeriod])

  const periodKey = getPeriodKey(activePeriod, currentDate)
  const { startDate, endDate } = getPeriodDateRange(activePeriod, currentDate)

  const {
    goals,
    loading,
    progress,
    completedCount,
    totalCount,
    createGoal: createGoalAction,
    updateGoal: updateGoalAction,
    deleteGoal: deleteGoalAction,
    toggleGoalStatus,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling,
  } = useGoals(activePeriod, periodKey, currentDate)

  const isAnyLoading = isCreating || isUpdating || isDeleting || isToggling

  const handleCreateGoal = () => {
    setEditingGoal(null)
    setIsModalOpen(true)
  }

  const handleEditGoal = (goal: ReturnType<typeof useGoals>['goals'][0]) => {
    setEditingGoal(goal)
    setIsModalOpen(true)
  }

  const handleSubmitGoal = (data: any) => {
    if (editingGoal) {
      updateGoalAction(editingGoal.id, data).catch(() => {})
    } else {
      createGoalAction({ ...data, period: activePeriod }).catch(() => {})
    }
  }

return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {!isMobile && (
        <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border" role="tablist" aria-label="Goal period">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activePeriod === tab.key}
              aria-controls={tab.key + "-panel"}
              id={tab.key + "-tab"}
              onClick={() => handlePeriodChange(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200',
                activePeriod === tab.key
                  ? 'bg-white text-black shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <span className="flex items-center gap-1">{tab.icon} {tab.label}</span>
            </button>
          ))}
        </div>
      )}

      <Card variant="elevated" className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <CircularProgress value={progress} size={80} strokeWidth={8} variant="primary" showValue />
            </div>
            <div>
              <p className="text-sm text-text-secondary">{activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)} Progress</p>
              <p className="text-sm text-text-muted mt-1">{completedCount} of {totalCount} goals completed</p>
            </div>
          </div>
          <div className="text-center md:text-right flex-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">Period Range</p>
            <p className="font-medium text-text-primary">{formatDate(startDate, 'dd/MM/yyyy')} to {formatDate(endDate, 'dd/MM/yyyy')}</p>
          </div>
        </CardContent>
      </Card>

      {goals.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleCreateGoal} disabled={isAnyLoading} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Goal
          </Button>
        </div>
      )}

      <Card variant="elevated">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : goals.length === 0 ? (
            <EmptyState 
              onCreateGoal={handleCreateGoal} 
              hasGoals={goals.length > 0} 
              completedCount={completedCount}
              totalCount={totalCount}
            />
          ) : (
            <div className="divide-y divide-border">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onToggle={toggleGoalStatus}
                  onEdit={handleEditGoal}
                  onDelete={deleteGoalAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingGoal(null)
        }}
        onSubmit={handleSubmitGoal}
        initialData={editingGoal ?? undefined}
        isEditing={!!editingGoal}
        isLoading={isAnyLoading}
        defaultPeriod={activePeriod}
      />
    </div>
  )
}
