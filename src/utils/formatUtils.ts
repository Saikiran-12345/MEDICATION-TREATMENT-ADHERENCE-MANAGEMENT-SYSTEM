// ============================================================
// Format Utilities
// Formatting numbers, strings, currencies, BP, temp, and other formats.
// ============================================================

/**
 * Format a number with commas and optional decimal places.
 * e.g. 1234567.89 => "1,234,567.89"
 */
export function formatNumber(num: number, decimals: number = 0): string {
  if (num === null || num === undefined || isNaN(num)) return '';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as a percentage.
 * e.g. 0.854 => "85.4%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '';
  // Check if value is already a percentage (e.g. 85.4) or a ratio (e.g. 0.854)
  const percent = Math.abs(value) <= 1.0001 && value !== 0 ? value * 100 : value;
  return `${formatNumber(percent, decimals)}%`;
}

/**
 * Format a number as currency.
 * e.g. 120.5 => "$120.50"
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format file size in bytes to human readable format (KB, MB, GB, etc.).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in minutes into a human-readable string.
 * e.g. 150 => "2h 30m"
 */
export function formatDuration(minutes: number): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) return '';
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Format duration in seconds.
 * e.g. 95 => "1m 35s"
 */
export function formatDurationSeconds(seconds: number): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/**
 * Format telephone numbers.
 * e.g. "1234567890" => "(123) 456-7890"
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
}

/**
 * Format an ID as a patient ID with padding.
 * e.g. "12" => "PAT-00012", "pat-12" => "PAT-00012"
 */
export function formatPatientId(id: string): string {
  if (!id) return '';
  const numOnly = id.replace(/\D/g, '');
  if (!numOnly) return id.toUpperCase();
  return `PAT-${numOnly.padStart(5, '0')}`;
}

/**
 * Format ordinal numbers.
 * e.g. 1 => "1st", 2 => "2nd", 3 => "3rd", 4 => "4th"
 */
export function formatOrdinal(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format large numbers in compact form.
 * e.g. 1200 => "1.2K", 3400000 => "3.4M"
 */
export function formatCompactNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

/**
 * Format blood pressure readings.
 * e.g. 120, 80 => "120/80 mmHg"
 */
export function formatBloodPressure(systolic: number, diastolic: number): string {
  if (systolic === undefined || diastolic === undefined) return '';
  return `${systolic}/${diastolic} mmHg`;
}

/**
 * Format temperature with unit.
 */
export function formatTemperature(value: number, unit: 'C' | 'F' = 'C'): string {
  if (value === null || value === undefined || isNaN(value)) return '';
  return `${value.toFixed(1)} °${unit}`;
}

/**
 * Format weight with unit.
 */
export function formatWeight(value: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (value === null || value === undefined || isNaN(value)) return '';
  return `${value.toFixed(1)} ${unit}`;
}

/**
 * Calculate and format BMI (Body Mass Index).
 * formula: weight (kg) / [height (m)]^2
 */
export function formatBMI(weight: number, heightCm: number): string {
  if (!weight || !heightCm || isNaN(weight) || isNaN(heightCm)) return '';
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  return bmi.toFixed(1);
}

/**
 * Pad a number with leading zeros.
 * e.g. 7, 3 => "007"
 */
export function padZero(num: number, length: number = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '';
  return num.toString().padStart(length, '0');
}

/**
 * Format a list of strings into a grammatically correct sentence list.
 * e.g. ["Apples", "Oranges", "Bananas"] => "Apples, Oranges, and Bananas"
 */
export function formatList(items: string[], conjunction: string = 'and'): string {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const mainItems = items.slice(0, -1).join(', ');
  return `${mainItems}, ${conjunction} ${items[items.length - 1]}`;
}
