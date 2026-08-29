import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage navigation sidebar collapse states.
 */
export function useSidebar(initialCollapsed: boolean = false) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem('mtams_sidebar_collapsed');
      return stored ? JSON.parse(stored) : initialCollapsed;
    } catch (_) {
      return initialCollapsed;
    }
  });

  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('mtams_sidebar_collapsed', JSON.stringify(isCollapsed));
    } catch (e) {
      console.error('Failed to persist sidebar state', e);
    }
  }, [isCollapsed]);

  return {
    isCollapsed,
    toggle,
    setCollapsed,
  };
}
