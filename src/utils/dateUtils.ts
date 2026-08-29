// ============================================================
// Date Utilities
// Comprehensive date/time formatting, parsing, and calculation helpers
// ============================================================

/**
 * Format a date string or Date object according to a format pattern.
 * Supported patterns: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, YYYY, MM, DD
 */
export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear().toString();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'MMM DD, YYYY': return `${getMonthName(d.getMonth(), true)} ${day}, ${year}`;
    case 'MMMM DD, YYYY': return `${getMonthName(d.getMonth())} ${day}, ${year}`;
    case 'DD MMM YYYY': return `${day} ${getMonthName(d.getMonth(), true)} ${year}`;
    default: return `${year}-${month}-${day}`;
  }
}

/**
 * Format a date with time.
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const datePart = formatDate(d, 'YYYY-MM-DD');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${datePart} ${hours}:${minutes}`;
}

/**
 * Convert 24-hour time string to 12-hour format.
 * e.g. '14:30' => '2:30 PM'
 */
export function formatTime(time: string): string {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length < 2) return time;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

/**
 * Format a date as relative time from now.
 * e.g. '2 hours ago', 'in 3 days', 'just now'
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const absDiff = Math.abs(diffMs);
  const isFutureDate = diffMs < 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let label: string;
  if (seconds < 60) label = 'just now';
  else if (minutes < 60) label = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  else if (hours < 24) label = `${hours} hour${hours !== 1 ? 's' : ''}`;
  else if (days < 7) label = `${days} day${days !== 1 ? 's' : ''}`;
  else if (weeks < 5) label = `${weeks} week${weeks !== 1 ? 's' : ''}`;
  else if (months < 12) label = `${months} month${months !== 1 ? 's' : ''}`;
  else label = `${years} year${years !== 1 ? 's' : ''}`;

  if (label === 'just now') return label;
  return isFutureDate ? `in ${label}` : `${label} ago`;
}

/**
 * Check if a date is today.
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
}

/**
 * Check if a date is yesterday.
 */
export function isYesterday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
}

/**
 * Check if a date is in the future.
 */
export function isFuture(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > Date.now();
}

/**
 * Check if a date is in the past.
 */
export function isPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Check if two dates fall on the same calendar day.
 */
export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

/**
 * Calculate the number of days between two dates.
 */
export function daysBetween(start: string | Date, end: string | Date): number {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date.
 */
export function addDays(date: string | Date, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Subtract days from a date.
 */
export function subtractDays(date: string | Date, days: number): Date {
  return addDays(date, -days);
}

/**
 * Get the start of the week (Monday) for a given date.
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date.getTime());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the week (Sunday) for a given date.
 */
export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  start.setDate(start.getDate() + 6);
  start.setHours(23, 59, 59, 999);
  return start;
}

/**
 * Get the first day of the month.
 */
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the month.
 */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get the number of days in a given month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the ISO week number for a date.
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculate age from a birth date.
 */
export function calculateAge(birthDate: string | Date): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Generate an array of Date objects for every day in a range (inclusive).
 */
export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start.getTime());
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end.getTime());
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    dates.push(new Date(current.getTime()));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Get the full or abbreviated name of a month (0-indexed).
 */
export function getMonthName(month: number, short: boolean = false): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const name = months[month] || '';
  return short ? name.slice(0, 3) : name;
}

/**
 * Get the full or abbreviated name of a day of the week (0 = Sunday).
 */
export function getDayName(day: number, short: boolean = false): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const name = days[day] || '';
  return short ? name.slice(0, 3) : name;
}

/**
 * Convert a Date to YYYY-MM-DD string.
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a Date to HH:MM string.
 */
export function toISOTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Safely parse a date string, returning null if invalid.
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Validate that a start date is before or equal to an end date.
 */
export function isValidDateRange(start: string, end: string): boolean {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
  return s <= e;
}

/**
 * Determine the time period (morning/afternoon/evening/night) from a time string.
 */
export function getTimePeriod(time: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (!time) return 'morning';
  const hour = parseInt(time.split(':')[0], 10);
  if (isNaN(hour)) return 'morning';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Count business days (Mon–Fri) between two dates.
 */
export function getBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start.getTime());
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end.getTime());
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Get a greeting based on the current time of day.
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Check if a date falls within a given range (inclusive).
 */
export function isDateInRange(date: string | Date, start: string | Date, end: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  d.setHours(0, 0, 0, 0);
  s.setHours(0, 0, 0, 0);
  e.setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

/**
 * Get an array of month/year objects for the last N months.
 */
export function getLastNMonths(n: number): Array<{ year: number; month: number; label: string }> {
  const result: Array<{ year: number; month: number; label: string }> = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${getMonthName(d.getMonth(), true)} ${d.getFullYear()}`,
    });
  }
  return result;
}
