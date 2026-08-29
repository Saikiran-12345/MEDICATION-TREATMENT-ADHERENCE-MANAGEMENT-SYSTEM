import { describe, it, expect, beforeEach } from 'vitest';
import { scheduleService } from './scheduleService';
import { doseService } from './doseService';
import { dbService } from './dbService';

describe('scheduleService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  it('should return all default schedules', () => {
    const list = scheduleService.getAll();
    expect(list.length).toBe(8);
    expect(list[0].id).toBe('sched-1');
  });

  it('should find schedules by treatment ID', () => {
    const list = scheduleService.getByTreatmentId('treat-1');
    expect(list.length).toBe(2);
    expect(list[0].medicationId).toBe('med-1');
  });

  it('should create schedule and automatically pre-generate dose records', () => {
    // Check initial doses count
    const initialDosesCount = doseService.getAll().length;

    // Create a 5-day schedule
    const sched = scheduleService.create({
      patientId: 'pat-1',
      treatmentId: 'treat-1',
      medicationId: 'med-1',
      startDate: '2026-09-01',
      endDate: '2026-09-05', // 5 days
      time: '08:00, 20:00', // twice daily
      frequency: 'TWICE_DAILY',
      status: 'ACTIVE'
    });

    expect(sched.id).toBeDefined();
    
    // Total doses generated should be 5 days * 2 times = 10 doses
    const updatedDoses = doseService.getAll();
    expect(updatedDoses.length).toBe(initialDosesCount + 10);

    const generatedDoses = updatedDoses.filter(d => d.scheduleId === sched.id);
    expect(generatedDoses.length).toBe(10);
    expect(generatedDoses[0].status).toBe('SCHEDULED');
    expect(generatedDoses[0].scheduledTime).toBe('08:00');
    expect(generatedDoses[1].scheduledTime).toBe('20:00');
  });

  it('should clean up scheduled upcoming doses on delete', () => {
    // Create schedule
    const sched = scheduleService.create({
      patientId: 'pat-1',
      treatmentId: 'treat-1',
      medicationId: 'med-1',
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      time: '08:00',
      frequency: 'ONCE_DAILY',
      status: 'ACTIVE'
    });

    const activeCountBefore = doseService.getAll().length;

    // Delete schedule
    scheduleService.delete(sched.id);

    const activeCountAfter = doseService.getAll().length;
    // Doses generated (5 doses for 5 days once daily) should have been deleted
    expect(activeCountAfter).toBe(activeCountBefore - 5);
  });
});
