'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'gradient' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  animated?: boolean;
  as?: 'div' | 'article' | 'section';
}

const variantStyles = {
  default: 'bg-white border border-gray-200 shadow-sm',
  elevated: 'bg-white border border-gray-100 shadow-lg',
  glass: 'bg-white/70 backdrop-blur-lg border border-white/20 shadow-lg',
  gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md',
  outline: 'bg-transparent border-2 border-gray-200',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4 md:p-5',
  lg: 'p-6 md:p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      animated = false,
      className,
      children,
      as = 'div',
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'rounded-2xl transition-all duration-300',
      variantStyles[variant],
      paddingStyles[padding],
      hover && 'hover:shadow-xl hover:-translate-y-1 cursor-pointer',
      className
    );

    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={baseStyles}
          whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
          whileTap={hover ? { scale: 0.99 } : undefined}
          transition={{ duration: 0.2 }}
          {...(props as HTMLMotionProps<"div">)}
        >
          {children}
        </motion.div>
      );
    }

    const Component = as;
    return (
      <Component ref={ref} className={baseStyles} {...props}>
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ 
  title, 
  subtitle, 
  action, 
  className, 
  children,
  ...props 
}: CardHeaderProps) {
  if (children) {
    return (
      <div className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div 
      className={cn('flex items-start justify-between', className)} 
      {...props}
    >
      <div>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  );
}

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  divider?: boolean;
}

export function CardFooter({ 
  divider = true, 
  className, 
  children, 
  ...props 
}: CardFooterProps) {
  return (
    <div 
      className={cn(
        'mt-4',
        divider && 'pt-4 border-t border-gray-200',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

// Stats Card variant
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'cyan';
  className?: string;
}

const colorStyles = {
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    icon: 'bg-green-100 text-green-600',
    trend: 'text-green-600',
  },
  purple: {
    icon: 'bg-purple-100 text-purple-600',
    trend: 'text-purple-600',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-600',
    trend: 'text-amber-600',
  },
  red: {
    icon: 'bg-red-100 text-red-600',
    trend: 'text-red-600',
  },
  cyan: {
    icon: 'bg-cyan-100 text-cyan-600',
    trend: 'text-cyan-600',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  className,
}: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <Card 
      variant="glass" 
      className={cn('relative overflow-hidden', className)}
      animated
      hover
    >
      {/* Background decoration */}
      <div 
        className={cn(
          'absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10',
          styles.icon.replace('text-', 'bg-')
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          
          {(subtitle || trend) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span 
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive !== false ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive !== false ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && (
                <span className="text-sm text-gray-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div 
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl',
              styles.icon
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// Feature Card
interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  icon,
  href,
  onClick,
  className,
}: FeatureCardProps) {
  const content = (
    <Card 
      variant="default" 
      hover 
      animated 
      className={cn('group', className)}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg group-hover:shadow-xl transition-shadow">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
}

export default Card;
