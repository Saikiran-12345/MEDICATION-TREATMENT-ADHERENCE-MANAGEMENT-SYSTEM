import { describe, it, expect, beforeEach } from 'vitest';
import { patientService } from './patientService';
import { dbService } from './dbService';

describe('patientService', () => {
  beforeEach(() => {
    // Reset database to default synthetic values
    dbService.reset();
  });

  it('should list all initial synthetic patients', () => {
    const list = patientService.getAll();
    expect(list.length).toBe(150);
    expect(list[0].name).toBe('John Doe');
  });

  it('should get a patient by ID', () => {
    const patient = patientService.getById('pat-1');
    expect(patient).toBeDefined();
    expect(patient?.name).toBe('John Doe');
  });

  it('should register a new patient', () => {
    const newPat = patientService.create({
      name: 'Bruce Wayne',
      age: 35,
      gender: 'Male',
      contactInfo: {
        phone: '+1 (555) 000-1111',
        email: 'bruce@waynecorp.com',
        address: 'Wayne Manor, Gotham'
      },
      status: 'ACTIVE',
      assignedStaffId: 'staff-1'
    });

    expect(newPat.id).toBeDefined();
    expect(newPat.name).toBe('Bruce Wayne');
    
    // Verify it is saved
    const saved = patientService.getById(newPat.id);
    expect(saved).toBeDefined();
    expect(saved?.name).toBe('Bruce Wayne');
    expect(patientService.getAll().length).toBe(151);
  });

  it('should fail registration with invalid age or empty name', () => {
    expect(() => {
      patientService.create({
        name: '',
        age: 35,
        gender: 'Male',
        contactInfo: { phone: '123', email: '', address: '' },
        status: 'ACTIVE',
        assignedStaffId: 'staff-1'
      });
    }).toThrow('Patient name is required');

    expect(() => {
      patientService.create({
        name: 'Bruce Wayne',
        age: -5,
        gender: 'Male',
        contactInfo: { phone: '123', email: '', address: '' },
        status: 'ACTIVE',
        assignedStaffId: 'staff-1'
      });
    }).toThrow('Invalid patient age');
  });

  it('should update patient details', () => {
    const updated = patientService.update('pat-1', {
      name: 'Johnathan Doe Jr.'
    });

    expect(updated.name).toBe('Johnathan Doe Jr.');
    
    const saved = patientService.getById('pat-1');
    expect(saved?.name).toBe('Johnathan Doe Jr.');
  });

  it('should delete a patient profile', () => {
    patientService.delete('pat-1');
    expect(patientService.getById('pat-1')).toBeUndefined();
    expect(patientService.getAll().length).toBe(149);
  });
});
