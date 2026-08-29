import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseInfiniteScrollConfig {
  hasMore: boolean;
  onLoadMore: () => void | Promise<void>;
  threshold?: number;
}

/**
 * Custom hook to trigger lazy page loading when scrolling near the bottom of the page.
 */
export function useInfiniteScroll({
  hasMore,
  onLoadMore,
  threshold = 1.0,
}: UseInfiniteScrollConfig) {
  const containerRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const handleObserver = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        try {
          await onLoadMore();
        } catch (error) {
          console.error('Error fetching more elements', error);
        } finally {
          setIsLoadingMore(false);
        }
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '0px',
      threshold,
    });

    observerRef.current.observe(el);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  return {
    containerRef,
    isLoadingMore,
  };
}
