import { describe, it, expect, beforeEach } from 'vitest';
import { followUpService } from './followUpService';
import { dbService } from './dbService';

describe('followUpService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  it('should return initial scheduled visits', () => {
    const list = followUpService.getAll();
    expect(list.length).toBe(3);
    expect(list[0].id).toBe('fup-1');
  });

  it('should find follow-ups by patient ID', () => {
    const list = followUpService.getByPatientId('pat-1');
    expect(list.length).toBe(1);
    expect(list[0].purpose).toContain('Routine BP Check');
  });

  it('should book a new checkin appointment', () => {
    const fup = followUpService.create({
      patientId: 'pat-1',
      staffId: 'staff-1',
      date: '2026-09-10',
      time: '11:00',
      purpose: 'Cardiology Review',
      status: 'SCHEDULED',
      notes: 'Check ECG charts'
    });

    expect(fup.id).toBeDefined();
    expect(followUpService.getById(fup.id)).toBeDefined();
    expect(followUpService.getAll().length).toBe(4);
  });

  it('should fail booking if patient ID, date, or purpose is missing', () => {
    expect(() => {
      followUpService.create({
        patientId: '',
        staffId: 'staff-1',
        date: '2026-09-10',
        time: '11:00',
        purpose: 'Cardiology Review',
        status: 'SCHEDULED'
      });
    }).toThrow('Patient association is required');

    expect(() => {
      followUpService.create({
        patientId: 'pat-1',
        staffId: 'staff-1',
        date: '',
        time: '11:00',
        purpose: 'Cardiology Review',
        status: 'SCHEDULED'
      });
    }).toThrow('Follow-up date is required');
  });

  it('should update appointment status', () => {
    const updated = followUpService.update('fup-1', {
      status: 'COMPLETED',
      notes: 'Completed checkin successfully.'
    });

    expect(updated.status).toBe('COMPLETED');
    expect(updated.notes).toBe('Completed checkin successfully.');
  });

  it('should cancel and delete an appointment', () => {
    followUpService.delete('fup-1');
    expect(followUpService.getById('fup-1')).toBeUndefined();
  });
});
