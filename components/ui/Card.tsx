import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-panel rounded-xl p-6 bg-surface/40 backdrop-blur-sm border border-subtle',
          hover && 'glass-panel-hover cursor-pointer hover:bg-surface/60',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
