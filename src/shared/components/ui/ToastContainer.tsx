import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { Button } from './Button'
import { type Toast, type ToastType, useToast } from './Toast'

const IconComponents: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const colors: Record<ToastType, string> = {
  success: 'text-success border-success/30 bg-success/10',
  error: 'text-danger border-danger/30 bg-danger/10',
  warning: 'text-warning border-warning/30 bg-warning/10',
  info: 'text-primary border-primary/30 bg-primary/10'
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const IconComponent = IconComponents[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-lg border p-4 shadow-lg animate-in',
              colors[toast.type]
            )}
            role="alert"
          >
            <div className="flex-shrink-0 mt-0.5">
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-sm text-text-secondary">{toast.message}</p>
              )}
              {toast.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    toast.action!.onClick()
                    onRemove(toast.id)
                  }}
                >
                  {toast.action.label}
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 p-1 -mt-1 -mr-1 text-text-muted hover:text-text-primary"
              onClick={() => onRemove(toast.id)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}

export function Toaster() {
  const { toasts, removeToast } = useToast()
  
  return <ToastContainer toasts={toasts} onRemove={removeToast} />
}

export function useToastHelpers() {
  const { addToast } = useToast()
  
  return {
    success: (title: string, message?: string, options?: Partial<Omit<Toast, 'type' | 'title' | 'message'>>) => 
      addToast({ type: 'success', title, message, ...options }),
    error: (title: string, message?: string, options?: Partial<Omit<Toast, 'type' | 'title' | 'message'>>) => 
      addToast({ type: 'error', title, message, ...options }),
    warning: (title: string, message?: string, options?: Partial<Omit<Toast, 'type' | 'title' | 'message'>>) => 
      addToast({ type: 'warning', title, message, ...options }),
    info: (title: string, message?: string, options?: Partial<Omit<Toast, 'type' | 'title' | 'message'>>) => 
      addToast({ type: 'info', title, message, ...options })
  }
}