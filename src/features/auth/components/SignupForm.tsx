import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@shared/components/ui'
import { useAuth } from '../hooks/useAuth'

const signupSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm() {
  const { signup, loading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' }
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data)
    } catch {
      // Error handled by auth store
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm" role="alert">
          {error}
        </div>
      )}
      
      <Input
        {...register('displayName')}
        label="Display Name"
        type="text"
        placeholder="John Doe"
        autoComplete="name"
        error={errors.displayName?.message}
        disabled={loading}
        leftIcon={<User className="h-5 w-5 text-text-muted" />}
      />
      
      <Input
        {...register('email')}
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        disabled={loading}
        leftIcon={<Mail className="h-5 w-5 text-text-muted" />}
      />
      
      <div className="relative">
        <Input
          {...register('password')}
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          disabled={loading}
          leftIcon={<Lock className="h-5 w-5 text-text-muted" />}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-[38px] text-text-muted hover:text-text-primary transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      
      <Input
        {...register('confirmPassword')}
        label="Confirm Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        disabled={loading}
        leftIcon={<Lock className="h-5 w-5 text-text-muted" />}
      />
      
      <Button type="submit" className="w-full" loading={loading}>
        Create Account
      </Button>
    </form>
  )
}