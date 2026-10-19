import { Sun, Moon, Monitor, LogOut, Bell, Check, X } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { Button } from '@shared/components/ui/Button'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useTheme } from '@app/providers/ThemeProvider'
import { Avatar } from '@shared/components/ui/Avatar'
import { DropdownMenu, type DropdownMenuItem } from '@shared/components/ui/DropdownMenu'
import { useState } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: Date
  type: 'info' | 'success' | 'warning' | 'danger'
}

export function TopBar({ className }: { className?: string }) {
  const { user, logout } = useAuth()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const themeOptions: DropdownMenuItem[] = [
    { label: 'Dark', icon: <Moon className="h-4 w-4" />, onClick: () => setTheme('dark'), active: theme === 'dark' },
    { label: 'Light', icon: <Sun className="h-4 w-4" />, onClick: () => setTheme('light'), active: theme === 'light' },
    { label: 'System', icon: <Monitor className="h-4 w-4" />, onClick: () => setTheme('system'), active: theme === 'system' },
  ]

  const userMenuItems: DropdownMenuItem[] = [
    { label: user!.displayName, disabled: true, onClick: () => {}, className: 'font-medium px-3 py-2' },
    { type: 'separator' as const, label: '', onClick: () => {} },
    { label: 'Logout', icon: <LogOut className="h-4 w-4" />, onClick: logout, className: 'text-danger' },
  ]

  const notificationItems: DropdownMenuItem[] = [
    { label: 'Notifications', disabled: true, onClick: () => {}, className: 'font-medium px-3 py-2 border-b border-border mb-1' },
    ...notifications.map(n => ({
      label: n.title,
      icon: (
        <div className={`h-4 w-4 rounded-full flex-shrink-0 ${
          n.type === 'info' ? 'bg-primary' :
          n.type === 'success' ? 'bg-success' :
          n.type === 'warning' ? 'bg-warning' : 'bg-danger'
        }`} />
      ),
      onClick: () => {
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      },
      active: n.read,
      className: n.read ? 'opacity-60' : 'font-medium'
    })),
    { type: 'separator' as const, label: '', onClick: () => {} },
    { label: 'Mark all as read', onClick: () => setNotifications(prev => prev.map(x => ({ ...x, read: true }))), icon: <Check className="h-4 w-4" /> },
    { label: 'Clear all', onClick: () => setNotifications([]), icon: <X className="h-4 w-4" />, className: 'text-danger' },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className={cn('flex items-center justify-end h-16 px-4 bg-surface/95 backdrop-blur-md sticky top-0 z-40', className)}>
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <DropdownMenu
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              aria-label={`Current theme: ${resolvedTheme}`}
            >
              {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          }
          items={themeOptions}
        />

        {/* Notifications */}
        <DropdownMenu
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 relative"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-danger text-white text-xs flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          }
          items={notificationItems}
          align="end"
        />

        {/* User Menu */}
        {user && (
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" aria-label="User menu">
                <Avatar
                  src={user.photoURL}
                  alt={user.displayName}
                  fallback={user.displayName.charAt(0).toUpperCase()}
                  size="sm"
                />
              </Button>
            }
            items={userMenuItems}
            align="end"
          />
        )}
      </div>
    </header>
  )
}