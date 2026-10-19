import { cn } from '@shared/utils/cn'
import { forwardRef, useState, type ImgHTMLAttributes } from 'react'

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
}

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const [showFallback, setShowFallback] = useState(false)

    if (!src && !fallback) {
      return null
    }

    return (
      <div
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-full bg-surface-elevated',
          sizes[size],
          className
        )}
      >
        {src && !showFallback ? (
          <img
            ref={ref}
            src={src}
            alt={alt || fallback || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setShowFallback(true)}
            {...props}
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center bg-primary/20 text-primary font-medium',
              sizes[size]
            )}
            aria-label={fallback || alt}
          >
            {fallback || alt?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'