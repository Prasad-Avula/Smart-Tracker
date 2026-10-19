import { cn } from '@shared/utils/cn'
import type { HistoryTab } from '../types'

interface HistoryTabsProps {
  activeTab: HistoryTab
  onChange: (tab: HistoryTab) => void
  dailyCount?: number
  weeklyCount?: number
  monthlyCount?: number
  yearlyCount?: number
}

const tabConfig = {
  daily: { label: 'Daily', icon: '📅' },
  weekly: { label: 'Weekly', icon: '📊' },
  monthly: { label: 'Monthly', icon: '📈' },
  yearly: { label: 'Yearly', icon: '🎯' },
} as const

export function HistoryTabs({ activeTab, onChange, dailyCount = 0, weeklyCount = 0, monthlyCount = 0, yearlyCount = 0 }: HistoryTabsProps) {
  const counts = { daily: dailyCount, weekly: weeklyCount, monthly: monthlyCount, yearly: yearlyCount }

  return (
    <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border" role="tablist" aria-label="History period">
      {(['daily', 'weekly', 'monthly', 'yearly'] as HistoryTab[]).map((tab) => {
        const config = tabConfig[tab]
        const count = counts[tab]
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`${tab}-panel`}
            id={`${tab}-tab`}
            onClick={() => onChange(tab)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200',
              activeTab === tab
                ? 'bg-white text-black shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
            {count > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs font-medium rounded-full',
                activeTab === tab ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'
              )}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}