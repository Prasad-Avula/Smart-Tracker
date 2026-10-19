import { Menu, ChevronLeft, Sun, Moon, Monitor, LogOut, Bell, Check } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { Button } from '@shared/components/ui/Button'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useTheme } from '@app/providers/ThemeProvider'
import { useState } from 'react'
import { Avatar } from '@shared/components/ui/Avatar'
import { DropdownMenu, type DropdownMenuItem } from '@shared/components/ui/DropdownMenu'
import { Brand } from './Brand'

interface HeaderProps {
  onMenuClick: () => void
  showMenuButton: boolean
  isCollapsed: boolean
  showTitle?: boolean
  pageTitle?: string
}

export function Header({ onMenuClick, showMenuButton, isCollapsed, showTitle, pageTitle }: HeaderProps) {
  const { user, logout } = useAuth()
  const { theme, resolvedTheme, setTheme } = useTheme()

  const themeOptions: DropdownMenuItem[] = [
    { label: 'Dark', icon: <Moon className="h-4 w-4" />, onClick: () => setTheme('dark'), active: theme === 'dark' },
    { label: 'Light', icon: <Sun className="h-4 w-4" />, onClick: () => setTheme('light'), active: theme === 'light' },
    { label: 'System', icon: <Monitor className="h-4 w-4" />, onClick: () => setTheme('system'), active: theme === 'system' },
  ]

  // Notifications state (replace with real data source later)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    message: string
    read: boolean
    createdAt: Date
    type: 'info' | 'success' | 'warning' | 'danger'
  }>>([])

  const unreadCount = notifications.filter(n => !n.read).length

  const notificationItems: DropdownMenuItem[] = [
    { label: 'Notifications', disabled: true, onClick: () => {}, className: 'font-medium px-3 py-2 border-b border-border mb-1' },

    // ---- each real notification -------------------------------------------------
    ...notifications.map(n => ({
      label: n.title,
      content: (
        <div className="flex flex-col gap-1 px-3 py-2">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                n.type === 'info'    ? 'bg-primary' :
                n.type === 'success' ? 'bg-success' :
                n.type === 'warning' ? 'bg-warning' : 'bg-danger'
              }`}
            />
            <span className={n.read ? 'opacity-60' : 'font-medium'}>{n.title}</span>
          </div>
          <p className="text-sm text-text-secondary">{n.message}</p>
          <time className="text-xs text-text-tertiary">{n.createdAt.toLocaleString()}</time>
        </div>
      ),
      onClick: () => setNotifications(prev =>
        prev.map(x => x.id === n.id ? { ...x, read: true } : x)
      ),
      icon: <span
        className={`h-2.5 w-2.5 rounded-full ${
          n.type === 'info'    ? 'bg-primary' :
          n.type === 'success' ? 'bg-success' :
          n.type === 'warning' ? 'bg-warning' : 'bg-danger'
        }`}
      />,
      active: n.read,
      className: n.read ? 'opacity-60' : '',
    })),

    // ---- footer actions ---------------------------------------------------------
    { type: 'separator' as const, label: '', onClick: () => {} },
    { label: 'Mark all as read', onClick: () => setNotifications(prev => prev.map(x => ({ ...x, read: true }))), icon: <Check className="h-4 w-4" /> },
  ]

  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 h-16 px-3 bg-surface-elevated/80 backdrop-blur-sm transition-all duration-300',
        isCollapsed && 'px-3'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn('h-9 w-9 p-0 flex-shrink-0', isCollapsed && 'justify-center')}
          >
            {isCollapsed ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
        {showTitle && (
          <Brand />
        )}
        {pageTitle && (
          <div className="ml-2 min-w-0 flex-shrink text-left">
            <span className="truncate text-lg font-semibold text-text-primary">{pageTitle}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
          <>
            {(() => {
              const userMenuItems: DropdownMenuItem[] = [
                { label: user.displayName, disabled: true, onClick: () => {}, className: 'font-medium px-3 py-2' },
                { type: 'separator' as const, label: '', onClick: () => {} },
                { label: 'Logout', icon: <LogOut className="h-4 w-4" />, onClick: logout, className: 'text-danger' },
              ];
              return (
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
              );
            })()}
          </>
        )}
      </div>
    </header>
  )
}
