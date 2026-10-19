import { useHistoryStore } from "../store/historyStore";
import { useQuery } from "@tanstack/react-query";
import {
  getDailySnapshots,
  getGoalSnapshots,
  getAllGoalSnapshots,
  getDailySnapshotForDate,
  createDailySnapshot,
  createGoalSnapshot,
} from "../services/historyService";
import { useAuthStore } from "@features/auth/store/authStore";
import type { TaskWithStatus } from "@features/tasks/types";
import type { GoalWithStatus } from "@features/goals/types";
import type { DailySnapshot, GoalSnapshot } from "../types";

export const historyKeys = {
  daily: (userId: string) => ["history", "daily", userId] as const,
  goals: (userId: string, period: string) =>
    ["history", "goals", userId, period] as const,
  allGoals: (userId: string) => ["history", "allGoals", userId] as const,
};

export function useDailySnapshots(limitCount: number = 30) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: historyKeys.daily(user?.id || ""),
    queryFn: () => getDailySnapshots(user!.id, limitCount),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGoalSnapshots(
  period: "weekly" | "monthly" | "yearly",
  limitCount: number = 12,
) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: historyKeys.goals(user?.id || "", period),
    queryFn: () => getGoalSnapshots(user!.id, period, limitCount),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAllGoalSnapshots(limitCount: number = 36) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: historyKeys.allGoals(user?.id || ""),
    queryFn: () => getAllGoalSnapshots(user!.id, limitCount),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHistory() {
  const { activeTab, setActiveTab } = useHistoryStore();
  const dailySnapshots = useDailySnapshots();
  const weeklySnapshots = useGoalSnapshots("weekly");
  const monthlySnapshots = useGoalSnapshots("monthly");
  const yearlySnapshots = useGoalSnapshots("yearly");
  const allGoalSnapshots = useAllGoalSnapshots();

  // Only consider loading/error for the active tab
  const activeSnapshot =
    activeTab === "daily"
      ? dailySnapshots
      : activeTab === "weekly"
      ? weeklySnapshots
      : activeTab === "monthly"
      ? monthlySnapshots
      : yearlySnapshots;

  const { user } = useAuthStore();

  const createDaily = async (
    date: string,
    tasks: TaskWithStatus[]
  ): Promise<DailySnapshot | null> => {
    if (!user) return null;
    const existing = await getDailySnapshotForDate(user.id, date);
    if (existing) return existing;
    return createDailySnapshot(user.id, date, tasks);
  };

  const createGoal = async (
    periodKey: string,
    period: 'weekly' | 'monthly' | 'yearly',
    goals: GoalWithStatus[]
  ): Promise<GoalSnapshot | null> => {
    if (!user) return null;
    return createGoalSnapshot(user.id, periodKey, period, goals);
  };

  return {
    activeTab,
    setActiveTab,
    dailySnapshots: dailySnapshots.data || [],
    weeklySnapshots: weeklySnapshots.data || [],
    monthlySnapshots: monthlySnapshots.data || [],
    yearlySnapshots: yearlySnapshots.data || [],
    allGoalSnapshots: allGoalSnapshots.data || [],
    isLoading: activeSnapshot.isLoading,
    error: activeSnapshot.error,
    createDailySnapshot: createDaily,
    createGoalSnapshot: createGoal,
  };
}
