import type React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string | number;
    type: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className = ''
}) => {
  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-gray-500 dark:text-gray-400'
  };

  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </span>
        </div>
        {icon && (
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
            {icon}
          </div>
        )}
      </div>
      {(description || trend) && (
        <div className="mt-4 flex items-center space-x-2 text-xs">
          {trend && (
            <span className={`font-semibold flex items-center ${trendColors[trend.type]}`}>
              {trend.type === 'up' && '↑'}
              {trend.type === 'down' && '↓'}
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-gray-500 dark:text-gray-400">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
