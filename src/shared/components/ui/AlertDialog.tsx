import { Fragment, type ReactNode, createContext, useContext, type ButtonHTMLAttributes } from 'react'
import { cn } from '@shared/utils/cn'
import { Button } from './Button'
import { createPortal } from 'react-dom'
import { useState, useEffect, useRef } from 'react'

const AlertDialogContext = createContext<{ close: () => void } | null>(null)

function useAlertDialogContext() {
  const context = useContext(AlertDialogContext)
  if (!context) {
    throw new Error('AlertDialog components must be used within AlertDialog')
  }
  return context
}

export function AlertDialogTrigger({ children, onOpenChange }: { children: ReactNode; onOpenChange: (open: boolean) => void }) {
  return (
    <button type="button" onClick={() => onOpenChange(true)} className="contents">
      {children}
    </button>
  )
}

interface AlertDialogPortalProps {
  open: boolean
  children: ReactNode
  onClose: () => void
}

function AlertDialogPortal({ open, children, onClose }: AlertDialogPortalProps) {
  const [mounted, setMounted] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return open ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={contentRef} className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className={cn('bg-surface-elevated rounded-xl border border-border shadow-lg p-6')}>
          <AlertDialogContext.Provider value={{ close: onClose }}>
            {children}
          </AlertDialogContext.Provider>
        </div>
      </div>
    </div>,
    document.body
  ) : null
}

export function AlertDialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-4', className)}>{children}</div>
}

export function AlertDialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-2', className)}>{children}</div>
}

export function AlertDialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold text-text-primary', className)}>{children}</h2>
}

export function AlertDialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-sm text-text-secondary', className)}>{children}</p>
}

export function AlertDialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex justify-between gap-3 pt-4', className)}>{children}</div>
}

export function AlertDialogCancel({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { close } = useAlertDialogContext()
  return (
    <Button variant="secondary" {...props} className={cn('flex-1', className)} onClick={close}>
      {children}
    </Button>
  )
}

export function AlertDialogAction({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button variant="danger" {...props} className={cn('flex-1', className)}>
      {children}
    </Button>
  )
}

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  content: ReactNode
}

export function AlertDialog({ open, onOpenChange, trigger, content }: AlertDialogProps) {
  const handleClose = () => onOpenChange(false)

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose()
  }

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <Fragment>
      <AlertDialogTrigger onOpenChange={onOpenChange}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogPortal open={open} onClose={handleClose}>
        {content}
      </AlertDialogPortal>
    </Fragment>
  )
}