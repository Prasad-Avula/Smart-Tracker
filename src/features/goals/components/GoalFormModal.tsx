import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, CalendarRange, Target, Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { Modal } from '@shared/components/ui/Modal'
import { createGoalSchema, updateGoalSchema, type CreateGoalInput, type UpdateGoalInput, type GoalPeriod, getGoalEndDateForPeriod, getPeriodDateRange } from '../types'
import { createDateString } from '@shared/types'

interface GoalFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => void | Promise<void>
  initialData?: CreateGoalInput | UpdateGoalInput
  isEditing?: boolean
  isLoading?: boolean
  defaultPeriod?: GoalPeriod
}

const periodOptions: { value: GoalPeriod; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'weekly', label: 'Weekly', icon: <CalendarRange className="h-4 w-4" />, description: 'Current week' },
  { value: 'monthly', label: 'Monthly', icon: <CalendarIcon className="h-4 w-4" />, description: 'Current month' },
  { value: 'yearly', label: 'Yearly', icon: <Target className="h-4 w-4" />, description: 'Current year' },
]

export function GoalFormModal({ isOpen, onClose, onSubmit, initialData, isEditing = false, isLoading = false, defaultPeriod = 'weekly' }: GoalFormModalProps) {
  const [activePeriod, setActivePeriod] = useState<GoalPeriod>(defaultPeriod)

  const form = useForm<CreateGoalInput | UpdateGoalInput>({
    resolver: zodResolver(isEditing ? updateGoalSchema : createGoalSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      period: initialData?.period ?? defaultPeriod,
      endDate: initialData?.endDate ?? '',
    },
    mode: 'onChange',
  })
  const { setValue, reset, setError, formState: { errors } } = form

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title ?? '',
        period: initialData.period ?? defaultPeriod,
        endDate: initialData.endDate ?? '',
      })
      setActivePeriod(initialData.period ?? defaultPeriod)
    } else {
      const today = new Date()
      const { endDate } = getPeriodDateRange(defaultPeriod, today)
      reset({
        title: '',
        period: defaultPeriod,
        endDate,
      })
      setActivePeriod(defaultPeriod)
    }
  }, [initialData, isOpen, reset, defaultPeriod])

  // Weekly and monthly goals always use the current period's fixed end date.
  // Yearly goals keep their selected date so the user can choose any date in
  // the current calendar year.
  useEffect(() => {
    setValue('period', activePeriod)
    if (activePeriod !== 'yearly' || (!isEditing && !initialData)) {
      const today = new Date()
      const { endDate } = getPeriodDateRange(activePeriod, today)
      setValue('endDate', endDate)
    }
  }, [activePeriod, setValue, isEditing, initialData])

  const handleSubmit = (data: CreateGoalInput | UpdateGoalInput) => {
    try {
      const endDate = getGoalEndDateForPeriod(activePeriod, data.endDate)
      void onSubmit({ ...data, period: activePeriod, endDate })
    } catch (error) {
      setError('endDate', {
        type: 'validate',
        message: error instanceof Error ? error.message : 'Choose a valid end date',
      })
      return
    }
    onClose()
  }

  const todayDate = new Date()
  const today = createDateString(todayDate)
  const yearEndDate = getPeriodDateRange('yearly', todayDate).endDate
  const isDateFixed = activePeriod !== 'yearly'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Goal' : 'Create Goal'}
      description={isEditing ? 'Update your goal details' : 'Set a new goal for the selected period'}
      size="md"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* Title Field */}
        <div className="space-y-2">
          <label className="label flex items-center gap-2">
            <Target className="h-4 w-4 text-text-muted" />
            Goal Title
          </label>
          <Input
            placeholder="e.g., Exercise 3x per week"
            error={errors.title?.message}
            {...form.register('title')}
            className="w-full"
          />
          {errors.title && <p className="text-sm text-danger" role="alert">{errors.title.message}</p>}
        </div>

        {/* Period Selector */}
        <div className="space-y-2">
          <label className="label flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" />
            Period
          </label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Goal period">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={activePeriod === option.value}
                onClick={() => setActivePeriod(option.value)}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all duration-200 text-left',
                  activePeriod === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border text-text-secondary hover:border-border-hover hover:bg-surface'
                )}
              >
                <div className={cn('flex items-center gap-2 mb-1', activePeriod === option.value ? 'text-primary' : 'text-text-secondary')}>
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-xs text-text-muted ml-6">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Field */}
        <div className="space-y-2">
          <label className="label flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-text-muted" />
            End Date
          </label>
          <Input
            type="date"
            min={activePeriod === 'yearly' ? today : undefined}
            max={activePeriod === 'yearly' ? yearEndDate : undefined}
            disabled={isDateFixed}
            helperText={
              isDateFixed
                ? `${activePeriod === 'weekly' ? 'Weekly' : 'Monthly'} goals use the current period end date.`
                : `Choose any date from today through ${yearEndDate}.`
            }
            error={errors.endDate?.message}
            {...form.register('endDate')}
            className="w-full"
          />
          {errors.endDate && <p className="text-sm text-danger" role="alert">{errors.endDate.message}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
