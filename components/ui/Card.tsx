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
          'glass-panel rounded-xl p-6 bg-white backdrop-blur-sm border border-[#dee2e6]',
          hover && 'glass-panel-hover cursor-pointer hover:bg-[#f8f9fa]',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
