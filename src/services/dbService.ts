import { storageService } from './storageService';
import initialData from '../data/initialData.json';
import type { Patient, Treatment, Medication, MedicationSchedule, DoseRecord, FollowUp, Note, Notification, ActivityLog, Settings } from '../types';

export const KEYS = {
  PATIENTS: 'mtams_patients',
  TREATMENTS: 'mtams_treatments',
  MEDICATIONS: 'mtams_medications',
  SCHEDULES: 'mtams_schedules',
  DOSES: 'mtams_doses',
  FOLLOW_UPS: 'mtams_followups',
  NOTES: 'mtams_notes',
  NOTIFICATIONS: 'mtams_notifications',
  ACTIVITY_LOGS: 'mtams_activity_logs',
  SETTINGS: 'mtams_settings'
};

export const dbService = {
  initialize(force = false) {
    const hasData = storageService.get<any[] | null>(KEYS.PATIENTS, null) !== null;

    if (!hasData || force) {
      storageService.set(KEYS.PATIENTS, initialData.patients);
      storageService.set(KEYS.TREATMENTS, initialData.treatments);
      storageService.set(KEYS.MEDICATIONS, initialData.medications);
      storageService.set(KEYS.SCHEDULES, initialData.schedules);
      storageService.set(KEYS.DOSES, initialData.doses);
      storageService.set(KEYS.FOLLOW_UPS, initialData.followUps);
      storageService.set(KEYS.NOTES, initialData.notes);
      storageService.set(KEYS.NOTIFICATIONS, initialData.notifications);
      storageService.set(KEYS.ACTIVITY_LOGS, initialData.activityLogs);
      storageService.set(KEYS.SETTINGS, initialData.settings);
      
      console.log('MTAMS: Database initialized with synthetic demo data.');
    }
  },

  exportJSON(): string {
    const data = {
      patients: storageService.get<Patient[]>(KEYS.PATIENTS, []),
      treatments: storageService.get<Treatment[]>(KEYS.TREATMENTS, []),
      medications: storageService.get<Medication[]>(KEYS.MEDICATIONS, []),
      schedules: storageService.get<MedicationSchedule[]>(KEYS.SCHEDULES, []),
      doses: storageService.get<DoseRecord[]>(KEYS.DOSES, []),
      followUps: storageService.get<FollowUp[]>(KEYS.FOLLOW_UPS, []),
      notes: storageService.get<Note[]>(KEYS.NOTES, []),
      notifications: storageService.get<Notification[]>(KEYS.NOTIFICATIONS, []),
      activityLogs: storageService.get<ActivityLog[]>(KEYS.ACTIVITY_LOGS, []),
      settings: storageService.get<Settings | null>(KEYS.SETTINGS, null)
    };
    return JSON.stringify(data, null, 2);
  },

  importJSON(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);

      // Simple validation of required arrays
      if (!Array.isArray(data.patients) || 
          !Array.isArray(data.treatments) || 
          !Array.isArray(data.medications) || 
          !Array.isArray(data.schedules) || 
          !Array.isArray(data.doses)) {
        return { success: false, error: 'Invalid file format: missing core clinical arrays.' };
      }

      // Save imported tables
      storageService.set(KEYS.PATIENTS, data.patients);
      storageService.set(KEYS.TREATMENTS, data.treatments);
      storageService.set(KEYS.MEDICATIONS, data.medications);
      storageService.set(KEYS.SCHEDULES, data.schedules);
      storageService.set(KEYS.DOSES, data.doses);
      
      if (Array.isArray(data.followUps)) storageService.set(KEYS.FOLLOW_UPS, data.followUps);
      if (Array.isArray(data.notes)) storageService.set(KEYS.NOTES, data.notes);
      if (Array.isArray(data.notifications)) storageService.set(KEYS.NOTIFICATIONS, data.notifications);
      if (Array.isArray(data.activityLogs)) storageService.set(KEYS.ACTIVITY_LOGS, data.activityLogs);
      if (data.settings) storageService.set(KEYS.SETTINGS, data.settings);

      this.logActivity('SYSTEM', 'Database imported', 'User imported database via JSON file.');
      return { success: true };
    } catch (e) {
      console.error('Error importing database:', e);
      return { success: false, error: 'Invalid JSON file: parsing failed.' };
    }
  },

  reset() {
    this.initialize(true);
    this.logActivity('SYSTEM', 'Database reset', 'Database reset to default synthetic values.');
  },

  clear() {
    storageService.remove(KEYS.PATIENTS);
    storageService.remove(KEYS.TREATMENTS);
    storageService.remove(KEYS.MEDICATIONS);
    storageService.remove(KEYS.SCHEDULES);
    storageService.remove(KEYS.DOSES);
    storageService.remove(KEYS.FOLLOW_UPS);
    storageService.remove(KEYS.NOTES);
    storageService.remove(KEYS.NOTIFICATIONS);
    storageService.remove(KEYS.ACTIVITY_LOGS);
    storageService.remove(KEYS.SETTINGS);
  },

  logActivity(userId: string, action: string, details?: string) {
    try {
      const logs = storageService.get<ActivityLog[]>(KEYS.ACTIVITY_LOGS, []);
      const newLog: ActivityLog = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId,
        username: userId === 'SYSTEM' ? 'SYSTEM' : 'User',
        action,
        timestamp: new Date().toISOString(),
        details
      };
      storageService.set(KEYS.ACTIVITY_LOGS, [newLog, ...logs].slice(0, 500)); // cap logs at 500
    } catch (e) {
      console.error('Failed to write activity log:', e);
    }
  }
};
