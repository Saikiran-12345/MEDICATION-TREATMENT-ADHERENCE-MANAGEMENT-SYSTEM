import { describe, it, expect, beforeEach } from 'vitest';
import { sideEffectService } from './sideEffectService';
import { dbService } from './dbService';
import type { SideEffect } from '../types';

describe('sideEffectService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('getAll', () => {
    it('should return all side effects', () => {
      const list = sideEffectService.getAll();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('add and update and resolve', () => {
    it('should handle side effect lifecycle', () => {
      const seData: Omit<SideEffect, 'id' | 'onsetDate'> = {
        patientId: 'pat-1',
        medicationId: 'med-1',
        name: 'Dizziness',
        severity: 'MILD',
        status: 'ACTIVE',
        notes: 'Occurs 1 hour after dose'
      };

      const added = sideEffectService.add(seData);
      expect(added.id).toBeDefined();
      expect(added.name).toBe('Dizziness');

      const resolved = sideEffectService.resolve(added.id, 'Stopped after 3 days');
      expect(resolved).toBe(true);

      const found = sideEffectService.getAll().find(s => s.id === added.id);
      expect(found).toBeDefined();
      expect(found!.status).toBe('RESOLVED');
      expect(found!.notes).toBe('Stopped after 3 days');
    });
  });
});
