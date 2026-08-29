import { storageService } from './storageService';
import { KEYS, dbService } from './dbService';
import type { Medication } from '../types';

export const medicationService = {
  getAll(): Medication[] {
    return storageService.get<Medication[]>(KEYS.MEDICATIONS, []);
  },

  getById(id: string): Medication | undefined {
    return this.getAll().find((m) => m.id === id);
  },

  getByTreatmentId(treatmentId: string): Medication[] {
    return this.getAll().filter((m) => m.treatmentId === treatmentId);
  },

  create(medicationData: Omit<Medication, 'id'>): Medication {
    const medications = this.getAll();

    // Validations
    if (!medicationData.name.trim()) throw new Error('Medication name is required');
    if (!medicationData.dosage.trim()) throw new Error('Dosage instructions are required');
    if (!medicationData.treatmentId) throw new Error('Treatment plan association is required');
    if (new Date(medicationData.endDate) < new Date(medicationData.startDate)) {
      throw new Error('Medication active End Date cannot be before Start Date');
    }

    const newMedication: Medication = {
      ...medicationData,
      id: `med-${Date.now()}`
    };

    storageService.set(KEYS.MEDICATIONS, [...medications, newMedication]);
    dbService.logActivity('SYSTEM', 'Medication Catalogued', `Added medication "${newMedication.name}" to treatment ${newMedication.treatmentId}`);
    return newMedication;
  },

  update(id: string, updates: Partial<Medication>): Medication {
    const medications = this.getAll();
    const index = medications.findIndex((m) => m.id === id);
    if (index === -1) throw new Error(`Medication record "${id}" not found`);

    const updatedMedication = { ...medications[index], ...updates };

    if (new Date(updatedMedication.endDate) < new Date(updatedMedication.startDate)) {
      throw new Error('Medication active End Date cannot be before Start Date');
    }

    medications[index] = updatedMedication;
    storageService.set(KEYS.MEDICATIONS, medications);
    dbService.logActivity('SYSTEM', 'Medication Updated', `Updated medication details for "${updatedMedication.name}"`);
    return updatedMedication;
  },

  delete(id: string): void {
    const medications = this.getAll();
    const filtered = medications.filter((m) => m.id !== id);
    storageService.set(KEYS.MEDICATIONS, filtered);
    dbService.logActivity('SYSTEM', 'Medication Removed', `Removed medication ID: ${id}`);
  }
};
