import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from './authService';
import { storageService } from './storageService';

describe('authService', () => {
  beforeEach(() => {
    storageService.clear();
  });

  it('should return null when no user is logged in', () => {
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('should log in admin with correct credentials', () => {
    const user = authService.login('admin', 'admin123');
    expect(user).not.toBeNull();
    expect(user?.username).toBe('admin');
    expect(user?.role).toBe('ADMIN');
    expect(authService.getCurrentUser()).toEqual(user);
  });

  it('should log in staff with correct credentials, case-insensitively', () => {
    const user = authService.login('STAFF', 'staff123');
    expect(user).not.toBeNull();
    expect(user?.username).toBe('staff');
    expect(user?.role).toBe('STAFF');
  });

  it('should log in patient with correct credentials', () => {
    const user = authService.login('patient', 'patient123');
    expect(user).not.toBeNull();
    expect(user?.username).toBe('patient');
    expect(user?.role).toBe('PATIENT');
  });

  it('should return null for invalid credentials', () => {
    const user = authService.login('admin', 'wrongpassword');
    expect(user).toBeNull();
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('should return null for non-existent users', () => {
    const user = authService.login('ghost', 'ghost123');
    expect(user).toBeNull();
  });

  it('should clear session on logout', () => {
    authService.login('admin', 'admin123');
    expect(authService.getCurrentUser()).not.toBeNull();
    
    authService.logout();
    expect(authService.getCurrentUser()).toBeNull();
  });
});
