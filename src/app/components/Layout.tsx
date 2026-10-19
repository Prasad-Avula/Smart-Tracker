import { useLocation } from 'react-router-dom'
import { useState, useEffect, type ReactNode } from 'react'
import { cn } from '@shared/utils/cn'
import { Navigation } from './Navigation'
import { Header } from './Header'
import { useMediaQuery } from '@shared/hooks/useMediaQuery'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location, isMobile])

  // Reset sidebar state when crossing breakpoint
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const sidebarWidth = isMobile ? 0 : sidebarCollapsed ? 72 : 260
  // Keep the Smart Tracker brand in exactly one place at a time.
  const showTitleInTopbar = isMobile ? !sidebarOpen : sidebarCollapsed
  const pathname = location.pathname
  const pageTitle = pathname.startsWith('/goals')
    ? 'Goals'
    : pathname.startsWith('/history')
      ? 'History'
      : pathname.startsWith('/settings')
        ? 'Settings'
        : 'Tasks'

  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar - only render when open */}
      {isMobile && sidebarOpen && (
        <aside
          className="fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-surface-elevated to-surface border-r border-border/50 transform animate-in translate-x-0"
          style={{ height: '100dvh' }}
          aria-label="Main navigation"
        >
          <nav className="flex-1 flex flex-col px-4 pb-4 pt-0 min-h-0 overflow-y-auto" aria-label="Navigation">
            <Navigation
              isCollapsed={false}
              onToggle={toggleSidebar}
              sidebarOpen={true}
              isMobile={true}
              pageTitle={pageTitle}
            />
          </nav>
        </aside>
      )}

      {/* Desktop sidebar - always rendered */}
      {!isMobile && (
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 flex flex-col bg-gradient-to-b from-surface-elevated to-surface border-r border-border/50 transition-all duration-300 ease-out flex-shrink-0',
            sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
          )}
          style={{ height: '100vh' }}
          aria-label="Main navigation"
        >
          <nav className="flex-1 flex flex-col px-4 pb-4 pt-0 min-h-0 overflow-y-auto" aria-label="Navigation">
            <Navigation
              isCollapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              sidebarOpen={false}
              isMobile={false}
              pageTitle={pageTitle}
            />
          </nav>
        </aside>
      )}

      {/* Content wrapper */}
      <div className="flex-1 min-h-0 flex flex-col" style={{ marginLeft: sidebarWidth }}>
        {/* Header - Sticky, includes mobile menu toggle */}
        <div className="sticky top-0 z-40 flex-shrink-0">
          <Header
            onMenuClick={toggleSidebar}
            showMenuButton={isMobile}
            isCollapsed={sidebarCollapsed}
            showTitle={showTitleInTopbar}
            pageTitle={pageTitle}
          />
        </div>

        {/* Main content area - THE SCROLL CONTAINER */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-48">
          {children}
        </main>
      </div>
    </div>
  )
}
