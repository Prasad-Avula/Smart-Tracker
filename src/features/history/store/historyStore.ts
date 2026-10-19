import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { type HistoryTab } from '../types'

interface HistoryState {
  activeTab: HistoryTab
  setActiveTab: (tab: HistoryTab) => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      activeTab: 'daily',
      setActiveTab: (tab: HistoryTab) => set({ activeTab: tab }),
    }),
    {
      name: 'history-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeTab: state.activeTab }),
    }
  )
)