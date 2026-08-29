import { useState, useCallback, type ChangeEvent, type FormEvent } from 'react';

export interface UseFormConfig<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string[]>;
  onSubmit: (values: T) => void | Promise<void>;
}

/**
 * Custom hook to handle form state, change events, and submission validations.
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormConfig<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }

    setValues(prev => ({
      ...prev,
      [name]: parsedValue,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    let validationErrors: Record<string, string[]> = {};
    if (validate) {
      validationErrors = validate(values);
    }

    setErrors(validationErrors);

    const hasErrors = Object.keys(validationErrors).length > 0;
    if (!hasErrors) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }

    setIsSubmitting(false);
  }, [values, validate, onSubmit]);

  return {
    values,
    errors,
    isSubmitting,
    setValues,
    setErrors,
    handleChange,
    resetForm,
    handleSubmit,
  };
}
