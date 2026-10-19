import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { ensureHistorySnapshotsForUser } from '@features/history/services/historyService'
import { useDateStore } from '@features/tasks/store/dateStore'
import { getTodayKey } from '@shared/utils/dateUtils'

export function useAuth() {
  const { 
    user, 
    firebaseUser, 
    loading, 
    error, 
    initialized,
    login, 
    signup, 
    logout, 
    deleteAccount,
    setError, 
    clearError,
    initialize,
    updateUserSettings
  } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    user,
    firebaseUser,
    loading,
    error,
    initialized,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    deleteAccount,
    setError,
    clearError,
    updateUserSettings
  }
}

export function useAuthState() {
  const { user, firebaseUser, loading, initialized, isAuthenticated } = useAuth()
  return { user, firebaseUser, loading, initialized, isAuthenticated }
}

// AuthProvider component to initialize auth on app mount
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, user, firebaseUser, initialized } = useAuthStore()
  const queryClient = useQueryClient()
  
  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    // Wait for Firebase Auth restoration, not just the persisted Zustand user.
    // Otherwise a refresh could attempt Firestore writes before request.auth
    // exists and never retry because the user ID stays the same.
    if (!initialized || !firebaseUser || !user?.id) return

    const runHistoryCatchUp = () => {
      void ensureHistorySnapshotsForUser(user.id)
        .then(() => queryClient.invalidateQueries({ queryKey: ['history'] }))
        .catch((error) => {
          // History catch-up should not prevent the rest of the app from loading.
          console.warn('History catch-up failed:', error)
        })
    }

    const rollOverDateIfNeeded = () => {
      const { currentDate, goToToday } = useDateStore.getState()
      if (currentDate < getTodayKey()) {
        goToToday()
      }
    }

    const runAtMidnight = () => {
      rollOverDateIfNeeded()
      runHistoryCatchUp()
      scheduleNextMidnightCheck()
    }

    let timeoutId: number
    const scheduleNextMidnightCheck = () => {
      const nextMidnight = new Date()
      nextMidnight.setHours(24, 0, 0, 0)
      timeoutId = window.setTimeout(runAtMidnight, Math.max(1000, nextMidnight.getTime() - Date.now() + 1000))
    }

    rollOverDateIfNeeded()
    runHistoryCatchUp()
    scheduleNextMidnightCheck()

    return () => window.clearTimeout(timeoutId)
  }, [firebaseUser, initialized, queryClient, user?.id])
  
  return <>{children}</>
}
