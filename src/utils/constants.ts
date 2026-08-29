// ============================================================
// MTAMS Application Constants
// Centralised configuration values used across the application
// ============================================================

// ---------- Dose Time Periods ----------
export const DOSE_PERIODS = {
  MORNING: { label: 'Morning', start: '06:00', end: '11:59', icon: '🌅' },
  AFTERNOON: { label: 'Afternoon', start: '12:00', end: '17:59', icon: '☀️' },
  EVENING: { label: 'Evening', start: '18:00', end: '20:59', icon: '🌇' },
  NIGHT: { label: 'Night', start: '21:00', end: '05:59', icon: '🌙' },
} as const;

// ---------- Status Colour Mapping ----------
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  ACTIVE: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-900/30', dot: 'bg-green-500' },
  INACTIVE: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-600', dot: 'bg-gray-400' },
  COMPLETED: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/30', dot: 'bg-blue-500' },
  PLANNED: { bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900/30', dot: 'bg-indigo-500' },
  PAUSED: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/30', dot: 'bg-amber-500' },
  CANCELLED: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/30', dot: 'bg-red-500' },
  SCHEDULED: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-900/30', dot: 'bg-cyan-500' },
  TAKEN: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
  MISSED: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/30', dot: 'bg-red-500' },
  SKIPPED: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/30', dot: 'bg-yellow-500' },
  CONFIRMED: { bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-900/30', dot: 'bg-teal-500' },
  IN_PROGRESS: { bg: 'bg-violet-50 dark:bg-violet-950/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-900/30', dot: 'bg-violet-500' },
  NO_SHOW: { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/30', dot: 'bg-rose-500' },
  EXPIRED: { bg: 'bg-stone-50 dark:bg-stone-950/20', text: 'text-stone-700 dark:text-stone-400', border: 'border-stone-200 dark:border-stone-900/30', dot: 'bg-stone-500' },
  RESOLVED: { bg: 'bg-lime-50 dark:bg-lime-950/20', text: 'text-lime-700 dark:text-lime-400', border: 'border-lime-200 dark:border-lime-900/30', dot: 'bg-lime-500' },
  MONITORING: { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900/30', dot: 'bg-orange-500' },
  IN_STOCK: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-900/30', dot: 'bg-green-500' },
  LOW_STOCK: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/30', dot: 'bg-amber-500' },
  OUT_OF_STOCK: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/30', dot: 'bg-red-500' },
};

// ---------- Frequency Options ----------
export const FREQUENCY_OPTIONS = [
  { value: 'ONCE_DAILY', label: 'Once Daily' },
  { value: 'TWICE_DAILY', label: 'Twice Daily' },
  { value: 'THREE_TIMES_DAILY', label: 'Three Times Daily' },
  { value: 'FOUR_TIMES_DAILY', label: 'Four Times Daily' },
  { value: 'EVERY_6_HOURS', label: 'Every 6 Hours' },
  { value: 'EVERY_8_HOURS', label: 'Every 8 Hours' },
  { value: 'EVERY_12_HOURS', label: 'Every 12 Hours' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every Two Weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'AS_NEEDED', label: 'As Needed (PRN)' },
] as const;

// ---------- Severity Levels ----------
export const SEVERITY_LEVELS = [
  { value: 1, label: 'Minimal', color: 'text-green-600' },
  { value: 2, label: 'Very Mild', color: 'text-green-500' },
  { value: 3, label: 'Mild', color: 'text-lime-500' },
  { value: 4, label: 'Mild-Moderate', color: 'text-yellow-500' },
  { value: 5, label: 'Moderate', color: 'text-yellow-600' },
  { value: 6, label: 'Moderate-Significant', color: 'text-amber-500' },
  { value: 7, label: 'Significant', color: 'text-orange-500' },
  { value: 8, label: 'Severe', color: 'text-orange-600' },
  { value: 9, label: 'Very Severe', color: 'text-red-500' },
  { value: 10, label: 'Critical / Unbearable', color: 'text-red-700' },
] as const;

// ---------- Body Areas ----------
export const BODY_AREAS = [
  'Head', 'Eyes', 'Ears', 'Nose', 'Throat', 'Neck',
  'Chest', 'Upper Back', 'Lower Back', 'Abdomen',
  'Left Arm', 'Right Arm', 'Left Hand', 'Right Hand',
  'Left Leg', 'Right Leg', 'Left Foot', 'Right Foot',
  'Joints', 'Muscles', 'Skin', 'General / Systemic',
] as const;

// ---------- Vital Type Definitions ----------
export const VITAL_TYPES = [
  { key: 'BLOOD_PRESSURE', label: 'Blood Pressure (Systolic)', unit: 'mmHg', min: 70, max: 200, criticalLow: 90, criticalHigh: 180 },
  { key: 'BLOOD_PRESSURE_DIA', label: 'Blood Pressure (Diastolic)', unit: 'mmHg', min: 40, max: 130, criticalLow: 60, criticalHigh: 120 },
  { key: 'HEART_RATE', label: 'Heart Rate', unit: 'bpm', min: 40, max: 150, criticalLow: 50, criticalHigh: 120 },
  { key: 'WEIGHT', label: 'Body Weight', unit: 'kg', min: 20, max: 250, criticalLow: 30, criticalHigh: 200 },
  { key: 'GLUCOSE', label: 'Blood Glucose', unit: 'mg/dL', min: 30, max: 500, criticalLow: 60, criticalHigh: 300 },
  { key: 'TEMPERATURE', label: 'Body Temperature', unit: '°C', min: 34, max: 42, criticalLow: 35.5, criticalHigh: 39.5 },
  { key: 'SPO2', label: 'Oxygen Saturation (SpO₂)', unit: '%', min: 80, max: 100, criticalLow: 90, criticalHigh: 101 },
] as const;

// ---------- Lab Test Categories ----------
export const LAB_CATEGORIES = [
  { value: 'BLOOD_WORK', label: 'Blood Work / Haematology' },
  { value: 'URINALYSIS', label: 'Urinalysis' },
  { value: 'IMAGING', label: 'Imaging / Radiology' },
  { value: 'MICROBIOLOGY', label: 'Microbiology' },
  { value: 'PATHOLOGY', label: 'Pathology' },
  { value: 'CARDIOLOGY', label: 'Cardiology' },
  { value: 'OTHER', label: 'Other Tests' },
] as const;

// ---------- Relationship Types (Emergency Contacts) ----------
export const RELATIONSHIP_TYPES = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Partner',
  'Grandparent', 'Grandchild', 'Friend', 'Neighbour',
  'Caregiver', 'Legal Guardian', 'Other',
] as const;

// ---------- Appointment Types ----------
export const APPOINTMENT_TYPES = [
  { value: 'CONSULTATION', label: 'Initial Consultation' },
  { value: 'FOLLOW_UP', label: 'Follow-Up Visit' },
  { value: 'CHECK_UP', label: 'Routine Check-Up' },
  { value: 'LAB_WORK', label: 'Laboratory Work' },
  { value: 'PROCEDURE', label: 'Medical Procedure' },
  { value: 'THERAPY', label: 'Therapy Session' },
  { value: 'EMERGENCY', label: 'Emergency Visit' },
] as const;

// ---------- Dropdown Options ----------
export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-Binary', label: 'Non-Binary' },
  { value: 'Prefer Not to Say', label: 'Prefer Not to Say' },
] as const;

export const PATIENT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const;

export const TREATMENT_STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const DOSE_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'TAKEN', label: 'Taken' },
  { value: 'MISSED', label: 'Missed' },
  { value: 'SKIPPED', label: 'Skipped' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const SIDE_EFFECT_SEVERITY_OPTIONS = [
  { value: 'MILD', label: 'Mild', color: 'text-yellow-600' },
  { value: 'MODERATE', label: 'Moderate', color: 'text-orange-600' },
  { value: 'SEVERE', label: 'Severe', color: 'text-red-600' },
] as const;

export const DRUG_INTERACTION_SEVERITY_OPTIONS = [
  { value: 'MINOR', label: 'Minor', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
  { value: 'MODERATE', label: 'Moderate', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20' },
  { value: 'MAJOR', label: 'Major', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20' },
] as const;

export const PRESCRIPTION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

// ---------- Configuration Defaults ----------
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 50] as const;
export const MAX_ACTIVITY_LOGS = 500;
export const MAX_AUDIT_EVENTS = 2000;
export const MAX_NOTIFICATIONS = 200;
export const SEARCH_DEBOUNCE_MS = 300;
export const TOAST_DURATION_MS = 4000;
export const SESSION_TIMEOUT_MINUTES = 30;

// ---------- Application Metadata ----------
export const APP_NAME = 'Medication & Treatment Adherence Management System';
export const APP_SHORT_NAME = 'MTAMS';
export const APP_VERSION = 'v2.0.0';
export const APP_DESCRIPTION = 'A comprehensive, local-first healthcare application for tracking treatment plans, medication schedules, doses, adherence, and clinical analytics.';

// ---------- Safety Disclaimer ----------
export const DISCLAIMER_TEXT = 'This is a demonstration and educational healthcare application. It does NOT provide medical diagnosis, prescribe medications, recommend dosage changes, or replace consultation with a qualified healthcare professional. All data is stored locally in your browser. Not for clinical decision-making.';

export const DISCLAIMER_SHORT = 'Educational demo only. Not for clinical decisions.';

// ---------- Date Format Options ----------
export const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)', example: '2026-08-29' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)', example: '08/29/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)', example: '29/08/2026' },
] as const;

// ---------- Chart Color Palette ----------
export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#E11D48', '#A855F7', '#0EA5E9', '#22C55E',
] as const;

// ---------- Missed Dose Reason Options ----------
export const MISSED_DOSE_REASONS = [
  { value: 'FORGOT', label: 'Forgot to take' },
  { value: 'TRAVEL', label: 'Travelling / Away from home' },
  { value: 'SCHEDULE_CONFLICT', label: 'Schedule conflict' },
  { value: 'UNAVAILABLE', label: 'Medication unavailable' },
  { value: 'SIDE_EFFECTS', label: 'Experienced side effects' },
  { value: 'FEELING_BETTER', label: 'Feeling better, skipped' },
  { value: 'COST', label: 'Cost / affordability issues' },
  { value: 'OTHER', label: 'Other reason' },
] as const;

// ---------- User Role Labels ----------
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'System Administrator',
  STAFF: 'Healthcare Staff',
  PATIENT: 'Patient',
};

// ---------- Keyboard Shortcuts ----------
export const KEYBOARD_SHORTCUTS = [
  { key: '/', description: 'Focus global search', scope: 'Global' },
  { key: 'Escape', description: 'Close modal / drawer', scope: 'Global' },
  { key: 'n', description: 'Create new entry', scope: 'List views' },
  { key: 'e', description: 'Edit selected entry', scope: 'Detail views' },
  { key: 'd', description: 'Delete selected entry', scope: 'Detail views' },
  { key: '?', description: 'Show keyboard shortcuts', scope: 'Global' },
] as const;
