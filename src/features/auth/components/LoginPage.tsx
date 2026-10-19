import { useLocation, Navigate } from 'react-router-dom'
import { Sunrise } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@shared/components/ui/Card'
import { LoginForm } from './LoginForm'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '@shared/constants'

export function LoginPage() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname || ROUTES.TASKS

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md" variant="elevated">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sunrise className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to continue to Smart Task Tracker</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <button
              onClick={() => window.location.href = ROUTES.SIGNUP}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}