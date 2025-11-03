import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'gradient' | 'bordered';
  animate?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hover = false, padding = 'md', variant = 'default', animate = false, ...props }, ref) => {
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const variantClasses = {
      default: 'bg-white dark:bg-gray-800 shadow-card dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700',
      glass: 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-gray-700/50',
      gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl-colored dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700',
      bordered: 'bg-white dark:bg-gray-800 border-2 border-primary/10 dark:border-primary/20 shadow-sm hover:border-primary/30 dark:hover:border-primary/40',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-300',
          variantClasses[variant],
          hover && 'hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:border-primary/20 dark:hover:border-primary/30',
          animate && 'animate-scale-in',
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
