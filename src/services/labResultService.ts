import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { LabResult } from '../types';

export const labResultService = {
  getAll(): LabResult[] {
    return storageService.get<LabResult[]>(KEYS.LAB_RESULTS, []);
  },

  getByPatient(patientId: string): LabResult[] {
    return this.getAll()
      .filter(l => l.patientId === patientId)
      .sort((a, b) => new Date(b.collectedDate).getTime() - new Date(a.collectedDate).getTime());
  },

  getAbnormalByPatient(patientId: string): LabResult[] {
    return this.getByPatient(patientId).filter(l => l.isAbnormal);
  },

  add(result: Omit<LabResult, 'id' | 'resultDate'>): LabResult {
    const list = this.getAll();
    const newResult: LabResult = {
      ...result,
      id: `lab-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      resultDate: new Date().toISOString().split('T')[0]
    };
    storageService.set(KEYS.LAB_RESULTS, [newResult, ...list]);
    return newResult;
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter(l => l.id !== id);
    if (filtered.length === list.length) return false;
    storageService.set(KEYS.LAB_RESULTS, filtered);
    return true;
  }
};
