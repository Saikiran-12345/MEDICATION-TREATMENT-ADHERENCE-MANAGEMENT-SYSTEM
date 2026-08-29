import type React from 'react';

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

export interface Vital {
  id: string;
  patientId: string;
  type: VitalType;
  value: number;
  secondaryValue?: number; // e.g. diastolic for BP
  unit: string;
  recordedAt: string; // ISO datetime
  recordedBy: string; // userId
  notes?: string;
}

export type VitalType = 'BLOOD_PRESSURE' | 'HEART_RATE' | 'WEIGHT' | 'GLUCOSE' | 'TEMPERATURE' | 'SPO2';

export interface Symptom {
  id: string;
  patientId: string;
  name: string;
  severity: number; // 1-10
  bodyArea: string;
  onsetDate: string;
  resolvedDate?: string;
  linkedMedicationId?: string;
  notes?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'MONITORING';
}

export interface SideEffect {
  id: string;
  patientId: string;
  medicationId: string;
  name: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  onsetDate: string;
  resolvedDate?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'MONITORING';
  notes?: string;
}

export interface DrugInteraction {
  id: string;
  drugA: string; // medication name or ID
  drugB: string;
  severity: 'MAJOR' | 'MODERATE' | 'MINOR';
  description: string;
  clinicalEffect: string;
  recommendation: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medicationId: string;
  prescribedBy: string; // staffId
  prescribedDate: string;
  dosage: string;
  instructions: string;
  quantity: number;
  refillsAllowed: number;
  refillsUsed: number;
  pharmacyId?: string;
  expiryDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  location: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: string;
}

export type AppointmentType = 'CONSULTATION' | 'FOLLOW_UP' | 'CHECK_UP' | 'LAB_WORK' | 'PROCEDURE' | 'THERAPY' | 'EMERGENCY';

export interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  priority: number;
  notes?: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  category: LabCategory;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  collectedDate: string;
  resultDate: string;
  orderedBy: string; // staffId
  notes?: string;
}

export type LabCategory = 'BLOOD_WORK' | 'URINALYSIS' | 'IMAGING' | 'MICROBIOLOGY' | 'PATHOLOGY' | 'CARDIOLOGY' | 'OTHER';

export interface PharmacyItem {
  id: string;
  medicationName: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  expiryDate: string;
  category: string;
  location: string; // shelf/bin location
  lastRestocked: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  patientId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  sessionCount: number;
}

export interface SearchResult {
  id: string;
  type: 'PATIENT' | 'TREATMENT' | 'MEDICATION' | 'NOTE' | 'PRESCRIPTION' | 'APPOINTMENT';
  title: string;
  subtitle: string;
  matchedField: string;
  relevanceScore: number;
  link: string;
}

export interface AuditEvent {
  id: string;
  userId: string;
  username: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  timestamp: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'IMPORT' | 'LOGIN' | 'LOGOUT' | 'RESET';

export interface ExportConfig {
  format: 'CSV' | 'JSON' | 'HTML';
  entityType: string;
  columns: string[];
  filters?: Record<string, unknown>;
  dateRange?: { start: string; end: string };
  includeHeaders: boolean;
  filename: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'time' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  pattern?: string;
  helperText?: string;
}

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  accessor?: (row: T) => unknown;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: unknown;
}

// ===================== EMAIL SERVICE TYPES =====================

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'MEDICATION' | 'APPOINTMENT' | 'ADHERENCE' | 'PRESCRIPTION' | 'TREATMENT' | 'OTHER';
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

export interface EmailMessage {
  id: string;
  templateId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  variables: Record<string, string>;
  status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'FAILED';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  cc: string[];
  bcc: string[];
  scheduledTime: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failureReason: string | null;
}

export interface EmailDeliveryLog {
  messageId: string;
  email: string;
  status: string;
  timestamp: string;
  error: string | null;
}

// ===================== SMS SERVICE TYPES =====================

export interface SMSTemplate {
  id: string;
  name: string;
  category: 'MEDICATION' | 'APPOINTMENT' | 'FOLLOW_UP' | 'PRESCRIPTION' | 'OTHER';
  content: string;
  variables: string[];
  isActive: boolean;
  characterCount: number;
  createdAt: string;
}

export interface SMSMessage {
  id: string;
  templateId: string;
  phoneNumber: string;
  content: string;
  variables: Record<string, string>;
  status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'FAILED';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  requiresConfirmation: boolean;
  confirmationResponse: string | null;
  scheduledTime: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failureReason: string | null;
  characterCount: number;
  messageCount: number;
}

export interface SMSDeliveryLog {
  messageId: string;
  phoneNumber: string;
  status: string;
  timestamp: string;
  error: string | null;
}

// ===================== NOTIFICATION CONFIG SERVICE TYPES =====================

export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';

export interface UserNotificationSettings {
  userId: string;
  email: string | null;
  phoneNumber: string | null;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  preferences: Record<NotificationChannel, Record<string, boolean>>;
  quiet_hours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  digest_preferences: {
    enabled: boolean;
    frequency: 'IMMEDIATELY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    time: string;
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationRule {
  id: string;
  userId: string;
  name: string;
  trigger: string;
  actions: NotificationChannel[];
  condition?: Record<string, any>;
  enabled: boolean;
  createdAt: string;
}

// ===================== NOTIFICATION QUEUE TYPES =====================

export interface QueuedNotification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  templateId: string;
  variables: Record<string, string>;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  scheduledTime?: string;
  retryCount: number;
  maxRetries: number;
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  error?: string;
}

export interface NotificationBatch {
  id: string;
  name: string;
  totalCount: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface NotificationDeliveryReport {
  startDate: string;
  endDate: string;
  totalSent: number;
  successful: number;
  failed: number;
  pending: number;
  byChannel: Record<string, number>;
  successRate: number;
}
