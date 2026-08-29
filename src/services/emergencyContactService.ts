import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { EmergencyContact } from '../types';

export const emergencyContactService = {
  getAll(): EmergencyContact[] {
    return storageService.get<EmergencyContact[]>(KEYS.EMERGENCY_CONTACTS, []);
  },

  getByPatient(patientId: string): EmergencyContact[] {
    return this.getAll()
      .filter(ec => ec.patientId === patientId)
      .sort((a, b) => a.priority - b.priority);
  },

  getPrimaryByPatient(patientId: string): EmergencyContact | null {
    return this.getByPatient(patientId).find(ec => ec.isPrimary) || null;
  },

  add(contact: Omit<EmergencyContact, 'id'>): EmergencyContact {
    const list = this.getAll();
    const newContact: EmergencyContact = {
      ...contact,
      id: `ec-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    // If marked as primary, disable primary on other contacts for this patient
    if (newContact.isPrimary) {
      this.clearPrimaryStatus(newContact.patientId);
      // Re-read list because clearPrimaryStatus might have changed it
      const currentList = this.getAll();
      storageService.set(KEYS.EMERGENCY_CONTACTS, [...currentList, newContact]);
    } else {
      storageService.set(KEYS.EMERGENCY_CONTACTS, [...list, newContact]);
    }

    return newContact;
  },

  update(id: string, updates: Partial<EmergencyContact>): EmergencyContact | null {
    const list = this.getAll();
    const index = list.findIndex(ec => ec.id === id);
    if (index === -1) return null;

    const currentContact = list[index];
    
    if (updates.isPrimary) {
      this.clearPrimaryStatus(currentContact.patientId);
    }

    const currentList = this.getAll();
    const currentIndex = currentList.findIndex(ec => ec.id === id);
    
    const updated: EmergencyContact = {
      ...currentList[currentIndex],
      ...updates
    };
    
    currentList[currentIndex] = updated;
    storageService.set(KEYS.EMERGENCY_CONTACTS, currentList);
    return updated;
  },

  clearPrimaryStatus(patientId: string): void {
    const list = this.getAll();
    const updated = list.map(ec => {
      if (ec.patientId === patientId && ec.isPrimary) {
        return { ...ec, isPrimary: false };
      }
      return ec;
    });
    storageService.set(KEYS.EMERGENCY_CONTACTS, updated);
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter(ec => ec.id !== id);
    if (filtered.length === list.length) return false;
    storageService.set(KEYS.EMERGENCY_CONTACTS, filtered);
    return true;
  }
};
