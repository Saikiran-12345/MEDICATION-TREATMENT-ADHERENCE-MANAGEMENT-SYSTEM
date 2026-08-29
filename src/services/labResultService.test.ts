import { describe, it, expect, beforeEach } from 'vitest';
import { labResultService } from './labResultService';
import { dbService } from './dbService';
import type { LabResult } from '../types';

describe('labResultService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('getAll', () => {
    it('should return all lab results', () => {
      const list = labResultService.getAll();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('getByPatient', () => {
    it('should return results for pat-1', () => {
      const list = labResultService.getByPatient('pat-1');
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('add and delete', () => {
    it('should handle lab result lifecycle', () => {
      const resultData: Omit<LabResult, 'id' | 'resultDate'> = {
        patientId: 'pat-1',
        testName: 'LDL Cholesterol',
        category: 'BLOOD_WORK',
        value: '95',
        unit: 'mg/dL',
        referenceRange: '< 100 mg/dL',
        isAbnormal: false,
        collectedDate: '2026-08-15',
        orderedBy: 'staff-1',
        notes: 'Routine check'
      };

      const added = labResultService.add(resultData);
      expect(added.id).toBeDefined();
      expect(added.resultDate).toBeDefined();

      const deleted = labResultService.delete(added.id);
      expect(deleted).toBe(true);
    });
  });
});
