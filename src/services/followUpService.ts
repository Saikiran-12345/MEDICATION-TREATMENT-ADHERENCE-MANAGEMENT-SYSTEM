import { storageService } from './storageService';
import { KEYS, dbService } from './dbService';
import type { FollowUp } from '../types';

export const followUpService = {
  getAll(): FollowUp[] {
    return storageService.get<FollowUp[]>(KEYS.FOLLOW_UPS, []);
  },

  getById(id: string): FollowUp | undefined {
    return this.getAll().find((f) => f.id === id);
  },

  getByPatientId(patientId: string): FollowUp[] {
    return this.getAll().filter((f) => f.patientId === patientId);
  },

  getByStaffId(staffId: string): FollowUp[] {
    return this.getAll().filter((f) => f.staffId === staffId);
  },

  create(fupData: Omit<FollowUp, 'id'>): FollowUp {
    const fups = this.getAll();

    // Validations
    if (!fupData.patientId) throw new Error('Patient association is required');
    if (!fupData.date) throw new Error('Follow-up date is required');
    if (!fupData.time) throw new Error('Follow-up time is required');
    if (!fupData.purpose.trim()) throw new Error('Purpose of visit is required');

    const newFup: FollowUp = {
      ...fupData,
      id: `fup-${Date.now()}`
    };

    storageService.set(KEYS.FOLLOW_UPS, [...fups, newFup]);
    dbService.logActivity('SYSTEM', 'Follow-up Scheduled', `Scheduled checkin for patient ${newFup.patientId} on ${newFup.date}`);
    return newFup;
  },

  update(id: string, updates: Partial<FollowUp>): FollowUp {
    const fups = this.getAll();
    const index = fups.findIndex((f) => f.id === id);
    if (index === -1) throw new Error(`Follow-up appointment "${id}" not found`);

    const updatedFup = { ...fups[index], ...updates };
    fups[index] = updatedFup;
    storageService.set(KEYS.FOLLOW_UPS, fups);
    dbService.logActivity('SYSTEM', 'Follow-up Updated', `Updated appointment status: ${updatedFup.status}`);
    return updatedFup;
  },

  delete(id: string): void {
    const fups = this.getAll();
    const filtered = fups.filter((f) => f.id !== id);
    storageService.set(KEYS.FOLLOW_UPS, filtered);
    dbService.logActivity('SYSTEM', 'Follow-up Cancelled', `Deleted appointment ID: ${id}`);
  }
};
