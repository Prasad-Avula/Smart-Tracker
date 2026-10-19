import { useState, useEffect } from 'react'
import { Clock, Calendar, Target, TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@shared/components/ui/Card'
import { cn } from '@shared/utils/cn'
import { useHistory } from '../hooks/useHistory'
import { useHistoryStore } from '../store/historyStore'
import { SnapshotCard } from './SnapshotCard'
import { HistoryTabs } from './HistoryTabs'
import { HistoryEmptyState } from './HistoryEmptyState'
import type { HistoryTab, GoalSnapshot, DailySnapshot } from '../types'
import { useParams, useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@shared/hooks/useMediaQuery'

export function HistoryPage() {
  const { activeTab, setActiveTab } = useHistoryStore()
  const { 
    dailySnapshots, 
    weeklySnapshots, 
    monthlySnapshots, 
    yearlySnapshots,
    isLoading,
    error,
  } = useHistory()

  const params = useParams<{ period?: string }>()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 767px)')
  
  // Initialize activeTab from URL param, default to 'daily'
  const initialTab = (params.period as HistoryTab) || 'daily'
  const [activeTabLocal, setActiveTabLocal] = useState<HistoryTab>(initialTab)

  // Sync URL when activeTab changes
  const handleTabChange = (tab: HistoryTab) => {
    setActiveTabLocal(tab)
    setActiveTab(tab)
    navigate(`/history/${tab}`, { replace: true })
  }

  // Sync local state with URL on mount and when params change
  useEffect(() => {
    const urlTab = (params.period as HistoryTab) || 'daily'
    if (urlTab !== activeTabLocal) {
      setActiveTabLocal(urlTab)
      setActiveTab(urlTab)
    }
  }, [params.period, activeTabLocal])

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const handleToggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getSnapshotsForTab = (tab: HistoryTab) => {
    switch (tab) {
      case 'daily': return dailySnapshots
      case 'weekly': return weeklySnapshots
      case 'monthly': return monthlySnapshots
      case 'yearly': return yearlySnapshots
    }
  }

  const snapshots = getSnapshotsForTab(activeTab)
  const counts = {
    dailyCount: dailySnapshots.length,
    weeklyCount: weeklySnapshots.length,
    monthlyCount: monthlySnapshots.length,
    yearlyCount: yearlySnapshots.length,
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Card variant="outlined" className="border-danger/50 bg-danger/5">
          <CardContent className="p-6 text-center">
            <p className="text-text-secondary mb-4">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {!isMobile && (
        <HistoryTabs 
          activeTab={activeTabLocal} 
          onChange={handleTabChange}
          {...counts}
        />
      )}

      <Card variant="elevated">
        <CardContent className="p-0">
          {snapshots.length === 0 ? (
            <HistoryEmptyState activeTab={activeTab} />
          ) : (
            <div className="divide-y divide-border">
              {snapshots.map((snapshot: DailySnapshot | GoalSnapshot) => (
                <SnapshotCard
                  key={snapshot.id}
                  snapshot={snapshot}
                  type={activeTab === 'daily' ? 'daily' : 'goal'}
                  isExpanded={expandedCards.has(snapshot.id)}
                  onToggle={() => handleToggleExpand(snapshot.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(activeTab !== 'daily' && snapshots.length > 0) && (
        <Card variant="outlined" className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="Total Periods" 
                value={snapshots.length} 
                icon={<Target className="h-5 w-5" />} 
                color="text-purple"
              />
              {(() => {
                const goalSnapshots = snapshots as GoalSnapshot[];
                return (
                  <>
                    <StatCard 
                      label="Avg Progress" 
                      value={`${Math.round(goalSnapshots.reduce((acc: number, s) => acc + s.progress, 0) / goalSnapshots.length)}%`} 
                      icon={<TrendingUp className="h-5 w-5" />} 
                      color="text-green"
                    />
                    <StatCard 
                      label="Completed" 
                      value={goalSnapshots.reduce((acc: number, s) => acc + s.completedGoals, 0)} 
                      icon={<Calendar className="h-5 w-5" />} 
                      color="text-blue"
                    />
                    <StatCard 
                      label="In Progress" 
                      value={goalSnapshots.reduce((acc: number, s) => acc + s.partialGoals, 0)} 
                      icon={<Clock className="h-5 w-5" />} 
                      color="text-warning"
                    />
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="text-center p-4">
      <div className={cn('mx-auto mb-2 p-2 rounded-lg', color + '/10')}>
        <span className={cn('h-5 w-5', color)}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  )
}