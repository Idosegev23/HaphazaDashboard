import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    const isDateInput = type === 'date' || type === 'datetime-local';

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#212529]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          dir={isDateInput ? 'ltr' : undefined}
          className={cn(
            'w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] transition-colors',
            'focus:outline-none focus:border-gold',
            error ? 'border-red-500' : 'border-[#dee2e6]',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
