import { describe, it, expect, beforeEach } from 'vitest';
import { appointmentService } from './appointmentService';
import { dbService } from './dbService';
import type { Appointment } from '../types';

describe('appointmentService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('getAll', () => {
    it('should return all appointments', () => {
      const list = appointmentService.getAll();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('getByPatient', () => {
    it('should return appointments for patient pat-1', () => {
      const list = appointmentService.getByPatient('pat-1');
      expect(list.length).toBeGreaterThan(0);
      
      // Verification of date sorting order (newest first)
      if (list.length > 1) {
        const time1 = new Date(`${list[0].date}T${list[0].startTime}`).getTime();
        const time2 = new Date(`${list[1].date}T${list[1].startTime}`).getTime();
        expect(time1).toBeGreaterThanOrEqual(time2);
      }
    });
  });

  describe('add and update and delete', () => {
    it('should handle appointment lifecycle', () => {
      const apptData: Omit<Appointment, 'id' | 'status'> = {
        patientId: 'pat-1',
        staffId: 'staff-1',
        date: '2026-09-10',
        startTime: '10:00',
        endTime: '10:30',
        type: 'CONSULTATION',
        location: 'Clinic Room 12',
        isRecurring: false,
        notes: 'Initial check'
      };

      const added = appointmentService.add(apptData);
      expect(added.id).toBeDefined();
      expect(added.status).toBe('SCHEDULED');

      const updated = appointmentService.update(added.id, { notes: 'Updated notes' });
      expect(updated).not.toBeNull();
      expect(updated!.notes).toBe('Updated notes');

      const deleted = appointmentService.delete(added.id);
      expect(deleted).toBe(true);
    });
  });
});
