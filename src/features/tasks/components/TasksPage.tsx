import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatDate, getDayName, isToday } from '@shared/utils/dateUtils'
import { Button } from '@shared/components/ui/Button'
import { Card } from '@shared/components/ui/Card'
import { CircularProgress } from '@shared/components/ui/ProgressBar'
import { useTasks } from '../hooks/useTasks'
import { useDateStore } from '../store/dateStore'
import { TaskCard } from './TaskCard'
import { TaskFormModal } from './TaskFormModal'
import { DateNavigator } from './DateNavigator'
import type { TaskWithStatus } from '../types'

export function TasksPage() {
const { currentDate } = useDateStore()
  const viewingToday = isToday(currentDate)
  const {
    tasks,
    progress,
    mainCount,
    sideCount,
    createTask: createTaskAction,
    updateTask: updateTaskAction,
    deleteTask: deleteTaskAction,
    toggleTaskStatus,
    isCreating,
    isUpdating,
  } = useTasks()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithStatus | null>(null)
  const [defaultPriority, setDefaultPriority] = useState<'main' | 'side'>('main')

  const handleCreateTask = (priority: 'main' | 'side' = 'main') => {
    setEditingTask(null)
    setDefaultPriority(priority)
    setIsModalOpen(true)
  }

  const handleSubmitTask = (data: any) => {
    if (editingTask) {
      updateTaskAction(editingTask.id, data).catch(() => {})
    } else {
      createTaskAction(data).catch(() => {})
    }
  }

  const formattedDate = formatDate(currentDate)
  const dayName = getDayName(currentDate)

  const mainTasks = tasks.filter(t => t.priority === 'main')
  const sideTasks = tasks.filter(t => t.priority === 'side')

  const isModalLoading = isCreating || isUpdating

  return (
  <div className="flex-1 overflow-y-auto space-y-6 p-4 md:p-6">
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <DateNavigator />
        </div>
      </div>

      {/* Viewing badge when not on today */}
      {!viewingToday && (
        <div className="flex items-center justify-between">
          <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
            Viewing {formattedDate} ({dayName})
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <Card variant="elevated" className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <CircularProgress value={progress} size={80} strokeWidth={8} variant="primary" showValue />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Daily Progress</p>
              <p className="text-sm text-text-muted mt-1">
                {tasks.filter(t => t.status === 'done').length} of {tasks.length} tasks completed
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Task Lists */}
      <div className="space-y-6">
        {/* Main Tasks */}
        <section aria-labelledby="main-tasks-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="main-tasks-heading" className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                Main ({mainCount}/4)
              </span>
            </h2>
            {mainCount > 0 && mainCount < 4 && (
              <Button variant="secondary" size="sm" onClick={() => handleCreateTask('main')} disabled={isModalLoading}>
                <Plus className="h-4 w-4 mr-1" />
                Add Main
              </Button>
            )}
          </div>
          
          {mainTasks.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-surface-elevated/50 border border-border/50">
              <p className="text-text-muted mb-3">No main tasks yet</p>
              <Button size="sm" onClick={() => handleCreateTask('main')} disabled={isModalLoading}>
                <Plus className="h-4 w-4 mr-1" />
                Add Main Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3" role="list" aria-label="Main tasks">
              {mainTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskStatus}
                  onDelete={deleteTaskAction}
                />
              ))}
            </div>
          )}
        </section>

        {/* Side Tasks */}
        <section aria-labelledby="side-tasks-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="side-tasks-heading" className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                Side ({sideCount})
              </span>
            </h2>
            {sideCount > 0 && (
              <Button variant="secondary" size="sm" onClick={() => handleCreateTask('side')} disabled={isModalLoading}>
                <Plus className="h-4 w-4 mr-1" />
                Add Side
              </Button>
            )}
          </div>
          
          {sideTasks.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-surface-elevated/50 border border-border/50">
              <p className="text-text-muted mb-3">No side tasks yet</p>
              <Button size="sm" onClick={() => handleCreateTask('side')} disabled={isModalLoading}>
                <Plus className="h-4 w-4 mr-1" />
                Add Side Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3" role="list" aria-label="Side tasks">
              {sideTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskStatus}
                  onDelete={deleteTaskAction}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTask(null)
        }}
        onSubmit={handleSubmitTask}
        initialData={editingTask ?? undefined}
        isEditing={!!editingTask}
        isLoading={isModalLoading}
        defaultPriority={defaultPriority}
        mainCount={mainCount}
      />
    </div>
  )
}
