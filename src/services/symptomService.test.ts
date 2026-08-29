import { describe, it, expect, beforeEach } from 'vitest';
import { symptomService } from './symptomService';
import { dbService } from './dbService';
import type { Symptom } from '../types';

describe('symptomService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('getAll', () => {
    it('should return all symptoms', () => {
      const symptoms = symptomService.getAll();
      expect(Array.isArray(symptoms)).toBe(true);
      expect(symptoms.length).toBeGreaterThan(0);
    });
  });

  describe('getByPatient', () => {
    it('should return symptoms for patient pat-1', () => {
      const list = symptomService.getByPatient('pat-1');
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('add and update and resolve', () => {
    it('should handle lifecycle of a symptom', () => {
      const symptomData: Omit<Symptom, 'id' | 'onsetDate'> = {
        patientId: 'pat-1',
        name: 'Dry Cough',
        severity: 4,
        bodyArea: 'Chest',
        status: 'ACTIVE',
        notes: 'Mild tickle'
      };

      // Add
      const added = symptomService.add(symptomData);
      expect(added.id).toBeDefined();
      expect(added.name).toBe('Dry Cough');
      expect(added.status).toBe('ACTIVE');

      // Update
      const updated = symptomService.update(added.id, { severity: 6 });
      expect(updated).not.toBeNull();
      expect(updated!.severity).toBe(6);

      // Resolve
      const resolved = symptomService.resolve(added.id, 'Resolved spontaneously');
      expect(resolved).toBe(true);
      
      const found = symptomService.getAll().find(s => s.id === added.id);
      expect(found).toBeDefined();
      expect(found!.status).toBe('RESOLVED');
      expect(found!.resolvedDate).toBeDefined();
      expect(found!.notes).toBe('Resolved spontaneously');
    });
  });
});
