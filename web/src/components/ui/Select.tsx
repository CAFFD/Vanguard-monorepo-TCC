import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = '', id, ...props }, ref) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
    const isError = Boolean(error);

    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-text-main)]">
          {label}
        </label>
        <select
          id={selectId}
          ref={ref}
          className={`px-3 py-2 border rounded-md text-sm outline-none transition-colors bg-[var(--color-surface)] text-[var(--color-text-main)]
            ${isError 
              ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)]' 
              : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        >
          <option value="" disabled>Selecione uma opção...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {(error || helperText) && (
          <span className={`text-xs ${isError ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
