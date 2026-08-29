import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { SideEffect } from '../types';

export const sideEffectService = {
  getAll(): SideEffect[] {
    return storageService.get<SideEffect[]>(KEYS.SIDE_EFFECTS, []);
  },

  getByPatient(patientId: string): SideEffect[] {
    return this.getAll()
      .filter(s => s.patientId === patientId)
      .sort((a, b) => new Date(b.onsetDate).getTime() - new Date(a.onsetDate).getTime());
  },

  getByMedication(medicationId: string): SideEffect[] {
    return this.getAll().filter(s => s.medicationId === medicationId);
  },

  add(sideEffect: Omit<SideEffect, 'id' | 'onsetDate'>): SideEffect {
    const sideEffects = this.getAll();
    const newSideEffect: SideEffect = {
      ...sideEffect,
      id: `se-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      onsetDate: new Date().toISOString().split('T')[0]
    };
    storageService.set(KEYS.SIDE_EFFECTS, [newSideEffect, ...sideEffects]);
    return newSideEffect;
  },

  update(id: string, updates: Partial<SideEffect>): SideEffect | null {
    const sideEffects = this.getAll();
    const index = sideEffects.findIndex(s => s.id === id);
    if (index === -1) return null;

    const updated: SideEffect = {
      ...sideEffects[index],
      ...updates
    };
    sideEffects[index] = updated;
    storageService.set(KEYS.SIDE_EFFECTS, sideEffects);
    return updated;
  },

  resolve(id: string, notes?: string): boolean {
    const updates: Partial<SideEffect> = {
      status: 'RESOLVED',
      resolvedDate: new Date().toISOString().split('T')[0]
    };
    if (notes) {
      updates.notes = notes;
    }
    return this.update(id, updates) !== null;
  },

  delete(id: string): boolean {
    const sideEffects = this.getAll();
    const filtered = sideEffects.filter(s => s.id !== id);
    if (filtered.length === sideEffects.length) return false;
    storageService.set(KEYS.SIDE_EFFECTS, filtered);
    return true;
  }
};
