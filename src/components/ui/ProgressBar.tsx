import type React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  size = 'md',
  variant = 'primary'
}) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const variants = {
    primary: 'bg-blue-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500'
  };

  return (
    <div className="w-full flex flex-col space-y-1">
      {(label || value !== undefined) && (
        <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label && <span>{label}</span>}
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heights[size]}`}>
        <div 
          className={`h-full rounded-full transition-all duration-300 ${variants[variant]}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
