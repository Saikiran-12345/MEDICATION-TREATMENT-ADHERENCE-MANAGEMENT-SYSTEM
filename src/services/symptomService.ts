import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { Symptom } from '../types';

export const symptomService = {
  getAll(): Symptom[] {
    return storageService.get<Symptom[]>(KEYS.SYMPTOMS, []);
  },

  getByPatient(patientId: string): Symptom[] {
    return this.getAll()
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.onsetDate).getTime() - new Date(a.onsetDate).getTime());
  },

  getActiveByPatient(patientId: string): Symptom[] {
    return this.getByPatient(patientId).filter(s => s.status === 'ACTIVE' || s.status === 'MONITORING');
  },

  add(symptom: Omit<Symptom, 'id' | 'onsetDate'>): Symptom {
    const symptoms = this.getAll();
    const newSymptom: Symptom = {
      ...symptom,
      id: `sym-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      onsetDate: new Date().toISOString().split('T')[0]
    };
    storageService.set(KEYS.SYMPTOMS, [newSymptom, ...symptoms]);
    return newSymptom;
  },

  update(id: string, updates: Partial<Symptom>): Symptom | null {
    const symptoms = this.getAll();
    const index = symptoms.findIndex(s => s.id === id);
    if (index === -1) return null;

    const updated: Symptom = {
      ...symptoms[index],
      ...updates
    };
    symptoms[index] = updated;
    storageService.set(KEYS.SYMPTOMS, symptoms);
    return updated;
  },

  resolve(id: string, notes?: string): boolean {
    const updates: Partial<Symptom> = {
      status: 'RESOLVED',
      resolvedDate: new Date().toISOString().split('T')[0]
    };
    if (notes) {
      updates.notes = notes;
    }
    return this.update(id, updates) !== null;
  },

  delete(id: string): boolean {
    const symptoms = this.getAll();
    const filtered = symptoms.filter(s => s.id !== id);
    if (filtered.length === symptoms.length) return false;
    storageService.set(KEYS.SYMPTOMS, filtered);
    return true;
  }
};
