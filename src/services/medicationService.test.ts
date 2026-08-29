import { describe, it, expect, beforeEach } from 'vitest';
import { medicationService } from './medicationService';
import { dbService } from './dbService';

describe('medicationService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  it('should return all default medications', () => {
    const list = medicationService.getAll();
    expect(list.length).toBe(9);
    expect(list[0].name).toBe('Lisinopril');
  });

  it('should find medications by treatment ID', () => {
    const list = medicationService.getByTreatmentId('treat-1');
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('Lisinopril');
    expect(list[1].name).toBe('Amlodipine');
  });

  it('should catalogue a new medication record', () => {
    const med = medicationService.create({
      name: 'Gabapentin',
      treatmentId: 'treat-1',
      dosage: '300mg',
      instructions: 'Take 3 times daily',
      startDate: '2026-08-01',
      endDate: '2026-09-01',
      status: 'ACTIVE',
      notes: 'Demo nerve pain control'
    });

    expect(med.id).toBeDefined();
    expect(medicationService.getById(med.id)).toBeDefined();
    expect(medicationService.getAll().length).toBe(10);
  });

  it('should enforce date validation: endDate cannot precede startDate', () => {
    expect(() => {
      medicationService.create({
        name: 'Gabapentin',
        treatmentId: 'treat-1',
        dosage: '300mg',
        instructions: 'Take 3 times daily',
        startDate: '2026-08-30',
        endDate: '2026-08-01', // earlier!
        status: 'ACTIVE'
      });
    }).toThrow('Medication active End Date cannot be before Start Date');
  });

  it('should update medication details', () => {
    const updated = medicationService.update('med-1', {
      dosage: '20mg',
      instructions: 'Take in evening'
    });

    expect(updated.dosage).toBe('20mg');
    expect(updated.instructions).toBe('Take in evening');
  });

  it('should remove a medication record', () => {
    medicationService.delete('med-1');
    expect(medicationService.getById('med-1')).toBeUndefined();
  });
});
