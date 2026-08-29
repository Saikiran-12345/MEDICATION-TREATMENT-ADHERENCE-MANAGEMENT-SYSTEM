import type React from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeTabId: string;
  onChangeTab: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTabId,
  onChangeTab
}) => {
  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Tabs Header bar */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {items.map(item => {
            const isActive = item.id === activeTabId;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Tab Content Panel */}
      <div className="w-full">
        {items.find(item => item.id === activeTabId)?.content || null}
      </div>
    </div>
  );
};
