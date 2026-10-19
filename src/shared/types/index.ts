export type UUID = string & { readonly __brand: unique symbol };
export type DateString = string & { readonly __brand: unique symbol };
export type PeriodKey = string & { readonly __brand: unique symbol };

export function createUUID(): UUID {
  return crypto.randomUUID() as UUID;
}

export function createDateString(date: Date): DateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as DateString;
}

export function createPeriodKey(
  period: "weekly" | "monthly" | "yearly",
  date: Date,
): PeriodKey {
  const year = date.getFullYear();
  switch (period) {
    case "weekly": {
      const week = getWeekNumber(date);
      return `${year}-W${week.toString().padStart(2, "0")}` as PeriodKey;
    }
    case "monthly":
      return `${year}-${(date.getMonth() + 1).toString().padStart(2, "0")}` as PeriodKey;
    case "yearly":
      return `${year}` as PeriodKey;
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface BaseEntity {
  id: UUID;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends BaseEntity {
  email: string;
  displayName: string;
  photoURL?: string;
  settings: UserSettings;
}

export interface UserSettings {
  theme: "dark" | "light" | "system";
  notifications: NotificationSettings;
  dailyReminderTime?: string; // HH:mm format
  weeklyReminderEnabled: boolean;
  monthlyReminderEnabled: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  taskReminders: boolean;
  goalReminders: boolean;
  weeklySummary: boolean;
  monthlySummary: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: "dark",
  notifications: {
    enabled: true,
    dailyReminder: true,
    taskReminders: true,
    goalReminders: true,
    weeklySummary: false,
    monthlySummary: false,
  },
  weeklyReminderEnabled: false,
  monthlyReminderEnabled: false,
};
