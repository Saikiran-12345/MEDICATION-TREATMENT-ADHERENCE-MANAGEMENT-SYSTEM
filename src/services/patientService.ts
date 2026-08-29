import { storageService } from './storageService';
import { KEYS, dbService } from './dbService';
import type { Patient } from '../types';

export const patientService = {
  getAll(): Patient[] {
    return storageService.get<Patient[]>(KEYS.PATIENTS, []);
  },

  getById(id: string): Patient | undefined {
    return this.getAll().find((p) => p.id === id);
  },

  create(patientData: Omit<Patient, 'id' | 'registrationDate'>): Patient {
    const patients = this.getAll();
    
    // Simple Validation
    if (!patientData.name.trim()) throw new Error('Patient name is required');
    if (patientData.age < 0 || patientData.age > 150) throw new Error('Invalid patient age');

    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}`,
      registrationDate: new Date().toISOString().split('T')[0]
    };

    storageService.set(KEYS.PATIENTS, [...patients, newPatient]);
    dbService.logActivity('SYSTEM', 'Patient Created', `Created patient profile: ${newPatient.name}`);
    return newPatient;
  },

  update(id: string, updates: Partial<Patient>): Patient {
    const patients = this.getAll();
    const index = patients.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Patient with ID "${id}" not found`);

    const updatedPatient = { ...patients[index], ...updates };
    patients[index] = updatedPatient;

    storageService.set(KEYS.PATIENTS, patients);
    dbService.logActivity('SYSTEM', 'Patient Updated', `Updated patient profile: ${updatedPatient.name}`);
    return updatedPatient;
  },

  delete(id: string): void {
    const patients = this.getAll();
    const filtered = patients.filter((p) => p.id !== id);
    storageService.set(KEYS.PATIENTS, filtered);
    dbService.logActivity('SYSTEM', 'Patient Deleted', `Deleted patient ID: ${id}`);
  }
};
