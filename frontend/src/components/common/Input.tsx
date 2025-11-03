import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative group">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <span className="text-gray-400 dark:text-gray-500 group-focus-within:text-primary dark:group-focus-within:text-primary-400 transition-colors duration-300">{leftIcon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-3 border-2 rounded-xl transition-all duration-300',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:focus:border-primary-400',
              'hover:border-gray-400 dark:hover:border-gray-500',
              'disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60',
              error
                ? 'border-warning focus:ring-warning/20 focus:border-warning'
                : 'border-gray-200 dark:border-gray-700',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div
              className={cn(
                "absolute inset-y-0 right-0 pr-3 flex items-center z-10",
                onRightIconClick ? "cursor-pointer hover:scale-110 transition-transform duration-200" : "pointer-events-none"
              )}
              onClick={onRightIconClick}
            >
              <span className="text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-warning font-medium animate-fade-in">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
