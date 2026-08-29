import { storageService } from './storageService';
import { KEYS, dbService } from './dbService';
import type { DoseRecord, DoseStatus, Notification } from '../types';

export const doseService = {
  getAll(): DoseRecord[] {
    return storageService.get<DoseRecord[]>(KEYS.DOSES, []);
  },

  getById(id: string): DoseRecord | undefined {
    return this.getAll().find((d) => d.id === id);
  },

  getByPatientId(patientId: string): DoseRecord[] {
    return this.getAll().filter((d) => d.patientId === patientId);
  },

  getByScheduleId(scheduleId: string): DoseRecord[] {
    return this.getAll().filter((d) => d.scheduleId === scheduleId);
  },

  getByDate(date: string): DoseRecord[] {
    return this.getAll().filter((d) => d.scheduledDate === date);
  },

  create(dose: DoseRecord): DoseRecord {
    const doses = this.getAll();
    storageService.set(KEYS.DOSES, [...doses, dose]);
    return dose;
  },

  update(id: string, updates: Partial<DoseRecord>): DoseRecord {
    const doses = this.getAll();
    const index = doses.findIndex((d) => d.id === id);
    if (index === -1) throw new Error(`Dose record "${id}" not found`);

    const updatedDose = { ...doses[index], ...updates };
    doses[index] = updatedDose;
    storageService.set(KEYS.DOSES, doses);
    return updatedDose;
  },

  updateStatus(
    id: string, 
    status: DoseStatus, 
    actualTimeTaken?: string, 
    reasonForMissed?: 'FORGOT' | 'TRAVEL' | 'SCHEDULE_CONFLICT' | 'UNAVAILABLE' | 'OTHER', 
    reasonNote?: string
  ): DoseRecord {
    const doses = this.getAll();
    const index = doses.findIndex((d) => d.id === id);
    if (index === -1) throw new Error(`Dose record "${id}" not found`);

    const originalDose = doses[index];
    const updatedDose: DoseRecord = {
      ...originalDose,
      status,
      actualTimeTaken: status === 'TAKEN' ? (actualTimeTaken || new Date().toISOString().replace('T', ' ').substring(0, 16)) : undefined,
      reasonForMissed: status === 'MISSED' ? reasonForMissed : undefined,
      reasonNote: status === 'MISSED' ? reasonNote : undefined
    };

    doses[index] = updatedDose;
    storageService.set(KEYS.DOSES, doses);

    // Logging action
    dbService.logActivity(
      updatedDose.patientId, 
      `Dose marked ${status}`, 
      `Medication ID: ${updatedDose.medicationId}, Scheduled: ${updatedDose.scheduledDate} ${updatedDose.scheduledTime}`
    );

    // Generate alerts for Staff if a dose is missed
    if (status === 'MISSED' || status === 'SKIPPED') {
      this.triggerMissedDoseAlert(updatedDose);
    }

    return updatedDose;
  },

  triggerMissedDoseAlert(dose: DoseRecord) {
    try {
      const notifications = storageService.get<Notification[]>(KEYS.NOTIFICATIONS, []);
      
      // Look up patient name
      const patients = storageService.get<any[]>(KEYS.PATIENTS, []);
      const patient = patients.find(p => p.id === dose.patientId);
      const patientName = patient ? patient.name : 'Unknown Patient';

      // Look up medication name
      const medications = storageService.get<any[]>(KEYS.MEDICATIONS, []);
      const medication = medications.find(m => m.id === dose.medicationId);
      const medName = medication ? medication.name : 'Medication';

      // Create alert for staff (assignedStaffId)
      const staffId = patient ? patient.assignedStaffId : 'staff-1';

      const newAlert: Notification = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: staffId,
        title: `Missed Dose Alert: ${patientName}`,
        message: `${patientName} missed their scheduled dose of ${medName} ${medication ? medication.dosage : ''} scheduled for ${dose.scheduledDate} ${dose.scheduledTime}. Reason: ${dose.reasonForMissed || 'Not Specified'}.`,
        date: new Date().toISOString(),
        type: 'MISSED_DOSE',
        isRead: false
      };

      storageService.set(KEYS.NOTIFICATIONS, [newAlert, ...notifications]);
    } catch (e) {
      console.error('Failed to trigger missed dose alert:', e);
    }
  }
};
