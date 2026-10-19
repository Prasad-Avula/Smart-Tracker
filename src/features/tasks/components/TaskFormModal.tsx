import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, CalendarRange, Flag, Hash, RotateCcw } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { Modal } from '@shared/components/ui/Modal'
import { createTaskSchema, type CreateTaskInput, type TaskPriority, MAX_MAIN_TASKS_PER_DAY } from '../types'
import { useDateStore } from '../store/dateStore'
import { endOfMonth } from 'date-fns'
import { formatDateKey } from '@shared/utils/dateUtils'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateTaskInput) => void | Promise<void>
  initialData?: CreateTaskInput
  isEditing?: boolean
  isLoading?: boolean
  defaultPriority?: 'main' | 'side'
  mainCount: number
}

export function TaskFormModal({ isOpen, onClose, onSubmit, initialData, isEditing = false, isLoading = false, defaultPriority = 'main', mainCount }: TaskFormModalProps) {
  const [activeTab, setActiveTab] = useState<'once' | 'recurring'>('once')
  const { currentDate } = useDateStore()

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      ...initialData,
      title: initialData?.title ?? '',
      type: initialData?.type ?? 'once',
      priority: initialData?.priority ?? defaultPriority,
      specificDate: initialData?.specificDate ?? currentDate,
      startDate: initialData?.startDate ?? '',
      endDate: initialData?.endDate ?? '',
    },
    mode: 'onChange',
  })

  const { setValue, reset, setError, clearErrors, watch, formState: { errors } } = form
  const selectedPriority = watch('priority')
  const mainTaskLimitReached = mainCount >= MAX_MAIN_TASKS_PER_DAY && (
    !isEditing || initialData?.priority !== 'main'
  )

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        title: initialData.title ?? '',
        type: initialData.type ?? 'once',
        priority: initialData.priority ?? 'main',
        specificDate: initialData.specificDate ?? '',
        startDate: initialData.startDate ?? '',
        endDate: initialData.endDate ?? '',
      })
      setActiveTab(initialData.type === 'recurring' ? 'recurring' : 'once')
    } else {
      reset({
        title: '',
        type: 'once',
        priority: defaultPriority,
        specificDate: currentDate,
        startDate: '',
        endDate: '',
      })
      setActiveTab('once')
    }
  }, [initialData, isOpen, reset, currentDate, defaultPriority])

  useEffect(() => {
    setValue('type', activeTab)
    // Auto-set recurring task dates: startDate = today, endDate = end of current month
    if (activeTab === 'recurring' && !isEditing) {
      const today = new Date()
      const endOfCurrentMonth = endOfMonth(today)
      setValue('startDate', formatDateKey(today))
      setValue('endDate', formatDateKey(endOfCurrentMonth))
    }
  }, [activeTab, setValue, isEditing])

  const handleSubmit = (data: CreateTaskInput) => {
    if (data.priority === 'main' && mainTaskLimitReached) {
      setError('priority', {
        type: 'validate',
        message: `Maximum ${MAX_MAIN_TASKS_PER_DAY} main tasks allowed`,
      })
      return
    }

    void onSubmit(data)
    onClose()
  }

  const handlePriorityChange = (priority: TaskPriority) => {
    if (priority === 'main' && mainTaskLimitReached) {
      setError('priority', {
        type: 'validate',
        message: `Maximum ${MAX_MAIN_TASKS_PER_DAY} main tasks allowed`,
      })
      return
    }

    clearErrors('priority')
    setValue('priority', priority, { shouldValidate: true })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create Task'}
      description={isEditing ? 'Update your task details' : 'Add a new task to your daily plan'}
      size="md"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* Register priority field so watch works on initial render */}
        <input type="hidden" {...form.register('priority')} />
        {/* Type Selector Tabs */}
        <div className="flex gap-1 p-1 bg-surface rounded-lg" role="tablist" aria-label="Task type">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'once'}
            aria-controls="once-panel"
            id="once-tab"
            onClick={() => setActiveTab('once')}
            className={cn(
              'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200',
              activeTab === 'once'
                ? 'bg-white text-black shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <span className="flex items-center gap-2 justify-center">
              <Hash className="h-4 w-4" />
              Once
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recurring'}
            aria-controls="recurring-panel"
            id="recurring-tab"
            onClick={() => setActiveTab('recurring')}
            className={cn(
              'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200',
              activeTab === 'recurring'
                ? 'bg-white text-black shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <span className="flex items-center gap-2 justify-center">
              <RotateCcw className="h-4 w-4" />
              Recurring
            </span>
          </button>
        </div>

        {/* Title */}
        <Input
          label="Title"
          placeholder="What needs to be done?"
          error={errors.title?.message}
          {...form.register('title')}
          autoFocus
        />

        {/* Priority */}
        <div className="space-y-2">
          <label className="label">Priority</label>
          <div className="flex gap-3">
            {(['main', 'side'] as TaskPriority[]).map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => handlePriorityChange(priority)}
                disabled={priority === 'main' && mainTaskLimitReached}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200',
                  selectedPriority === priority
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-text-secondary hover:border-border-hover hover:bg-surface',
                  priority === 'main' && mainTaskLimitReached && 'cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent'
                )}
              >
                {priority === 'main' ? <Flag className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
                <span className="font-medium capitalize">{priority}</span>
              </button>
            ))}
          </div>
          {mainTaskLimitReached && (
            <p className="text-sm text-text-muted">
              You already have the maximum of {MAX_MAIN_TASKS_PER_DAY} main tasks for this day.
            </p>
          )}
          {errors.priority && <p className="text-sm text-danger" role="alert">{errors.priority.message}</p>}
        </div>

        {/* Date Fields */}
        <div role="tabpanel" id="once-panel" aria-labelledby="once-tab" hidden={activeTab !== 'once'}>
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <Calendar className="h-4 w-4 text-text-muted" />
              Date
            </label>
            <div className="w-full">
              <input
                type="date"
                min={currentDate}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-elevated border border-border text-text-primary placeholder:text-text-muted transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                readOnly
                disabled={!isEditing}
                value={isEditing ? (initialData?.specificDate ?? currentDate) : currentDate}
                aria-describedby="once-date-hint"
              />
              <input type="hidden" {...form.register('specificDate')} defaultValue={isEditing ? (initialData?.specificDate ?? currentDate) : currentDate} />
            </div>
            {errors.specificDate && <p className="text-sm text-danger" role="alert">{errors.specificDate.message}</p>}
            <p id="once-date-hint" className="text-xs text-text-muted">One time tasks are fixed to the selected date</p>
          </div>
        </div>

        <div role="tabpanel" id="recurring-panel" aria-labelledby="recurring-tab" hidden={activeTab !== 'recurring'}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="label flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-text-muted" />
                End Date
              </label>
              <Input
                type="date"
                min={currentDate}
                error={errors.endDate?.message}
                {...form.register('endDate')}
                className="w-full"
              />
              {errors.endDate && <p className="text-sm text-danger" role="alert">{errors.endDate.message}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
