import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export function Loading({ size = 'md', className }: LoadingProps) {
  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-parakeet-green border-r-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-mist-white rounded',
        className
      )}
      aria-label="Loading content"
    />
  );
}
