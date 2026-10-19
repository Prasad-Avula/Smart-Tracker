import { createBrowserRouter, Outlet } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from '@features/auth/components/ProtectedRoute'
import { Layout } from '@app/components'
import { ROUTES } from '@shared/constants'
import { Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy-loaded pages for code splitting
const TasksPage = lazy(() => import('@features/tasks/components/TasksPage').then(m => ({ default: m.TasksPage })))
const GoalsPage = lazy(() => import('@features/goals/components/GoalsPage').then(m => ({ default: m.GoalsPage })))
const HistoryPage = lazy(() => import('@features/history/components/HistoryPage').then(m => ({ default: m.HistoryPage })))
const SettingsPage = lazy(() => import('@features/settings/components/SettingsPage').then(m => ({ default: m.SettingsPage })))
const LoginPage = lazy(() => import('@features/auth/components/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@features/auth/components/SignupPage').then(m => ({ default: m.SignupPage })))

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  )
}

// Protected layout with auth check and layout wrapper
function ProtectedLayout() {
  return (
    <Layout>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </Layout>
  )
}

// Public layout (no auth check, no layout wrapper)
function PublicLayout() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      { 
        element: <ProtectedLayout />, 
        children: [
          { index: true, element: <TasksPage /> },
          { path: ROUTES.TASKS, element: <TasksPage /> },
          { path: ROUTES.GOALS, element: <GoalsPage /> },
          { path: `${ROUTES.GOALS}/:period`, element: <GoalsPage /> },
          { path: ROUTES.HISTORY, element: <HistoryPage /> },
          { path: `${ROUTES.HISTORY}/:period`, element: <HistoryPage /> },
          { path: ROUTES.SETTINGS, element: <SettingsPage /> },
        ] 
      },
    ],
  },
  {
    element: <PublicRoute />,
    children: [
      { 
        element: <PublicLayout />, 
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.SIGNUP, element: <SignupPage /> },
        ] 
      },
    ],
  },
])