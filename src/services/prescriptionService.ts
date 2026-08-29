import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { Prescription } from '../types';

export const prescriptionService = {
  getAll(): Prescription[] {
    return storageService.get<Prescription[]>(KEYS.PRESCRIPTIONS, []);
  },

  getByPatient(patientId: string): Prescription[] {
    return this.getAll()
      .filter(p => p.patientId === patientId)
      .sort((a, b) => new Date(b.prescribedDate).getTime() - new Date(a.prescribedDate).getTime());
  },

  getActiveByPatient(patientId: string): Prescription[] {
    return this.getByPatient(patientId).filter(p => p.status === 'ACTIVE');
  },

  add(prescription: Omit<Prescription, 'id' | 'prescribedDate' | 'refillsUsed' | 'status'>): Prescription {
    const rxList = this.getAll();
    const newRx: Prescription = {
      ...prescription,
      id: `rx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      prescribedDate: new Date().toISOString().split('T')[0],
      refillsUsed: 0,
      status: 'ACTIVE'
    };
    storageService.set(KEYS.PRESCRIPTIONS, [newRx, ...rxList]);
    return newRx;
  },

  update(id: string, updates: Partial<Prescription>): Prescription | null {
    const rxList = this.getAll();
    const index = rxList.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updated: Prescription = {
      ...rxList[index],
      ...updates
    };
    rxList[index] = updated;
    storageService.set(KEYS.PRESCRIPTIONS, rxList);
    return updated;
  },

  useRefill(id: string): boolean {
    const rxList = this.getAll();
    const rx = rxList.find(p => p.id === id);
    if (!rx || rx.status !== 'ACTIVE') return false;
    
    const remaining = rx.refillsAllowed - rx.refillsUsed;
    if (remaining <= 0) return false;

    const updatedRefillsUsed = rx.refillsUsed + 1;
    const isCompleted = updatedRefillsUsed >= rx.refillsAllowed;

    return this.update(id, {
      refillsUsed: updatedRefillsUsed,
      status: isCompleted ? 'COMPLETED' : 'ACTIVE'
    }) !== null;
  },

  cancelPrescription(id: string, notes?: string): boolean {
    const updates: Partial<Prescription> = {
      status: 'CANCELLED'
    };
    if (notes) {
      updates.notes = notes;
    }
    return this.update(id, updates) !== null;
  },

  delete(id: string): boolean {
    const rxList = this.getAll();
    const filtered = rxList.filter(p => p.id !== id);
    if (filtered.length === rxList.length) return false;
    storageService.set(KEYS.PRESCRIPTIONS, filtered);
    return true;
  }
};
