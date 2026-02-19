import { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazySection({ 
  children, 
  fallback,
  threshold = 0.1,
  rootMargin = '100px',
  className = ''
}: LazySectionProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  });

  const defaultFallback = (
    <div className={`flex items-center justify-center h-32 ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <div className="animate-pulse rounded bg-muted h-4 w-32"></div>
        <div className="animate-pulse rounded bg-muted h-3 w-24"></div>
      </div>
    </div>
  );

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {isIntersecting ? children : (fallback || defaultFallback)}
    </div>
  );
}
