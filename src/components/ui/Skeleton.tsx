import type React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const baseStyle = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  const variants = {
    text: 'h-4 rounded w-3/4 mb-2',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const customStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style
  };

  return (
    <div 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      style={customStyle} 
      {...props} 
    />
  );
};
