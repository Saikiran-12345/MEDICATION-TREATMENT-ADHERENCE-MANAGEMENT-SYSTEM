import { storageService } from './storageService';
import initialData from '../data/initialData.json';
import type {
  Patient,
  Treatment,
  Medication,
  MedicationSchedule,
  DoseRecord,
  FollowUp,
  Note,
  Notification,
  ActivityLog,
  Settings,
  Vital,
  Symptom,
  SideEffect,
  DrugInteraction,
  Prescription,
  Appointment,
  EmergencyContact,
  LabResult,
  PharmacyItem,
  UserAccount,
  AuditEvent
} from '../types';

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
  SETTINGS: 'mtams_settings',
  VITALS: 'mtams_vitals',
  SYMPTOMS: 'mtams_symptoms',
  SIDE_EFFECTS: 'mtams_side_effects',
  DRUG_INTERACTIONS: 'mtams_drug_interactions',
  PRESCRIPTIONS: 'mtams_prescriptions',
  APPOINTMENTS: 'mtams_appointments',
  EMERGENCY_CONTACTS: 'mtams_emergency_contacts',
  LAB_RESULTS: 'mtams_lab_results',
  PHARMACY_INVENTORY: 'mtams_pharmacy_inventory',
  USER_ACCOUNTS: 'mtams_user_accounts',
  AUDIT_EVENTS: 'mtams_audit_events'
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

      // Handle new tables from initialData (using fallback empty arrays if not present yet in seed data)
      storageService.set(KEYS.VITALS, (initialData as any).vitals || []);
      storageService.set(KEYS.SYMPTOMS, (initialData as any).symptoms || []);
      storageService.set(KEYS.SIDE_EFFECTS, (initialData as any).sideEffects || []);
      storageService.set(KEYS.DRUG_INTERACTIONS, (initialData as any).drugInteractions || []);
      storageService.set(KEYS.PRESCRIPTIONS, (initialData as any).prescriptions || []);
      storageService.set(KEYS.APPOINTMENTS, (initialData as any).appointments || []);
      storageService.set(KEYS.EMERGENCY_CONTACTS, (initialData as any).emergencyContacts || []);
      storageService.set(KEYS.LAB_RESULTS, (initialData as any).labResults || []);
      storageService.set(KEYS.PHARMACY_INVENTORY, (initialData as any).pharmacyInventory || []);
      storageService.set(KEYS.USER_ACCOUNTS, (initialData as any).userAccounts || []);
      storageService.set(KEYS.AUDIT_EVENTS, (initialData as any).auditEvents || []);
      
      console.log('MTAMS: Database initialized with extended synthetic data.');
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
      settings: storageService.get<Settings | null>(KEYS.SETTINGS, null),
      vitals: storageService.get<Vital[]>(KEYS.VITALS, []),
      symptoms: storageService.get<Symptom[]>(KEYS.SYMPTOMS, []),
      sideEffects: storageService.get<SideEffect[]>(KEYS.SIDE_EFFECTS, []),
      drugInteractions: storageService.get<DrugInteraction[]>(KEYS.DRUG_INTERACTIONS, []),
      prescriptions: storageService.get<Prescription[]>(KEYS.PRESCRIPTIONS, []),
      appointments: storageService.get<Appointment[]>(KEYS.APPOINTMENTS, []),
      emergencyContacts: storageService.get<EmergencyContact[]>(KEYS.EMERGENCY_CONTACTS, []),
      labResults: storageService.get<LabResult[]>(KEYS.LAB_RESULTS, []),
      pharmacyInventory: storageService.get<PharmacyItem[]>(KEYS.PHARMACY_INVENTORY, []),
      userAccounts: storageService.get<UserAccount[]>(KEYS.USER_ACCOUNTS, []),
      auditEvents: storageService.get<AuditEvent[]>(KEYS.AUDIT_EVENTS, [])
    };
    return JSON.stringify(data, null, 2);
  },

  importJSON(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);

      // Core validation
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

      // Save expanded tables if present
      if (Array.isArray(data.vitals)) storageService.set(KEYS.VITALS, data.vitals);
      if (Array.isArray(data.symptoms)) storageService.set(KEYS.SYMPTOMS, data.symptoms);
      if (Array.isArray(data.sideEffects)) storageService.set(KEYS.SIDE_EFFECTS, data.sideEffects);
      if (Array.isArray(data.drugInteractions)) storageService.set(KEYS.DRUG_INTERACTIONS, data.drugInteractions);
      if (Array.isArray(data.prescriptions)) storageService.set(KEYS.PRESCRIPTIONS, data.prescriptions);
      if (Array.isArray(data.appointments)) storageService.set(KEYS.APPOINTMENTS, data.appointments);
      if (Array.isArray(data.emergencyContacts)) storageService.set(KEYS.EMERGENCY_CONTACTS, data.emergencyContacts);
      if (Array.isArray(data.labResults)) storageService.set(KEYS.LAB_RESULTS, data.labResults);
      if (Array.isArray(data.pharmacyInventory)) storageService.set(KEYS.PHARMACY_INVENTORY, data.pharmacyInventory);
      if (Array.isArray(data.userAccounts)) storageService.set(KEYS.USER_ACCOUNTS, data.userAccounts);
      if (Array.isArray(data.auditEvents)) storageService.set(KEYS.AUDIT_EVENTS, data.auditEvents);

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
    storageService.remove(KEYS.VITALS);
    storageService.remove(KEYS.SYMPTOMS);
    storageService.remove(KEYS.SIDE_EFFECTS);
    storageService.remove(KEYS.DRUG_INTERACTIONS);
    storageService.remove(KEYS.PRESCRIPTIONS);
    storageService.remove(KEYS.APPOINTMENTS);
    storageService.remove(KEYS.EMERGENCY_CONTACTS);
    storageService.remove(KEYS.LAB_RESULTS);
    storageService.remove(KEYS.PHARMACY_INVENTORY);
    storageService.remove(KEYS.USER_ACCOUNTS);
    storageService.remove(KEYS.AUDIT_EVENTS);
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
