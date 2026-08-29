import { useState, useMemo, useCallback } from 'react';

export type FilterPredicate<T> = (item: T, value: any) => boolean;

/**
 * Custom hook to filter data arrays using predefined predicate conditions.
 */
export function useFilter<T>(
  data: T[],
  predicates: Record<string, FilterPredicate<T>>,
  initialFilters: Record<string, any> = {}
) {
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        // Skip filter if value is empty/unset
        if (value === null || value === undefined || value === '') return true;
        const predicate = predicates[key];
        if (!predicate) return true;
        return predicate(item, value);
      });
    });
  }, [data, filters, predicates]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    filteredData,
    setFilter,
    clearFilters,
  };
}
