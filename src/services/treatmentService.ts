import { storageService } from './storageService';
import { KEYS, dbService } from './dbService';
import type { Treatment } from '../types';

export const treatmentService = {
  getAll(): Treatment[] {
    return storageService.get<Treatment[]>(KEYS.TREATMENTS, []);
  },

  getById(id: string): Treatment | undefined {
    return this.getAll().find((t) => t.id === id);
  },

  getByPatientId(patientId: string): Treatment[] {
    return this.getAll().filter((t) => t.patientId === patientId);
  },

  create(treatmentData: Omit<Treatment, 'id'>): Treatment {
    const treatments = this.getAll();

    // Validations
    if (!treatmentData.name.trim()) throw new Error('Treatment name is required');
    if (!treatmentData.patientId) throw new Error('Patient association is required');
    if (new Date(treatmentData.endDate) < new Date(treatmentData.startDate)) {
      throw new Error('Treatment End Date cannot be before Start Date');
    }

    const newTreatment: Treatment = {
      ...treatmentData,
      id: `treat-${Date.now()}`
    };

    storageService.set(KEYS.TREATMENTS, [...treatments, newTreatment]);
    dbService.logActivity('SYSTEM', 'Treatment Created', `Created treatment course "${newTreatment.name}" for patient ${newTreatment.patientId}`);
    return newTreatment;
  },

  update(id: string, updates: Partial<Treatment>): Treatment {
    const treatments = this.getAll();
    const index = treatments.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Treatment course "${id}" not found`);

    const updatedTreatment = { ...treatments[index], ...updates };
    
    // Validate dates if updated
    if (new Date(updatedTreatment.endDate) < new Date(updatedTreatment.startDate)) {
      throw new Error('Treatment End Date cannot be before Start Date');
    }

    treatments[index] = updatedTreatment;
    storageService.set(KEYS.TREATMENTS, treatments);
    dbService.logActivity('SYSTEM', 'Treatment Updated', `Updated treatment course "${updatedTreatment.name}"`);
    return updatedTreatment;
  },

  delete(id: string): void {
    const treatments = this.getAll();
    const filtered = treatments.filter((t) => t.id !== id);
    storageService.set(KEYS.TREATMENTS, filtered);
    dbService.logActivity('SYSTEM', 'Treatment Deleted', `Deleted treatment ID: ${id}`);
  }
};
