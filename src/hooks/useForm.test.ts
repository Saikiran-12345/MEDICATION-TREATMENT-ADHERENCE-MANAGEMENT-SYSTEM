import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from './useForm';
import type { ChangeEvent, FormEvent } from 'react';

describe('useForm hook', () => {
  it('should initialize values correctly', () => {
    const initialValues = { username: 'testuser', email: 'test@example.com' };
    const onSubmit = vi.fn();

    const { result } = renderHook(() => useForm({ initialValues, onSubmit }));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should handle changes in input fields', () => {
    const initialValues = { username: '', active: false };
    const onSubmit = vi.fn();

    const { result } = renderHook(() => useForm({ initialValues, onSubmit }));

    // Mock text change
    act(() => {
      result.current.handleChange({
        target: { name: 'username', value: 'newuser', type: 'text' }
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.username).toBe('newuser');

    // Mock checkbox change
    act(() => {
      result.current.handleChange({
        target: { name: 'active', checked: true, type: 'checkbox' }
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.active).toBe(true);
  });

  it('should reset form state', () => {
    const initialValues = { username: 'old' };
    const onSubmit = vi.fn();

    const { result } = renderHook(() => useForm({ initialValues, onSubmit }));

    act(() => {
      result.current.handleChange({
        target: { name: 'username', value: 'new', type: 'text' }
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.username).toBe('new');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values.username).toBe('old');
  });

  it('should validate and submit successfully when valid', async () => {
    const initialValues = { email: 'valid@test.com' };
    const validate = vi.fn(() => ({}));
    const onSubmit = vi.fn();

    const { result } = renderHook(() => useForm({ initialValues, validate, onSubmit }));

    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(validate).toHaveBeenCalledWith(initialValues);
    expect(result.current.errors).toEqual({});
    expect(onSubmit).toHaveBeenCalledWith(initialValues);
  });

  it('should block submission and set errors when invalid', async () => {
    const initialValues = { email: '' };
    const validate = vi.fn(() => ({ email: ['Email is required.'] }));
    const onSubmit = vi.fn();

    const { result } = renderHook(() => useForm({ initialValues, validate, onSubmit }));

    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(validate).toHaveBeenCalledWith(initialValues);
    expect(result.current.errors).toEqual({ email: ['Email is required.'] });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
