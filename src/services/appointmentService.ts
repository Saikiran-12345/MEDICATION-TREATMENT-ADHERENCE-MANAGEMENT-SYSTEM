import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { Appointment } from '../types';

export const appointmentService = {
  getAll(): Appointment[] {
    return storageService.get<Appointment[]>(KEYS.APPOINTMENTS, []);
  },

  getByPatient(patientId: string): Appointment[] {
    return this.getAll()
      .filter(a => a.patientId === patientId)
      .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());
  },

  getByStaff(staffId: string): Appointment[] {
    return this.getAll()
      .filter(a => a.staffId === staffId)
      .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());
  },

  getUpcomingByPatient(patientId: string): Appointment[] {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.getByPatient(patientId)
      .filter(a => a.date >= todayStr && a.status !== 'CANCELLED' && a.status !== 'COMPLETED');
  },

  add(appt: Omit<Appointment, 'id' | 'status'>): Appointment {
    const appts = this.getAll();
    const newAppt: Appointment = {
      ...appt,
      id: `appt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'SCHEDULED'
    };
    storageService.set(KEYS.APPOINTMENTS, [...appts, newAppt]);
    return newAppt;
  },

  update(id: string, updates: Partial<Appointment>): Appointment | null {
    const appts = this.getAll();
    const index = appts.findIndex(a => a.id === id);
    if (index === -1) return null;

    const updated: Appointment = {
      ...appts[index],
      ...updates
    };
    appts[index] = updated;
    storageService.set(KEYS.APPOINTMENTS, appts);
    return updated;
  },

  setStatus(id: string, status: Appointment['status']): boolean {
    return this.update(id, { status }) !== null;
  },

  delete(id: string): boolean {
    const appts = this.getAll();
    const filtered = appts.filter(a => a.id !== id);
    if (filtered.length === appts.length) return false;
    storageService.set(KEYS.APPOINTMENTS, filtered);
    return true;
  }
};
