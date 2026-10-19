import { Clock, CalendarDays, AlertTriangle } from 'lucide-react'
import { Button } from '@shared/components/ui/Button'
import { Modal } from '@shared/components/ui/Modal'

interface RecurringTaskActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (mode: 'this_day' | 'all_future') => void
  action: 'edit' | 'delete'
  taskTitle: string
  isLoading?: boolean
}

export function RecurringTaskActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  taskTitle,
  isLoading = false,
}: RecurringTaskActionModalProps) {
  const actionText = action === 'edit' ? 'Edit' : 'Delete'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${actionText} Recurring Task`}
      description={`How would you like to ${action.toLowerCase()} "${taskTitle}"?`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-text-primary">This is a recurring task</p>
            <p className="text-sm text-text-secondary mt-1">
              Changes will affect all future occurrences unless you choose otherwise.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="secondary"
            className="w-full justify-start gap-3 p-4"
            onClick={() => onConfirm('this_day')}
            disabled={isLoading}
          >
            <Clock className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium text-text-primary">This day only</p>
              <p className="text-sm text-text-secondary">
                ${actionText} only today's occurrence. Future occurrences remain unchanged.
              </p>
            </div>
          </Button>

          <Button
            variant="primary"
            className="w-full justify-start gap-3 p-4"
            onClick={() => onConfirm('all_future')}
            disabled={isLoading}
          >
            <CalendarDays className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium text-text-primary">All future occurrences</p>
              <p className="text-sm text-text-secondary">
                ${actionText} this and all future occurrences of this recurring task.
              </p>
            </div>
          </Button>
        </div>

        <Button variant="ghost" className="w-full" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}