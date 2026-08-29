export type UserRole = 'ADMIN' | 'STAFF' | 'PATIENT';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
  avatar?: string;
  patientId?: string; // If role === 'PATIENT'
  assignedStaffId?: string; // If role === 'STAFF'
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  registrationDate: string;
  assignedStaffId: string; // References User (STAFF)
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Treatment {
  id: string;
  patientId: string; // References Patient
  name: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  notes?: string;
  assignedStaffId: string; // References User (STAFF)
}

export interface Medication {
  id: string;
  name: string;
  treatmentId: string; // References Treatment
  dosage: string; // Demo value, e.g. "500mg" or "1 tablet"
  instructions: string; // Demo value, e.g. "Take after food"
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export type FrequencyType = 'ONCE_DAILY' | 'TWICE_DAILY' | 'THREE_TIMES_DAILY' | 'CUSTOM';

export interface MedicationSchedule {
  id: string;
  treatmentId: string; // References Treatment
  medicationId: string; // References Medication
  patientId: string; // References Patient
  startDate: string;
  endDate: string;
  time: string; // e.g. "08:00" or "08:00, 20:00"
  frequency: FrequencyType;
  status: 'ACTIVE' | 'INACTIVE';
}

export type DoseStatus = 'SCHEDULED' | 'TAKEN' | 'MISSED' | 'SKIPPED' | 'CANCELLED';

export interface DoseRecord {
  id: string;
  scheduleId: string; // References MedicationSchedule
  medicationId: string; // References Medication
  treatmentId: string; // References Treatment
  patientId: string; // References Patient
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  status: DoseStatus;
  actualTimeTaken?: string; // YYYY-MM-DD HH:MM
  reasonForMissed?: 'FORGOT' | 'TRAVEL' | 'SCHEDULE_CONFLICT' | 'UNAVAILABLE' | 'OTHER';
  reasonNote?: string;
  notes?: string;
}

export interface FollowUp {
  id: string;
  patientId: string; // References Patient
  staffId: string; // References User (STAFF)
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  purpose: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  notes?: string;
}

export interface Note {
  id: string;
  patientId: string; // References Patient
  treatmentId?: string; // References Treatment (optional)
  authorId: string; // References User
  authorName: string;
  date: string; // ISO String
  content: string;
  category: 'GENERAL' | 'FOLLOW_UP' | 'ADHERENCE' | 'ADMINISTRATIVE';
}

export interface Notification {
  id: string;
  userId: string; // References User
  title: string;
  message: string;
  date: string; // ISO String
  type: 'SCHEDULE' | 'MISSED_DOSE' | 'FOLLOW_UP' | 'TREATMENT_END' | 'SYSTEM';
  isRead: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string; // References User
  username: string;
  action: string;
  timestamp: string; // ISO String
  details?: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  enableNotifications: boolean;
  dashboardPreferences: {
    showTrends: boolean;
    showQuickStats: boolean;
    showRecentActivity: boolean;
  };
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
}
