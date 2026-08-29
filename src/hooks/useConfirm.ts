import { useState, useCallback } from 'react';

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  resolveFn: ((value: boolean) => void) | null;
}

/**
 * Custom hook to generate a confirm dialog state.
 */
export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    resolveFn: null,
  });

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        resolveFn: resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState.resolveFn) {
      confirmState.resolveFn(true);
    }
    setConfirmState(prev => ({ ...prev, isOpen: false, resolveFn: null }));
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    if (confirmState.resolveFn) {
      confirmState.resolveFn(false);
    }
    setConfirmState(prev => ({ ...prev, isOpen: false, resolveFn: null }));
  }, [confirmState]);

  return {
    isOpen: confirmState.isOpen,
    title: confirmState.title,
    message: confirmState.message,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
