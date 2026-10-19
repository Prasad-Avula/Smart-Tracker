import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createDateString } from '@shared/types'
import { STORAGE_KEYS } from '@shared/constants'

function isTodayOrFuture(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate >= today
}

interface DateState {
  currentDate: string
  setCurrentDate: (date: Date) => void
  navigateDate: (date: Date) => void
  goToToday: () => void
  goToPreviousDay: () => void
  goToNextDay: () => void
  canGoPrevious: () => boolean
}

export const useDateStore = create<DateState>()(
  persist(
    (set, get) => ({
      currentDate: createDateString(new Date()),

      setCurrentDate: (date: Date) => {
        if (isTodayOrFuture(date)) {
          set({ currentDate: createDateString(date) })
        }
      },

      navigateDate: (date: Date) => {
        if (isTodayOrFuture(date)) {
          set({ currentDate: createDateString(date) })
        }
      },

      goToToday: () => {
        set({ currentDate: createDateString(new Date()) })
      },

      goToPreviousDay: () => {
        const { currentDate } = get()
        const date = new Date(currentDate)
        date.setDate(date.getDate() - 1)
        if (isTodayOrFuture(date)) {
          set({ currentDate: createDateString(date) })
        }
      },

      goToNextDay: () => {
        const { currentDate } = get()
        const date = new Date(currentDate)
        date.setDate(date.getDate() + 1)
        set({ currentDate: createDateString(date) })
      },

      canGoPrevious: () => {
        const { currentDate } = get()
        const date = new Date(currentDate)
        date.setDate(date.getDate() - 1)
        return isTodayOrFuture(date)
      },
    }),
    {
      name: STORAGE_KEYS.LAST_VIEWED_DATE,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const today = createDateString(new Date())
          if (state.currentDate !== today) {
            state.currentDate = today
          }
        }
      },
    }
  )
)