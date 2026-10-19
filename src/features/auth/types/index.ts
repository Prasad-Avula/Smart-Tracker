import { type User as FirebaseUser } from 'firebase/auth'
import { type UUID, type BaseEntity } from '@shared/types'

export interface User extends BaseEntity {
  id: UUID
  email: string
  displayName: string
  photoURL?: string
  settings: UserSettings
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system'
  notifications: NotificationSettings
  dailyReminderTime?: string
  weeklyReminderEnabled: boolean
  monthlyReminderEnabled: boolean
}

export interface NotificationSettings {
  enabled: boolean
  dailyReminder: boolean
  taskReminders: boolean
  goalReminders: boolean
  weeklySummary: boolean
  monthlySummary: boolean
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'dark',
  notifications: {
    enabled: true,
    dailyReminder: true,
    taskReminders: true,
    goalReminders: true,
    weeklySummary: false,
    monthlySummary: false
  },
  weeklyReminderEnabled: false,
  monthlyReminderEnabled: false
}

export interface AuthState {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  error: string | null
  initialized: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  displayName: string
  confirmPassword: string
}

export interface AuthFormErrors {
  email?: string
  password?: string
  displayName?: string
  confirmPassword?: string
  general?: string
}