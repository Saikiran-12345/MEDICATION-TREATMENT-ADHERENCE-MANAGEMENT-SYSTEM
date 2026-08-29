import { describe, it, expect, beforeEach } from 'vitest';
import { prescriptionService } from './prescriptionService';
import { dbService } from './dbService';
import type { Prescription } from '../types';

describe('prescriptionService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('getAll', () => {
    it('should return all prescriptions', () => {
      const rx = prescriptionService.getAll();
      expect(Array.isArray(rx)).toBe(true);
      expect(rx.length).toBeGreaterThan(0);
    });
  });

  describe('useRefill', () => {
    it('should increment refillsUsed and complete the prescription when limits are met', () => {
      // Create a test prescription with 2 refills allowed
      const newRx: Omit<Prescription, 'id' | 'prescribedDate' | 'refillsUsed' | 'status'> = {
        patientId: 'pat-1',
        medicationId: 'med-1',
        prescribedBy: 'staff-1',
        dosage: '10mg',
        instructions: 'Once daily',
        quantity: 30,
        refillsAllowed: 2,
        expiryDate: '2027-01-01'
      };

      const added = prescriptionService.add(newRx);
      expect(added.refillsUsed).toBe(0);
      expect(added.status).toBe('ACTIVE');

      // Use 1st refill
      const refilled1 = prescriptionService.useRefill(added.id);
      expect(refilled1).toBe(true);
      
      let found = prescriptionService.getAll().find(p => p.id === added.id);
      expect(found!.refillsUsed).toBe(1);
      expect(found!.status).toBe('ACTIVE');

      // Use 2nd refill
      const refilled2 = prescriptionService.useRefill(added.id);
      expect(refilled2).toBe(true);

      found = prescriptionService.getAll().find(p => p.id === added.id);
      expect(found!.refillsUsed).toBe(2);
      expect(found!.status).toBe('COMPLETED'); // Limit met, should switch status to COMPLETED

      // Attempt 3rd refill (should fail)
      const refilled3 = prescriptionService.useRefill(added.id);
      expect(refilled3).toBe(false);
    });
  });
});
