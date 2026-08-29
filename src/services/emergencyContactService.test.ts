import { describe, it, expect, beforeEach } from 'vitest';
import { emergencyContactService } from './emergencyContactService';
import { dbService } from './dbService';
import type { EmergencyContact } from '../types';

describe('emergencyContactService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('getAll', () => {
    it('should return all emergency contacts', () => {
      const list = emergencyContactService.getAll();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('getByPatient', () => {
    it('should return contacts sorted by priority', () => {
      const list = emergencyContactService.getByPatient('pat-1');
      expect(list.length).toBeGreaterThan(0);
      if (list.length > 1) {
        expect(list[0].priority).toBeLessThanOrEqual(list[1].priority);
      }
    });
  });

  describe('add and update primary status', () => {
    it('should clear other primaries when a new primary contact is added', () => {
      // Add first primary contact
      const contact1: Omit<EmergencyContact, 'id'> = {
        patientId: 'pat-1',
        name: 'Contact One',
        relationship: 'Spouse',
        phone: '1234567890',
        isPrimary: true,
        priority: 1
      };
      
      const added1 = emergencyContactService.add(contact1);
      expect(added1.isPrimary).toBe(true);

      // Add second primary contact
      const contact2: Omit<EmergencyContact, 'id'> = {
        patientId: 'pat-1',
        name: 'Contact Two',
        relationship: 'Sibling',
        phone: '0987654321',
        isPrimary: true,
        priority: 2
      };
      
      const added2 = emergencyContactService.add(contact2);
      expect(added2.isPrimary).toBe(true);

      // Check that Contact One is no longer primary
      const list = emergencyContactService.getByPatient('pat-1');
      const c1 = list.find(ec => ec.id === added1.id);
      expect(c1!.isPrimary).toBe(false);
    });
  });
});
