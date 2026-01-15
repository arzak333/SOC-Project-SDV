import clsx from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-t-blue-500 border-r-transparent border-b-blue-500/30 border-l-transparent',
        sizeClasses[size],
        className
      )}
    />
  )
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
      <LoadingSpinner size="lg" />
      {message && <p className="mt-3 text-sm text-slate-400">{message}</p>}
    </div>
  )
}
