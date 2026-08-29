import { describe, it, expect, beforeEach } from 'vitest';
import { treatmentService } from './treatmentService';
import { dbService } from './dbService';

describe('treatmentService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  it('should list all default treatments', () => {
    const list = treatmentService.getAll();
    expect(list.length).toBe(10);
    expect(list[0].name).toBe('Hypertension Control Plan');
  });

  it('should find treatments by patient ID', () => {
    const list = treatmentService.getByPatientId('pat-1');
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Hypertension Control Plan');
  });

  it('should get a treatment by ID', () => {
    const treat = treatmentService.getById('treat-1');
    expect(treat).toBeDefined();
    expect(treat?.name).toBe('Hypertension Control Plan');
  });

  it('should register a new treatment course', () => {
    const treat = treatmentService.create({
      patientId: 'pat-1',
      name: 'Diabetic Nerve Pain Care',
      startDate: '2026-08-01',
      endDate: '2026-09-01',
      status: 'PLANNED',
      notes: 'Test trial',
      assignedStaffId: 'staff-1'
    });

    expect(treat.id).toBeDefined();
    expect(treatmentService.getById(treat.id)).toBeDefined();
    expect(treatmentService.getAll().length).toBe(11);
  });

  it('should enforce date validation: endDate cannot precede startDate', () => {
    expect(() => {
      treatmentService.create({
        patientId: 'pat-1',
        name: 'Invalid Course',
        startDate: '2026-08-30',
        endDate: '2026-08-01', // earlier!
        status: 'PLANNED',
        assignedStaffId: 'staff-1'
      });
    }).toThrow('Treatment End Date cannot be before Start Date');
  });

  it('should update treatment plan status', () => {
    const updated = treatmentService.update('treat-1', {
      status: 'PAUSED',
      notes: 'Paused temporarily'
    });

    expect(updated.status).toBe('PAUSED');
    expect(updated.notes).toBe('Paused temporarily');
  });

  it('should delete a treatment course', () => {
    treatmentService.delete('treat-1');
    expect(treatmentService.getById('treat-1')).toBeUndefined();
  });
});
