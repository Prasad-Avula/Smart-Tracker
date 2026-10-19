export const APP_NAME = 'Smart Task & Goal Tracker'
export const APP_DESCRIPTION = 'Daily task and goal tracking with history snapshots'

export const MAX_MAIN_TASKS_PER_DAY = 4

export const TASK_PRIORITY_WEIGHTS = {
  main: 2,
  side: 1
} as const

export const STATUS_WEIGHTS = {
  not: 0,
  partial: 0.5,
  done: 1,
  skipped: 0
} as const

export const TASK_TYPES = ['once', 'recurring'] as const
export const TASK_PRIORITIES = ['main', 'side'] as const
export const TASK_STATUSES = ['not', 'partial', 'done', 'skipped'] as const

export const GOAL_PERIODS = ['weekly', 'monthly', 'yearly'] as const

export const STORAGE_KEYS = {
  THEME: 'task-tracker-theme',
  LAST_VIEWED_DATE: 'task-tracker-last-date',
  ONBOARDING_COMPLETE: 'task-tracker-onboarding',
  NOTIFICATION_PERMISSION: 'task-tracker-notif-perm'
} as const

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  TASK_STATUS: 'taskStatus',
  GOALS: 'goals',
  GOAL_STATUS: 'goalStatus',
  DAILY_HISTORY: 'dailyHistory',
  GOAL_HISTORY: 'goalHistory'
} as const

export const TASKS_COLLECTION = FIRESTORE_COLLECTIONS.TASKS
export const TASK_STATUS_COLLECTION = FIRESTORE_COLLECTIONS.TASK_STATUS

export const ROUTES = {
  HOME: '/',
  TASKS: '/tasks',
  GOALS: '/goals',
  HISTORY: '/history',
  SETTINGS: '/settings',
  LOGIN: '/login',
  SIGNUP: '/signup'
} as const