import { describe, it, expect, beforeEach } from 'vitest';
import { vitalsService } from './vitalsService';
import { dbService } from './dbService';
import type { Vital } from '../types';

describe('vitalsService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('getAll', () => {
    it('should return all vitals', () => {
      const vitals = vitalsService.getAll();
      expect(Array.isArray(vitals)).toBe(true);
      expect(vitals.length).toBeGreaterThan(0);
    });
  });

  describe('getByPatient', () => {
    it('should return sorted vitals for a patient', () => {
      const p1Vitals = vitalsService.getByPatient('pat-1');
      expect(p1Vitals.length).toBeGreaterThan(0);
      
      // Check date ordering (newest first)
      if (p1Vitals.length > 1) {
        const time1 = new Date(p1Vitals[0].recordedAt).getTime();
        const time2 = new Date(p1Vitals[1].recordedAt).getTime();
        expect(time1).toBeGreaterThanOrEqual(time2);
      }
    });

    it('should return empty array for non-existent patient', () => {
      expect(vitalsService.getByPatient('pat-unknown')).toEqual([]);
    });
  });

  describe('add and delete', () => {
    it('should successfully add and then delete a vital reading', () => {
      const newVital: Omit<Vital, 'id' | 'recordedAt'> = {
        patientId: 'pat-1',
        type: 'HEART_RATE',
        value: 78,
        unit: 'bpm',
        recordedBy: 'staff-1',
        notes: 'Test reading'
      };

      const added = vitalsService.add(newVital);
      expect(added.id).toBeDefined();
      expect(added.value).toBe(78);
      expect(added.recordedAt).toBeDefined();

      const found = vitalsService.getAll().find(v => v.id === added.id);
      expect(found).toBeDefined();

      const deleted = vitalsService.delete(added.id);
      expect(deleted).toBe(true);

      const afterDelete = vitalsService.getAll().find(v => v.id === added.id);
      expect(afterDelete).toBeUndefined();
    });
  });

  describe('getVitalStatus', () => {
    it('should evaluate vital limits correctly', () => {
      const criticalLowVital: Vital = {
        id: '1',
        patientId: 'pat-1',
        type: 'SPO2',
        value: 85, // Critical low threshold is typically 90%
        unit: '%',
        recordedAt: new Date().toISOString(),
        recordedBy: 'staff-1'
      };
      
      const normalVital: Vital = {
        id: '2',
        patientId: 'pat-1',
        type: 'SPO2',
        value: 98,
        unit: '%',
        recordedAt: new Date().toISOString(),
        recordedBy: 'staff-1'
      };

      expect(vitalsService.getVitalStatus(criticalLowVital)).toBe('critical');
      expect(vitalsService.getVitalStatus(normalVital)).toBe('normal');
    });
  });
});
