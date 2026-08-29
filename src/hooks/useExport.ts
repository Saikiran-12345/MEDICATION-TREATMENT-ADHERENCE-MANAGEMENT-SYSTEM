import { useState, useCallback } from 'react';

export type ExportFormat = 'JSON' | 'CSV' | 'HTML';

/**
 * Custom hook to manage the loading and trigger states for data file exports.
 */
export function useExport() {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const performExport = useCallback(async (
    exportFn: () => void | Promise<void>,
    onSuccess?: () => void
  ) => {
    setIsExporting(true);
    setError(null);
    try {
      await exportFn();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err?.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    error,
    performExport,
  };
}
