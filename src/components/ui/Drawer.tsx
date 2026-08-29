import type React from 'react';
import { useEffect } from 'react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'left' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right'
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionStyles = {
    left: 'left-0 translate-x-0',
    right: 'right-0 translate-x-0'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-40 transition-opacity" 
        onClick={onClose} 
      />

      {/* Slide-out Sheet */}
      <div className={`fixed inset-y-0 ${positionStyles[position]} flex max-w-full pl-10`}>
        <div className="w-screen max-w-md transform bg-white dark:bg-gray-800 p-6 shadow-xl transition-all border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none"
            >
              <span className="sr-only">Close drawer</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto mt-4 text-sm text-gray-500 dark:text-gray-400">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
