import { useLocation } from 'react-router-dom'
import { cn } from '@shared/utils/cn'
import { NavLink } from 'react-router-dom'
import { Button } from '@shared/components/ui/Button'
import { useState } from 'react'
import {
  CheckSquare,
  Target,
  Clock,
  Settings,
  Menu,
  ChevronDown,
} from 'lucide-react'
import { Brand } from './Brand'

type NavItem = {
  path: string
  label: string
  icon: typeof CheckSquare
}

const navItems: NavItem[] = [
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const goalSubItems = [
  { label: 'Weekly', path: '/goals/weekly' },
  { label: 'Monthly', path: '/goals/monthly' },
  { label: 'Yearly', path: '/goals/yearly' },
] as const

const historySubItems = [
  { label: 'Daily', path: '/history/daily' },
  { label: 'Weekly', path: '/history/weekly' },
  { label: 'Monthly', path: '/history/monthly' },
  { label: 'Yearly', path: '/history/yearly' },
] as const

interface NavigationProps {
  isCollapsed: boolean
  onToggle: () => void
  sidebarOpen: boolean
  isMobile: boolean
  pageTitle?: string
}

export function Navigation({ isCollapsed, onToggle, sidebarOpen, isMobile, pageTitle }: NavigationProps) {
  const location = useLocation()
  const [openDropdown, setOpenDropdown] = useState<'goals' | 'history' | null>(null)

  // Determine if we should show logo/title in sidebar header
  const showSidebarTitle = (isMobile && sidebarOpen) || (!isMobile && !isCollapsed)

  const renderNavItem = (item: NavItem) => {
    const { path, label, icon: Icon } = item
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'))

    // Mobile dropdown for Goals and History (inline accordion)
    if (isMobile && (path === '/goals' || path === '/history')) {
      const subItems = path === '/goals' ? goalSubItems : historySubItems
      const dropdownKey = path === '/goals' ? 'goals' : 'history'
      const isOpen = openDropdown === dropdownKey

      return (
        <li key={path}>
          <div>
            <button
              onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-text-secondary transition-all duration-200',
                'hover:bg-surface-hover hover:text-text-primary',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated',
                isActive ? 'bg-primary/10 text-primary font-medium' : ''
              )}
              aria-label={label}
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 flex-shrink-0 text-text-muted transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>

            {isOpen && (
              <ul className="mt-1 ml-6 space-y-1 border-l border-border/50 pl-2 animate-in" role="menu">
                {subItems.map((subItem) => (
                  <li key={subItem.path}>
                    <NavLink
                      to={subItem.path}
                      onClick={() => setOpenDropdown(null)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary transition-all duration-200',
                          'hover:bg-surface-hover hover:text-text-primary',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                          isActive ? 'bg-primary/10 text-primary font-medium' : ''
                        )
                      }
                      role="menuitem"
                    >
                      <span className="h-4 w-4 rounded-full border-border flex-shrink-0" />
                      <span className="flex-1">{subItem.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      )
    }

    // Default flat NavLink for desktop or other items
    return (
      <li key={path}>
        <NavLink
          to={path}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary transition-all duration-200',
              'hover:bg-surface-hover hover:text-text-primary',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated',
              isActive ? 'bg-primary/10 text-primary font-medium' : '',
              isCollapsed && 'justify-center px-2 gap-2'
            )
          }
          aria-current={isActive ? 'page' : undefined}
          title={isCollapsed ? label : undefined}
        >
          <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {!isCollapsed && <span className="flex-1">{label}</span>}
        </NavLink>
      </li>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* App header with logo and toggle */}
      <div className="sticky top-0 z-10 mb-2 flex h-16 items-center justify-between bg-surface-elevated px-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="h-9 w-9 p-0 flex-shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {showSidebarTitle && (
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <Brand className="min-w-0" />
            {isMobile && pageTitle && (
              <span className="min-w-0 truncate text-base font-semibold text-text-primary">
                {pageTitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden" aria-label="Main navigation">
        <ul className="space-y-1">
          {navItems.map(renderNavItem)}
        </ul>
      </nav>
    </div>
  )
}
