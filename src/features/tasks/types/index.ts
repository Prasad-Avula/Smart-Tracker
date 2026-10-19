import { z } from 'zod'
import { type UUID, type DateString, type BaseEntity, createDateString } from '@shared/types'
import { TASK_PRIORITY_WEIGHTS, STATUS_WEIGHTS, TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES, MAX_MAIN_TASKS_PER_DAY } from '@shared/constants'
import { getTodayKey } from '@shared/utils/dateUtils'

export type TaskType = 'once' | 'recurring'
export type RecurringEditMode = 'this_day' | 'all_future'

// Re-export branded types for convenience
export type { UUID, DateString } from '@shared/types'
export { MAX_MAIN_TASKS_PER_DAY } from '@shared/constants'
export type TaskPriority = 'main' | 'side'
export type TaskStatus = 'not' | 'partial' | 'done' | 'skipped'

export interface Task extends BaseEntity {
  id: UUID
  userId: UUID
  title: string
  type: TaskType
  priority: TaskPriority
  /** Local calendar date on which the task was created. */
  createdDate?: DateString
  specificDate?: DateString
  startDate?: DateString
  endDate?: DateString
  isRecurringOverride?: boolean
  originalTaskId?: UUID
}

export interface TaskStatusDoc {
  id: string
  userId: UUID
  taskId: UUID
  date: DateString
  status: TaskStatus
  statusWeight: number
  isSkipped?: boolean
  updatedAt: Date
}

export interface TaskWithStatus extends Task {
  status: TaskStatus
  statusWeight: number
  isSkipped?: boolean
}

// Zod schemas
const baseTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  type: z.enum(TASK_TYPES),
  priority: z.enum(TASK_PRIORITIES),
  specificDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const createTaskSchema = baseTaskSchema.refine((data) => {
  if (data.type === 'once') {
    return !!data.specificDate
  }
  return !!data.endDate
}, {
  message: 'Recurring tasks require an end date',
  path: ['endDate'],
}).refine((data) => {
  if (data.type === 'recurring' && data.startDate && data.endDate) {
    return data.startDate <= data.endDate
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export const updateTaskSchema = baseTaskSchema.partial()

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

// Status update schema
export const updateStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
})

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

// Progress calculation
export function calculateTaskProgress(tasks: TaskWithStatus[]): {
  progress: number
  mainCount: number
  sideCount: number
  completedWeight: number
  totalWeight: number
} {
  let completedWeight = 0
  let totalWeight = 0
  let mainCount = 0
  let sideCount = 0

  for (const task of tasks) {
    const weight = TASK_PRIORITY_WEIGHTS[task.priority]
    totalWeight += weight
    completedWeight += task.statusWeight * weight

    if (task.priority === 'main') mainCount++
    else sideCount++
  }

  const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0

  return { progress, mainCount, sideCount, completedWeight, totalWeight }
}

// Status weight helper
export function getStatusWeight(status: TaskStatus): number {
  return STATUS_WEIGHTS[status]
}

// Validation helpers
export function validateMainTaskLimit(currentMainTasks: number, newTaskPriority: TaskPriority): boolean {
  if (newTaskPriority === 'main') {
    return currentMainTasks < MAX_MAIN_TASKS_PER_DAY
  }
  return true
}

/**
 * A one-time task may be removed before its scheduled day, or on its
 * scheduled day only when it was created that same day. This preserves the
 * task history once the task's day has started.
 *
 * Recurring tasks retain their existing three-day deletion window.
 */
export function canDeleteTask(task: Task, today: DateString = getTodayKey() as DateString): boolean {
  if (task.type === 'once') {
    if (!task.specificDate) return false

    const createdDate = task.createdDate ?? createDateString(task.createdAt)
    return task.specificDate > today || (task.specificDate === today && createdDate === today)
  }

  const createdAt = task.createdAt.getTime()
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - createdAt) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 3
}

// Date range helpers
export function getDatesInRange(startDate: DateString, endDate: DateString): DateString[] {
  const dates: DateString[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(createDateString(d))
  }

  return dates
}

export function isTaskActiveOnDate(task: Task, date: DateString): boolean {
  if (task.type === 'once') {
    return task.specificDate === date
  }
  if (task.type === 'recurring') {
    const startDate = task.startDate || getTodayKey()
    if (task.endDate) {
      return date >= startDate && date <= task.endDate
    }
    // no endDate → active indefinitely from startDate
    return date >= startDate
  }
  return false
}

// Status document ID helper
export function taskStatusId(userId: string, date: string, taskId: string): string {
  return `${userId}_${date}_${taskId}`
}
