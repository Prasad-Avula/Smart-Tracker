import { useGoalStore } from '../store/goalStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getGoalsForPeriod, 
  createGoal, 
  updateGoal, 
  deleteGoal, 
  updateGoalStatus
} from '../services/goalService'
import { useAuthStore } from '@features/auth/store/authStore'
import { type CreateGoalInput, type UpdateGoalInput, type GoalWithStatus, type GoalStatus, type GoalPeriod, calculateGoalProgress } from '../types'
import { type UUID, type DateString } from '@shared/types'

export const goalsKeys = {
  period: (userId: string, period: GoalPeriod, periodKey: string) => ['goals', 'period', userId, period, periodKey] as const,
  all: () => ['goals'] as const,
}

export function useGoals(period: GoalPeriod, periodKey: string, referenceDate: string) {
  const { user } = useAuthStore()
  const goalStore = useGoalStore()
  const queryClient = useQueryClient()

  const { data: goals = [], isLoading, error, refetch } = useQuery({
    queryKey: goalsKeys.period(user?.id || '', period, periodKey),
    queryFn: () => getGoalsForPeriod(user!.id, period, periodKey, referenceDate),
    enabled: !!user && !!periodKey && !!referenceDate,
    staleTime: 1000 * 60 * 5,
  })

  // The query is authoritative for the selected period. Falling back to the
  // global store caused goals from the previously viewed tab to leak into an
  // empty monthly or yearly tab.
  const syncedGoals = goals
  const loading = isLoading || goalStore.loading
  
  // Compute progress from synced goals (includes React Query optimistic updates)
  const { progress, completedCount, totalCount } = calculateGoalProgress(syncedGoals)

  const createMutation = useMutation({
    mutationFn: (data: CreateGoalInput) => createGoal(user!.id, data),
    onMutate: async (newGoal: CreateGoalInput) => {
      await queryClient.cancelQueries({ queryKey: goalsKeys.period(user!.id, period, periodKey) })
      const previousGoals = queryClient.getQueryData<GoalWithStatus[]>(goalsKeys.period(user!.id, period, periodKey))
      
      const optimisticGoal: GoalWithStatus = {
        id: ('temp-' + Date.now()) as UUID,
        userId: user!.id,
        title: newGoal.title,
        period: newGoal.period,
        startDate: (newGoal.startDate ?? '') as DateString,
        endDate: newGoal.endDate as DateString,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'not',
        statusWeight: 0,
      }
      
      queryClient.setQueryData<GoalWithStatus[]>(goalsKeys.period(user!.id, period, periodKey), (old) =>
        old ? [...old, optimisticGoal] : [optimisticGoal]
      )
      
      return { previousGoals }
    },
    onError: (_err: Error, _newGoal: CreateGoalInput, context: { previousGoals?: GoalWithStatus[] } | undefined) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsKeys.period(user!.id, period, periodKey), context.previousGoals)
      }
    },
    onSuccess: (createdGoal) => {
      queryClient.setQueryData<GoalWithStatus[]>(goalsKeys.period(user!.id, period, periodKey), (old) =>
        old?.map(g => g.id.startsWith('temp-') ? { ...createdGoal, status: 'not', statusWeight: 0 } as GoalWithStatus : g) || []
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: UpdateGoalInput }) => updateGoal(user!.id, goalId, data),
    onMutate: async ({ goalId, data }: { goalId: string; data: UpdateGoalInput }) => {
      await queryClient.cancelQueries({ queryKey: goalsKeys.period(user!.id, period, periodKey) })
      const previousGoals = queryClient.getQueryData<GoalWithStatus[]>(goalsKeys.period(user!.id, period, periodKey))
      
      queryClient.setQueryData<GoalWithStatus[]>(goalsKeys.period(user!.id, period, periodKey), (old) =>
        old?.map(g => g.id === goalId ? { ...g, ...data } as GoalWithStatus : g) || []
      )
      
      return { previousGoals }
    },
    onError: (_err: Error, _vars: { goalId: string; data: UpdateGoalInput }, context: { previousGoals?: GoalWithStatus[] } | undefined) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsKeys.period(user!.id, period, periodKey), context.previousGoals)
      }
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => deleteGoal(user!.id, goalId),
    onMutate: async (goalId: string) => {
      await queryClient.cancelQueries({ queryKey: goalsKeys.period(user!.id, period, periodKey) })
      const previousGoals = queryClient.getQueryData<GoalWithStatus[]>(goalsKeys.period(user!.id, period, periodKey))
      
      queryClient.setQueryData<GoalWithStatus[]>(goalsKeys.period(user!.id, period, periodKey), (old) =>
        old?.filter(g => g.id !== goalId) || []
      )
      
      return { previousGoals }
    },
    onError: (_err: Error, _goalId: string, context: { previousGoals?: GoalWithStatus[] } | undefined) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsKeys.period(user!.id, period, periodKey), context.previousGoals)
      }
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: GoalWithStatus['status'] }) => 
      updateGoalStatus(user!.id, goalId, periodKey, status),
    onMutate: async ({ goalId, status }: { goalId: string; status: GoalWithStatus['status'] }) => {
      await queryClient.cancelQueries({ queryKey: goalsKeys.period(user!.id, period, periodKey) })
      const previousGoals = queryClient.getQueryData<GoalWithStatus[]>(goalsKeys.period(user!.id, period, periodKey))
      
      const statusWeights: Record<GoalStatus, number> = { not: 0, done: 1 }
      
      queryClient.setQueryData<GoalWithStatus[]>(goalsKeys.period(user!.id, period, periodKey), (old) =>
        old?.map(g => 
          g.id === goalId ? { ...g, status, statusWeight: statusWeights[status] } as GoalWithStatus : g
        ) || []
      )
      
      return { previousGoals }
    },
    onError: (_err: Error, _vars: { goalId: string; status: GoalWithStatus['status'] }, context: { previousGoals?: GoalWithStatus[] } | undefined) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsKeys.period(user!.id, period, periodKey), context.previousGoals)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.period(user!.id, period, periodKey) })
    },
  })

  const loadGoals = () => {
    refetch()
  }

  const createGoalAction = async (data: CreateGoalInput) => {
    await createMutation.mutateAsync(data)
    goalStore.setError(null)
  }

  const updateGoalAction = async (goalId: string, data: UpdateGoalInput) => {
    await updateMutation.mutateAsync({ goalId, data })
    goalStore.setError(null)
  }

  const deleteGoalAction = async (goalId: string) => {
    await deleteMutation.mutateAsync(goalId)
    goalStore.setError(null)
  }

  const toggleGoalStatus = async (goalId: string) => {
    const goal = syncedGoals.find(g => g.id === goalId)
    if (!goal) return
    
    const nextStatus = goal.status === 'not' ? 'done' : 'not'
    
    await statusMutation.mutateAsync({ goalId, status: nextStatus })
    goalStore.setError(null)
  }

  const setError = (error: string | null) => goalStore.setError(error)
  const clearError = () => goalStore.clearError()

  return {
    goals: syncedGoals,
    loading,
    error: error?.message || goalStore.error,
    progress,
    completedCount,
    totalCount,
    loadGoals,
    createGoal: createGoalAction,
    updateGoal: updateGoalAction,
    deleteGoal: deleteGoalAction,
    toggleGoalStatus,
    setError,
    clearError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: statusMutation.isPending,
  }
}
