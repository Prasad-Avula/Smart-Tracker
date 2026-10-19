import { z } from 'zod'
import { type UUID, type DateString, type PeriodKey } from '@shared/types'

export type { PeriodKey } from '@shared/types'

export interface TaskSnapshotItem {
  id: UUID
  text: string
  status: 'completed' | 'partial' | 'not_done'
  priority: 'main' | 'side'
}

export interface GoalSnapshotItem {
  id: UUID
  text: string
  status: 'completed' | 'not_done'
}

export interface DailySnapshot {
  id: UUID
  userId: UUID
  date: DateString
  progress: number
  mainCount: number
  sideCount: number
  totalTasks: number
  completedTasks: number
  partialTasks: number
  tasks: TaskSnapshotItem[]
  createdAt: Date
}

export interface GoalSnapshot {
  id: UUID
  userId: UUID
  periodKey: PeriodKey
  period: 'weekly' | 'monthly' | 'yearly'
  progress: number
  totalGoals: number
  completedGoals: number
  partialGoals: number
  goals: GoalSnapshotItem[]
  createdAt: Date
}

export interface DailySnapshotWithGoals extends DailySnapshot {
  goals: GoalSnapshot[]
}

export type HistoryTab = 'daily' | 'weekly' | 'monthly' | 'yearly'

export const HISTORY_TABS: { key: HistoryTab; label: string; period: 'weekly' | 'monthly' | 'yearly' | null }[] = [
  { key: 'daily', label: 'Daily', period: null },
  { key: 'weekly', label: 'Weekly', period: 'weekly' },
  { key: 'monthly', label: 'Monthly', period: 'monthly' },
  { key: 'yearly', label: 'Yearly', period: 'yearly' },
]

export const createDailySnapshotSchema = z.object({
  date: z.string(),
  progress: z.number().min(0).max(100),
  mainCount: z.number().min(0),
  sideCount: z.number().min(0),
  totalTasks: z.number().min(0),
  completedTasks: z.number().min(0),
  partialTasks: z.number().min(0),
})

export const createGoalSnapshotSchema = z.object({
  periodKey: z.string(),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  progress: z.number().min(0).max(100),
  totalGoals: z.number().min(0),
  completedGoals: z.number().min(0),
  partialGoals: z.number().min(0),
})

export type CreateDailySnapshotInput = z.infer<typeof createDailySnapshotSchema>
export type CreateGoalSnapshotInput = z.infer<typeof createGoalSnapshotSchema>