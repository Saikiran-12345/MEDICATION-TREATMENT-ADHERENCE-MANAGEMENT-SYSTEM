import type React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <input
          id={checkboxId}
          type="checkbox"
          className={`h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none transition-colors cursor-pointer ${className}`}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="text-sm text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
            {label}
          </label>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 font-medium pl-6">{error}</p>
      )}
    </div>
  );
};
