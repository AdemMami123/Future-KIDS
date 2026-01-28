'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'current';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'text-blue-500',
  secondary: 'text-purple-500',
  white: 'text-white',
  current: 'text-current',
};

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div 
      className={cn('inline-flex items-center justify-center', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg 
        className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Full page loading screen
interface PageLoadingProps {
  message?: string;
  showLogo?: boolean;
}

export function PageLoading({ message = 'Loading...', showLogo = true }: PageLoadingProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6"
      >
        {showLogo && (
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-6xl"
          >
            🎓
          </motion.div>
        )}
        
        <div className="flex items-center gap-3">
          <LoadingSpinner size="lg" color="primary" />
          <span className="text-lg font-medium text-gray-700">{message}</span>
        </div>
        
        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Inline loading for buttons or small areas
interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ text = 'Loading', className = '' }: InlineLoadingProps) {
  return (
    <span 
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="sm" color="current" />
      <span>{text}</span>
    </span>
  );
}

// Overlay loading for sections
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  blur?: boolean;
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  blur = true 
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center',
        blur ? 'bg-white/60 backdrop-blur-sm' : 'bg-white/80'
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" color="primary" />
        <span className="text-sm font-medium text-gray-600">{message}</span>
      </div>
    </motion.div>
  );
}

// Progress bar loading
interface ProgressLoadingProps {
  progress: number;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning';
  className?: string;
}

const progressColors = {
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
};

export function ProgressLoading({ 
  progress, 
  showPercentage = true,
  color = 'primary',
  className = '',
}: ProgressLoadingProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div 
      className={cn('w-full', className)}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Loading: ${clampedProgress}% complete`}
    >
      <div className="flex items-center justify-between mb-1">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', progressColors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Skeleton pulse animation component
interface PulseLoadingProps {
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export function PulseLoading({ className = '', rounded = 'md' }: PulseLoadingProps) {
  return (
    <div 
      className={cn(
        'animate-pulse bg-gray-200',
        roundedClasses[rounded],
        className
      )}
      aria-hidden="true"
    />
  );
}

export default LoadingSpinner;
