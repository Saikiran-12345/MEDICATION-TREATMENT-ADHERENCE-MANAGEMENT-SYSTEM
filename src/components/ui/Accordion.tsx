import type React from 'react';
import { useState } from 'react';

export interface AccordionSection {
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  sections: AccordionSection[];
}

export const Accordion: React.FC<AccordionProps> = ({ sections }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-2 w-full">
      {sections.map((section, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div 
            key={idx} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full px-4 py-3 flex justify-between items-center text-left text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none"
            >
              <span>{section.title}</span>
              <svg 
                className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                {section.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
