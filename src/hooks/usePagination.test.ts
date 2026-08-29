import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

describe('usePagination hook', () => {
  const mockData = Array.from({ length: 25 }, (_, i) => i + 1); // [1, 2, ..., 25]

  it('should initialize pagination state correctly', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalItems).toBe(25);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentData).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('should navigate to next page and previous page', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.nextPage();
    });
    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentData).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

    act(() => {
      result.current.prevPage();
    });
    expect(result.current.currentPage).toBe(1);
  });

  it('should support direct page navigation', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.goToPage(3);
    });
    expect(result.current.currentPage).toBe(3);
    expect(result.current.currentData).toEqual([21, 22, 23, 24, 25]);

    // Out of bound check
    act(() => {
      result.current.goToPage(5);
    });
    expect(result.current.currentPage).toBe(3);
  });
});
