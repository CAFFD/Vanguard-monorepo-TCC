import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const isError = Boolean(error);

    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-main)]">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={`px-3 py-2 border rounded-md text-sm outline-none transition-colors 
            ${isError 
              ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)]' 
              : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'
            }
            disabled:bg-gray-100 disabled:text-gray-500`}
          {...props}
        />
        {(error || helperText) && (
          <span className={`text-xs ${isError ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
