import { useTaskStore } from '../store/taskStore'
import { useDateStore } from '../store/dateStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getTasksForDate, 
  createTask, 
  updateTask, 
  deleteTask, 
  updateTaskStatus,
  updateRecurringTask,
  deleteRecurringTask,
  type RecurringEditMode,
  type CreateTaskInput, 
  type UpdateTaskInput, 
  type TaskWithStatus 
} from '../services'
import { useAuthStore } from '@features/auth/store/authStore'

export const taskKeys = {
  today: (userId: string, date: string) => ['tasks', 'today', userId, date] as const,
  all: () => ['tasks'] as const,
}

import { calculateTaskProgress, MAX_MAIN_TASKS_PER_DAY } from '../types'

export function useTasks() {
  const { firebaseUser } = useAuthStore()
  const { currentDate } = useDateStore()
  const userId = firebaseUser?.uid ?? null
  
  const taskStore = useTaskStore()
  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading, error, refetch } = useQuery<TaskWithStatus[]>({
    queryKey: taskKeys.today(userId || '', currentDate),
    queryFn: () => getTasksForDate(userId!, currentDate),
    enabled: !!userId && !!currentDate,
    staleTime: 1000 * 60 * 5,
  })

  // React Query is the source of truth for this hook. Falling back to the
  // legacy store when the query is empty can restore stale tasks immediately
  // after the last task is deleted.
  const syncedTasks = tasks
  const loading = isLoading || taskStore.loading
  
  // Compute progress from synced tasks (includes React Query optimistic updates)
  const { progress, mainCount, sideCount } = calculateTaskProgress(syncedTasks)

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskInput) => createTask(userId!, data),
    onMutate: async (newTask: CreateTaskInput) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.today(userId!, currentDate) })
      const previousTasks = queryClient.getQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate))
      
      const optimisticTask: TaskWithStatus = {
        id: `temp-${Date.now()}`,
        userId: userId!,
        ...newTask,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'not',
        statusWeight: 0,
      } as TaskWithStatus
      
      queryClient.setQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate), (old) =>
        old ? [...old, optimisticTask] : [optimisticTask]
      )
      
      return { previousTasks }
    },
    onError: (_err: Error, _newTask: CreateTaskInput, context: { previousTasks?: TaskWithStatus[] } | undefined) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.today(userId!, currentDate), context.previousTasks)
      }
    },
    onSuccess: (createdTask) => {
      // Replace the optimistic temp task with the real task (real Firestore ID)
      queryClient.setQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate), (old) =>
        old?.map(t => t.id.startsWith('temp-') ? { ...createdTask, status: 'not', statusWeight: 0 } as TaskWithStatus : t) || []
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.today(userId!, currentDate) })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskInput }) => updateTask(userId!, taskId, data),
    onMutate: async ({ taskId, data }: { taskId: string; data: UpdateTaskInput }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.today(userId!, currentDate) })
      const previousTasks = queryClient.getQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate))
      
      queryClient.setQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate), (old) =>
        old?.map(t => t.id === taskId ? { ...t, ...data } as TaskWithStatus : t) || []
      )
      
      return { previousTasks }
    },
    onError: (_err: Error, _vars: { taskId: string; data: UpdateTaskInput }, context: { previousTasks?: TaskWithStatus[] } | undefined) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.today(userId!, currentDate), context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.today(userId!, currentDate) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(userId!, taskId),
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.today(userId!, currentDate) })
      const previousTasks = queryClient.getQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate))
      
      queryClient.setQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate), (old) =>
        old?.filter(t => t.id !== taskId) || []
      )
      
      return { previousTasks }
    },
    onError: (_err: Error, _taskId: string, context: { previousTasks?: TaskWithStatus[] } | undefined) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.today(userId!, currentDate), context.previousTasks)
      }
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskWithStatus['status'] }) =>
      updateTaskStatus(userId!, taskId, currentDate, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.today(userId!, currentDate) })
      const previousTasks = queryClient.getQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate))
      // Optimistically update the status immediately
      queryClient.setQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate), (old) =>
        (old ?? []).map(t => t.id === taskId ? { ...t, status, statusWeight: ({ not: 0, partial: 0.5, done: 1, skipped: 0 })[status] } : t)
      )
      return { previousTasks }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.today(userId!, currentDate), context.previousTasks)
      }
    },
  })

  const updateRecurringMutation = useMutation({
    mutationFn: ({ taskId, data, mode }: { taskId: string; data: UpdateTaskInput; mode: RecurringEditMode }) => 
      updateRecurringTask(userId!, taskId, data, mode, currentDate),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.today(userId!, currentDate) })
    },
  })

  const deleteRecurringMutation = useMutation({
    mutationFn: ({ taskId, mode }: { taskId: string; mode: RecurringEditMode }) => 
      deleteRecurringTask(userId!, taskId, mode, currentDate),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.today(userId!, currentDate) })
    },
  })

  const loadToday = () => {
    refetch()
  }

  const createTaskAction = async (data: CreateTaskInput) => {
    if (data.priority === 'main' && mainCount >= MAX_MAIN_TASKS_PER_DAY) {
      throw new Error(`Maximum ${MAX_MAIN_TASKS_PER_DAY} main tasks per day`)
    }

    await createMutation.mutateAsync(data)
    taskStore.setError(null)
  }

  const updateTaskAction = async (taskId: string, data: UpdateTaskInput) => {
    if (data.priority === 'main') {
      const existingTask = syncedTasks.find(task => task.id === taskId)
      const existingMainCount = existingTask?.priority === 'main' ? mainCount - 1 : mainCount

      if (existingMainCount >= MAX_MAIN_TASKS_PER_DAY) {
        throw new Error(`Maximum ${MAX_MAIN_TASKS_PER_DAY} main tasks per day`)
      }
    }

    await updateMutation.mutateAsync({ taskId, data })
    taskStore.setError(null)
  }

  const deleteTaskAction = async (taskId: string) => {
    if (!firebaseUser) {
      throw new Error('Not authenticated')
    }
    // Temp IDs from optimistic creates don't exist in Firestore — just remove from cache
    if (taskId.startsWith('temp-')) {
      queryClient.setQueryData<TaskWithStatus[]>(taskKeys.today(userId!, currentDate), (old) =>
        old?.filter(t => t.id !== taskId) || []
      )
      return
    }
    try {
      await deleteMutation.mutateAsync(taskId)
      taskStore.setError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete task'
      taskStore.setError(message)
    }
  }

  const toggleTaskStatus = async (taskId: string) => {
    const task = syncedTasks.find(t => t.id === taskId)
    if (!task) return
    
    const statuses: TaskWithStatus['status'][] = ['not', 'partial', 'done']
    const currentIndex = statuses.indexOf(task.status)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]
    
    await statusMutation.mutateAsync({ taskId, status: nextStatus })
    taskStore.setError(null)
  }

  const cycleTaskStatus = async (taskId: string) => {
    await toggleTaskStatus(taskId)
  }

  const updateRecurringTaskAction = async (taskId: string, data: UpdateTaskInput, mode: RecurringEditMode) => {
    await updateRecurringMutation.mutateAsync({ taskId, data, mode })
    taskStore.setError(null)
  }

  const deleteRecurringTaskAction = async (taskId: string, mode: RecurringEditMode) => {
    await deleteRecurringMutation.mutateAsync({ taskId, mode })
    taskStore.setError(null)
  }

  const setError = (error: string | null) => taskStore.setError(error)
  const clearError = () => taskStore.clearError()

  return {
    tasks: syncedTasks,
    loading,
    error: error?.message || taskStore.error,
    progress,
    mainCount,
    sideCount,
    loadToday,
    createTask: createTaskAction,
    updateTask: updateTaskAction,
    deleteTask: deleteTaskAction,
    updateRecurringTask: updateRecurringTaskAction,
    deleteRecurringTask: deleteRecurringTaskAction,
    toggleTaskStatus,
    cycleTaskStatus,
    setError,
    clearError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: statusMutation.isPending,
    isUpdatingRecurring: updateRecurringMutation.isPending,
    isDeletingRecurring: deleteRecurringMutation.isPending,
  }
}
