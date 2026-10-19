import { useState, useRef, useEffect, type ReactNode, Fragment } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { createPortal } from 'react-dom'

export interface DropdownMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  className?: string
  type?: 'item' | 'separator'
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownMenuItem[]
  align?: 'start' | 'end'
}

export function DropdownMenu({ trigger, items, align = 'start' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && wrapperRef.current.contains(event.target as Node)) {
        return
      }
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return
      }
      setIsOpen(false)
    }

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        wrapperRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled && item.type !== 'separator') {
      item.onClick()
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !wrapperRef.current || !menuRef.current) return

    const triggerRect = wrapperRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    menuRef.current.style.maxWidth = `${viewportWidth - 16}px`
    const menuRect = menuRef.current.getBoundingClientRect()

    let top = triggerRect.bottom + 4
    let left = align === 'end' 
      ? triggerRect.right - menuRect.width
      : triggerRect.left

    if (left + menuRect.width > viewportWidth - 8) {
      left = viewportWidth - menuRect.width - 8
    }
    if (left < 8) {
      left = 8
    }
    if (top + menuRect.height > viewportHeight - 8) {
      top = triggerRect.top - menuRect.height - 4
    }
    if (top < 8) top = 8

    menuRef.current.style.top = `${top}px`
    menuRef.current.style.left = `${left}px`
  }, [isOpen, align])

  const toggle = () => setIsOpen(prev => !prev)

  const menuContent = isOpen && (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[180px] max-w-[calc(100vw-16px)] bg-surface-elevated border border-border rounded-lg shadow-lg p-1 animate-in overflow-hidden'
      )}
      style={{
        top: 0,
        left: 0,
        maxWidth: 'calc(100vw - 16px)',
        width: 'max-content',
      }}
      role="menu"
      aria-orientation="vertical"
    >
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return <hr key={`sep-${index}`} className="my-1 border-border" role="separator" />
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-text-primary transition-colors',
              'hover:bg-surface-hover focus:outline:none focus-visible:ring-2 focus-visible:ring-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              item.active && 'bg-primary/10 text-primary',
              item.className
            )}
            role="menuitem"
            aria-disabled={item.disabled}
            aria-selected={item.active}
          >
            {item.icon && <span className="flex-shrink-0 h-4 w-4">{item.icon}</span>}
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.active && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
          </button>
        )
      })}
    </div>
  )

  return (
    <Fragment>
      <div
        ref={wrapperRef}
        onClick={toggle}
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
        className="inline-flex flex-shrink-0 flex-grow-0 cursor-pointer"
      >
        {trigger}
      </div>

      {menuContent && createPortal(menuContent, document.body)}
    </Fragment>
  )
}
