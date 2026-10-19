import { type Task, type TaskWithStatus, type CreateTaskInput, type UpdateTaskInput, type RecurringEditMode, type TaskStatus, type UUID, type DateString } from '../types'
import { getStatusWeight, getDatesInRange, isTaskActiveOnDate, taskStatusId, calculateTaskProgress, validateMainTaskLimit, MAX_MAIN_TASKS_PER_DAY } from '../types'

// Import real services
import { 
  createTask,
  updateTask,
  deleteTask,
  getTasksForDate,
  updateTaskStatus,
  getTasksInDateRange,
  updateRecurringTask,
  deleteRecurringTask,
} from './taskService'

// Export types
export type { 
  Task, 
  TaskWithStatus, 
  CreateTaskInput, 
  UpdateTaskInput, 
  RecurringEditMode,
  TaskStatus,
  UUID,
  DateString,
}
export { 
  getStatusWeight, 
  getDatesInRange, 
  isTaskActiveOnDate, 
  taskStatusId,
  calculateTaskProgress,
  validateMainTaskLimit,
  MAX_MAIN_TASKS_PER_DAY,
}

// Export services
export { 
  createTask,
  updateTask,
  deleteTask,
  getTasksForDate,
  updateTaskStatus,
  getTasksInDateRange,
  updateRecurringTask,
  deleteRecurringTask,
}