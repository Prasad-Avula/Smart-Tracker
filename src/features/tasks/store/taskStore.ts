import { create } from 'zustand'
import { useAuthStore } from '@features/auth/store/authStore'
import { 
  type TaskWithStatus,
  type CreateTaskInput, 
  type UpdateTaskInput,
  calculateTaskProgress,
  validateMainTaskLimit,
  getStatusWeight
} from '../types'
import { 
  createTask, 
  updateTask, 
  deleteTask, 
  getTasksForDate, 
  updateTaskStatus 
} from '../services'
import { useDateStore } from './dateStore'
import { MAX_MAIN_TASKS_PER_DAY } from '@shared/constants'

interface TaskState {
  tasks: TaskWithStatus[]
  loading: boolean
  error: string | null
  progress: number
  mainCount: number
  sideCount: number
  
  loadToday: () => Promise<void>
  createTask: (data: CreateTaskInput) => Promise<void>
  updateTask: (taskId: string, data: UpdateTaskInput) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  toggleTaskStatus: (taskId: string) => Promise<void>
  cycleTaskStatus: (taskId: string) => Promise<void>
  setError: (error: string | null) => void
  clearError: () => void
}

export const useTaskStore = create<TaskState>()(
  (set, get) => ({
      tasks: [],
      loading: false,
      error: null,
      progress: 0,
      mainCount: 0,
      sideCount: 0,

      loadToday: async () => {
        const { user } = useAuthStore.getState()
        const { currentDate } = useDateStore.getState()
        
        if (!user || !currentDate) {
          set({ tasks: [], progress: 0, mainCount: 0, sideCount: 0, loading: false })
          return
        }

        set({ loading: true, error: null })
        
        try {
          const tasks = await getTasksForDate(user.id, currentDate)
          const { progress, mainCount, sideCount } = calculateTaskProgress(tasks)
          set({ tasks, progress, mainCount, sideCount, loading: false })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load tasks'
          set({ loading: false, error: message })
        }
      },

      createTask: async (data: CreateTaskInput) => {
        const { user } = useAuthStore.getState()
        const { currentDate } = useDateStore.getState()
        
        if (!user || !currentDate) throw new Error('Not authenticated')

        const { mainCount } = get()
        if (!validateMainTaskLimit(mainCount, data.priority)) {
          throw new Error(`Maximum ${MAX_MAIN_TASKS_PER_DAY} main tasks per day`)
        }

        set({ loading: true, error: null })
        
        try {
          await createTask(user.id, data)
          await get().loadToday()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create task'
          set({ loading: false, error: message })
          throw error
        }
      },

      updateTask: async (taskId: string, data: UpdateTaskInput) => {
        const { user } = useAuthStore.getState()
        const { currentDate } = useDateStore.getState()
        
        if (!user || !currentDate) throw new Error('Not authenticated')

        if (data.priority) {
          const { tasks, mainCount } = get()
          const task = tasks.find(t => t.id === taskId)
          if (task && task.priority !== data.priority) {
            const newMainCount = data.priority === 'main' ? mainCount + 1 : mainCount - 1
            if (!validateMainTaskLimit(newMainCount, data.priority)) {
              throw new Error(`Maximum ${MAX_MAIN_TASKS_PER_DAY} main tasks per day`)
            }
          }
        }

        set({ loading: true, error: null })
        
        try {
          await updateTask(user.id, taskId, data)
          await get().loadToday()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update task'
          set({ loading: false, error: message })
          throw error
        }
      },

      deleteTask: async (taskId: string) => {
        const { user } = useAuthStore.getState()
        
        if (!user) throw new Error('Not authenticated')

        set({ loading: true, error: null })
        
        try {
          await deleteTask(user.id, taskId)
          await get().loadToday()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete task'
          set({ loading: false, error: message })
          throw error
        }
      },

      toggleTaskStatus: async (taskId: string) => {
        const { user } = useAuthStore.getState()
        const { currentDate } = useDateStore.getState()
        const { tasks } = get()
        
        if (!user || !currentDate) throw new Error('Not authenticated')

        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        const statuses: TaskWithStatus['status'][] = ['not', 'partial', 'done']
        const currentIndex = statuses.indexOf(task.status)
        const nextStatus = statuses[(currentIndex + 1) % statuses.length]

        set({ loading: true, error: null })
        
        try {
          await updateTaskStatus(user.id, taskId, currentDate, nextStatus)
          
          set((state) => {
            const updatedTasks = state.tasks.map(t => 
              t.id === taskId ? { ...t, status: nextStatus, statusWeight: getStatusWeight(nextStatus) } : t
            )
            const { progress, mainCount, sideCount } = calculateTaskProgress(updatedTasks)
            return { tasks: updatedTasks, loading: false, progress, mainCount, sideCount }
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update status'
          set({ loading: false, error: message })
          throw error
        }
      },

      cycleTaskStatus: async (taskId: string) => {
        return get().toggleTaskStatus(taskId)
      },

      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
    })
)