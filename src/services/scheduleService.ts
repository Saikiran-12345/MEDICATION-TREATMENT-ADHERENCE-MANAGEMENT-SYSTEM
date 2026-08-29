import { storageService } from './storageService';
import { KEYS, dbService } from './dbService';
import type { MedicationSchedule, DoseRecord } from '../types';

export const scheduleService = {
  getAll(): MedicationSchedule[] {
    return storageService.get<MedicationSchedule[]>(KEYS.SCHEDULES, []);
  },

  getById(id: string): MedicationSchedule | undefined {
    return this.getAll().find((s) => s.id === id);
  },

  getByPatientId(patientId: string): MedicationSchedule[] {
    return this.getAll().filter((s) => s.patientId === patientId);
  },

  getByTreatmentId(treatmentId: string): MedicationSchedule[] {
    return this.getAll().filter((s) => s.treatmentId === treatmentId);
  },

  create(scheduleData: Omit<MedicationSchedule, 'id'>): MedicationSchedule {
    const schedules = this.getAll();

    // Validations
    if (!scheduleData.medicationId) throw new Error('Medication association is required');
    if (!scheduleData.patientId) throw new Error('Patient association is required');
    if (!scheduleData.treatmentId) throw new Error('Treatment plan association is required');
    if (new Date(scheduleData.endDate) < new Date(scheduleData.startDate)) {
      throw new Error('Schedule End Date cannot be before Start Date');
    }
    if (!scheduleData.time.trim()) throw new Error('Schedule timing (HH:MM) is required');

    const newSchedule: MedicationSchedule = {
      ...scheduleData,
      id: `sched-${Date.now()}`
    };

    storageService.set(KEYS.SCHEDULES, [...schedules, newSchedule]);
    dbService.logActivity('SYSTEM', 'Schedule Created', `Created medication schedule ID: ${newSchedule.id}`);

    // Generate Dose Records automatically for the schedule duration
    this.generateDosesForSchedule(newSchedule);

    return newSchedule;
  },

  update(id: string, updates: Partial<MedicationSchedule>): MedicationSchedule {
    const schedules = this.getAll();
    const index = schedules.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Schedule "${id}" not found`);

    const updatedSchedule = { ...schedules[index], ...updates };

    if (new Date(updatedSchedule.endDate) < new Date(updatedSchedule.startDate)) {
      throw new Error('Schedule End Date cannot be before Start Date');
    }

    schedules[index] = updatedSchedule;
    storageService.set(KEYS.SCHEDULES, schedules);
    dbService.logActivity('SYSTEM', 'Schedule Updated', `Updated schedule ID: ${updatedSchedule.id}`);

    // Regenerate upcoming scheduled doses
    this.regenerateUpcomingDoses(updatedSchedule);

    return updatedSchedule;
  },

  delete(id: string): void {
    const schedules = this.getAll();
    const filtered = schedules.filter((s) => s.id !== id);
    storageService.set(KEYS.SCHEDULES, filtered);

    // Remove associated upcoming/scheduled doses
    const doses = storageService.get<DoseRecord[]>(KEYS.DOSES, []);
    const filteredDoses = doses.filter(d => !(d.scheduleId === id && d.status === 'SCHEDULED'));
    storageService.set(KEYS.DOSES, filteredDoses);

    dbService.logActivity('SYSTEM', 'Schedule Removed', `Removed schedule ID: ${id} and deleted its upcoming scheduled doses`);
  },

  // Generates dose records for each day of the active schedule (caps at 30 days to avoid performance overhead)
  generateDosesForSchedule(schedule: MedicationSchedule) {
    const doses = storageService.get<DoseRecord[]>(KEYS.DOSES, []);
    const newDoses: DoseRecord[] = [];

    const start = new Date(schedule.startDate);
    const end = new Date(schedule.endDate);
    
    // Safety boundary: only pre-generate up to 30 days
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.min(Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1, 30);

    const times = schedule.time.split(',').map(t => t.trim());

    for (let i = 0; i < durationDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      times.forEach((timeVal, idx) => {
        newDoses.push({
          id: `dose-${schedule.id}-${dateStr}-${idx}-${Math.floor(Math.random() * 1000)}`,
          scheduleId: schedule.id,
          medicationId: schedule.medicationId,
          treatmentId: schedule.treatmentId,
          patientId: schedule.patientId,
          scheduledDate: dateStr,
          scheduledTime: timeVal,
          status: 'SCHEDULED'
        });
      });
    }

    storageService.set(KEYS.DOSES, [...doses, ...newDoses]);
  },

  regenerateUpcomingDoses(schedule: MedicationSchedule) {
    const doses = storageService.get<DoseRecord[]>(KEYS.DOSES, []);
    
    // Keep already taken/missed historical doses, delete upcoming scheduled ones
    const todayStr = new Date().toISOString().split('T')[0];
    const filtered = doses.filter(d => !(d.scheduleId === schedule.id && d.status === 'SCHEDULED' && d.scheduledDate >= todayStr));
    
    const newDoses: DoseRecord[] = [];
    const today = new Date(todayStr);
    const end = new Date(schedule.endDate);

    const durationMs = end.getTime() - today.getTime();
    if (durationMs < 0) {
      storageService.set(KEYS.DOSES, filtered);
      return;
    }

    const durationDays = Math.min(Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1, 30);
    const times = schedule.time.split(',').map(t => t.trim());

    for (let i = 0; i < durationDays; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      times.forEach((timeVal, idx) => {
        newDoses.push({
          id: `dose-${schedule.id}-${dateStr}-${idx}-${Math.floor(Math.random() * 1000)}`,
          scheduleId: schedule.id,
          medicationId: schedule.medicationId,
          treatmentId: schedule.treatmentId,
          patientId: schedule.patientId,
          scheduledDate: dateStr,
          scheduledTime: timeVal,
          status: 'SCHEDULED'
        });
      });
    }

    storageService.set(KEYS.DOSES, [...filtered, ...newDoses]);
  }
};
