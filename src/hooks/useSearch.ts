import { useState, useMemo } from 'react';

/**
 * Custom hook to filter data arrays using search queries matched against select object properties.
 */
export function useSearch<T>(
  data: T[],
  searchKeys: Array<keyof T | ((item: T) => string)>,
  initialQuery: string = ''
) {
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  const searchResults = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    if (!cleanQuery) return data;

    return data.filter(item => {
      return searchKeys.some(key => {
        const val = typeof key === 'function' ? key(item) : item[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(cleanQuery);
      });
    });
  }, [data, searchKeys, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
  };
}
