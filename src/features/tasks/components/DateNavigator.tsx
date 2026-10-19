import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { formatDate, getDayName, isToday } from '@shared/utils/dateUtils'
import { Button } from '@shared/components/ui/Button'
import { useDateStore } from '@features/tasks/store/dateStore'
import { cn } from '@shared/utils/cn'

interface DateNavigatorProps {
  className?: string
}

export function DateNavigator({ className }: DateNavigatorProps) {
  const { currentDate, goToToday, goToPreviousDay, goToNextDay, navigateDate, canGoPrevious } = useDateStore()
  const viewingToday = isToday(currentDate)
  const canGoPrev = canGoPrevious()

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    if (newDate) {
      const selectedDate = new Date(newDate)
      if (selectedDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
        navigateDate(selectedDate)
      }
    }
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousDay}
        aria-label="Previous day"
        className="p-2"
        disabled={!canGoPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={currentDate}
          onChange={handleDateChange}
          min={createDateString(new Date())}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Select date"
        />
        
        <div className="text-center min-w-[120px]">
          <p className="text-xs font-medium text-text-secondary capitalize">{getDayName(currentDate)}</p>
          <p className="text-lg font-bold text-text-primary">{formatDate(currentDate)}</p>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextDay}
        aria-label="Next day"
        className="p-2"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {!viewingToday && (
        <Button
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className="gap-1.5 text-primary"
        >
          <Home className="h-4 w-4" />
          Go To Today
        </Button>
      )}

      </div>
  )
}

function createDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}