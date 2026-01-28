'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Skeleton loader component for content placeholders
 * Provides visual feedback while content is loading
 */
export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variants = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
  };

  return (
    <motion.div
      className={cn(
        'bg-gray-200',
        variants[variant],
        animate && 'animate-pulse',
        className
      )}
      style={{ width, height }}
      initial={{ opacity: 0.5 }}
      animate={animate ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
      transition={animate ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
      aria-hidden="true"
      role="presentation"
    />
  );
}

/**
 * Skeleton text line for paragraph placeholders
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true" role="presentation">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          width={i === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton for dashboard cards
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20',
        className
      )}
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="rounded" className="w-12 h-12" />
        <Skeleton className="w-6 h-6" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

/**
 * Stats card skeleton
 */
export function SkeletonStatsCard() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-hidden="true" role="presentation">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * List item skeleton
 */
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200',
        className
      )}
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" variant="rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * List skeleton with multiple items
 */
export function SkeletonList({ items = 3, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true" role="presentation">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return <Skeleton variant="circular" className={sizes[size]} />;
}

/**
 * Chart skeleton
 */
export function SkeletonChart({ className }: { className?: string }) {
  // Pre-generate heights to avoid hydration mismatches
  const heights = [70, 45, 85, 55, 90, 40, 65];
  
  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20',
        className
      )}
      aria-hidden="true"
      role="presentation"
    >
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="h-64 flex items-end justify-around gap-2">
        {heights.map((h, i) => (
          <Skeleton
            key={i}
            className="w-8"
            height={`${h}%`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard skeleton layout
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard" role="status">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-12 w-40" variant="rounded" />
      </div>
      <SkeletonStatsCard />
      <div className="grid lg:grid-cols-2 gap-8">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonList items={5} />
    </div>
  );
}

export default Skeleton;
