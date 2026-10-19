import { z } from "zod";
import {
  type UUID,
  type DateString,
  type PeriodKey,
  createDateString,
  createPeriodKey,
} from "@shared/types";
import { GOAL_PERIODS } from "@shared/constants";

export type GoalPeriod = "weekly" | "monthly" | "yearly";
export type GoalStatus = "not" | "done";

export interface Goal {
  id: UUID;
  userId: UUID;
  title: string;
  period: GoalPeriod;
  startDate: DateString;
  endDate: DateString;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalStatusDoc {
  id: string;
  userId: UUID;
  goalId: UUID;
  periodKey: PeriodKey;
  status: GoalStatus;
  statusWeight: number;
  updatedAt: Date;
}

export interface GoalWithStatus extends Goal {
  status: GoalStatus;
  statusWeight: number;
}

const baseGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  period: z.enum(GOAL_PERIODS),
  startDate: z.string().optional(),
  endDate: z.string(),
});

export const createGoalSchema = baseGoalSchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  },
);

export const updateGoalSchema = baseGoalSchema.partial();

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const updateGoalStatusSchema = z.object({
  status: z.enum(["not", "done"]),
});

export type UpdateGoalStatusInput = z.infer<typeof updateGoalStatusSchema>;

export const STATUS_WEIGHTS = {
  not: 0,
  done: 1,
} as const;

export function getStatusWeight(status: GoalStatus): number {
  return STATUS_WEIGHTS[status];
}

export function calculateGoalProgress(goals: GoalWithStatus[]): {
  progress: number;
  completedCount: number;
  totalCount: number;
} {
  let completedWeight = 0;
  let totalWeight = 0;

  for (const goal of goals) {
    totalWeight += 1;
    completedWeight += goal.statusWeight;
  }

  const progress =
    totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  return {
    progress,
    completedCount: goals.filter((g) => g.status === "done").length,
    totalCount: goals.length,
  };
}

export function getPeriodKey(period: GoalPeriod, date: Date | string): PeriodKey {
  const dateObj = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return createPeriodKey(period, dateObj);
}

export function getPeriodDateRange(
  period: GoalPeriod,
  date: Date | string,
): { startDate: DateString; endDate: DateString } {
  // Use local noon to avoid timezone issues (midnight UTC = previous day in US)
  const dateObj = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  const start = new Date(dateObj);
  const end = new Date(dateObj);

  switch (period) {
    case "weekly": {
      const day = start.getDay(); // 0 = Sunday, 1 = Monday, ...
      // Days to subtract to get to Sunday (0 for Sunday, 1 for Monday, etc.)
      const daysToSunday = day;
      start.setDate(start.getDate() - daysToSunday);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "monthly": {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "yearly": {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return {
    startDate: createDateString(start),
    endDate: createDateString(end),
  };
}

/**
 * Returns the only valid end date for a fixed-period goal, or validates the
 * user-selected end date for a yearly goal.
 */
export function getGoalEndDateForPeriod(
  period: GoalPeriod,
  requestedEndDate: string | undefined,
  referenceDate: Date = new Date(),
): DateString {
  if (period !== "yearly") {
    return getPeriodDateRange(period, referenceDate).endDate;
  }

  const { startDate, endDate: yearEndDate } = getPeriodDateRange("yearly", referenceDate);
  if (!requestedEndDate || requestedEndDate < startDate || requestedEndDate > yearEndDate) {
    throw new Error("Yearly goal end date must be within the current year");
  }

  return requestedEndDate as DateString;
}

export function getPeriodKeyFromDate(
  period: GoalPeriod,
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

export function goalStatusId(
  userId: string,
  periodKey: string,
  goalId: string,
): string {
  return `${userId}_${periodKey}_${goalId}`;
}
