import { create } from "zustand";
import { useAuthStore } from "@features/auth/store/authStore";
import {
  type GoalWithStatus,
  type CreateGoalInput,
  type UpdateGoalInput,
  type GoalPeriod,
  calculateGoalProgress,
  getStatusWeight,
} from "../types";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalsForPeriod,
  updateGoalStatus,
} from "../services/goalService";

interface GoalState {
  goals: GoalWithStatus[];
  loading: boolean;
  error: string | null;
  progress: number;
  completedCount: number;
  totalCount: number;

  loadGoals: (period: GoalPeriod, periodKey: string, referenceDate?: string) => Promise<void>;
  createGoal: (data: CreateGoalInput) => Promise<void>;
  updateGoal: (goalId: string, data: UpdateGoalInput) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  toggleGoalStatus: (goalId: string, periodKey: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useGoalStore = create<GoalState>()(
  (set, get) => ({
      goals: [],
      loading: false,
      error: null,
      progress: 0,
      completedCount: 0,
      totalCount: 0,

      loadGoals: async (period: GoalPeriod, periodKey: string, referenceDate?: string) => {
        const { user } = useAuthStore.getState();

        if (!user) {
          set({
            goals: [],
            progress: 0,
            completedCount: 0,
            totalCount: 0,
            loading: false,
          });
          return;
        }

        set({ loading: true, error: null });

        try {
          const goals = await getGoalsForPeriod(user.id, period, periodKey, referenceDate);
          const { progress, completedCount, totalCount } =
            calculateGoalProgress(goals);
          set({ goals, progress, completedCount, totalCount, loading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load goals";
          set({ loading: false, error: message });
        }
      },

      createGoal: async (data: CreateGoalInput) => {
        const { user } = useAuthStore.getState();

        if (!user) throw new Error("Not authenticated");

        set({ loading: true, error: null });

        try {
          await createGoal(user.id, data);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to create goal";
          set({ loading: false, error: message });
          throw error;
        }
      },

      updateGoal: async (goalId: string, data: UpdateGoalInput) => {
        const { user } = useAuthStore.getState();

        if (!user) throw new Error("Not authenticated");

        set({ loading: true, error: null });

        try {
          await updateGoal(user.id, goalId, data);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update goal";
          set({ loading: false, error: message });
          throw error;
        }
      },

      deleteGoal: async (goalId: string) => {
        const { user } = useAuthStore.getState();

        if (!user) throw new Error("Not authenticated");

        set({ loading: true, error: null });

        try {
          await deleteGoal(user.id, goalId);
          set((state) => {
            const updatedGoals = state.goals.filter((g) => g.id !== goalId);
            const { progress, completedCount, totalCount } =
              calculateGoalProgress(updatedGoals);
            return {
              goals: updatedGoals,
              loading: false,
              progress,
              completedCount,
              totalCount,
            };
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to delete goal";
          set({ loading: false, error: message });
          throw error;
        }
      },

      toggleGoalStatus: async (goalId: string, periodKey: string) => {
        const { user } = useAuthStore.getState();
        const { goals } = get();

        if (!user) throw new Error("Not authenticated");

        const goal = goals.find((g) => g.id === goalId);
        if (!goal) return;

        const statuses: GoalWithStatus["status"][] = ["not", "done"];
        const currentIndex = statuses.indexOf(goal.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];

        set({ loading: true, error: null });

        try {
          await updateGoalStatus(user.id, goalId, periodKey, nextStatus);

          set((state) => {
            const updatedGoals = state.goals.map((g) =>
              g.id === goalId
                ? {
                    ...g,
                    status: nextStatus,
                    statusWeight: getStatusWeight(nextStatus),
                  }
                : g,
            );
            const { progress, completedCount, totalCount } =
              calculateGoalProgress(updatedGoals);
            return {
              goals: updatedGoals,
              loading: false,
              progress,
              completedCount,
              totalCount,
            };
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update status";
          set({ loading: false, error: message });
          throw error;
        }
      },

      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
    })
)
