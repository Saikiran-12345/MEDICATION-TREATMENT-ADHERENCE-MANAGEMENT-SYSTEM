// ============================================================
// Color and Theme Utilities
// Status badges color matching, severity color scales, hex conversion, contrast color calculation
// ============================================================

export const CHART_PALETTE = {
  primary: '#3b82f6',    // blue-500
  secondary: '#6b7280',  // gray-500
  success: '#10b981',    // emerald-500
  warning: '#f59e0b',    // amber-500
  danger: '#ef4444',     // red-500
  info: '#06b6d4',       // cyan-500
  purple: '#8b5cf6',     // violet-500
  pink: '#ec4899',       // pink-500
};

/**
 * Returns Tailwind class names based on status strings.
 */
export function getStatusColor(status: string): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  const cleanStatus = status.trim().toUpperCase();

  switch (cleanStatus) {
    // General Active/Completed/Status States
    case 'ACTIVE':
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'IN_STOCK':
    case 'TAKEN':
    case 'NORMAL':
    case 'READ':
    case 'RESOLVED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';

    // Warnings and Scheduled States
    case 'SCHEDULED':
    case 'PENDING':
    case 'MONITORING':
    case 'LOW_STOCK':
    case 'WARNING':
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';

    // Danger and Failure States
    case 'CANCELLED':
    case 'CANCELED':
    case 'EXPIRED':
    case 'OUT_OF_STOCK':
    case 'MISSED':
    case 'CRITICAL':
    case 'SEVERE':
    case 'ERROR':
    case 'NO_SHOW':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';

    // Informational/Disabled States
    case 'INACTIVE':
    case 'ARCHIVED':
    case 'UNREAD':
    case 'MILD':
    case 'OTHER':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
}

/**
 * Returns a severity color string from green (1) to yellow (5) to red (10).
 * Returns Tailwind classes suitable for background colors.
 */
export function getSeverityColor(severity: number): string {
  if (severity <= 2) return 'bg-emerald-500 text-white';
  if (severity <= 4) return 'bg-teal-500 text-white';
  if (severity <= 6) return 'bg-amber-500 text-white';
  if (severity <= 8) return 'bg-orange-500 text-white';
  return 'bg-rose-500 text-white';
}

/**
 * Get adherence rate color representation.
 * rate is a percentage out of 100.
 */
export function getAdherenceColor(rate: number): string {
  if (rate >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 75) return 'text-amber-500 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

/**
 * Evaluates a vital value against physiological limits and classifies it.
 */
export function getVitalStatusColor(
  value: number,
  min: number,
  max: number,
  criticalLow: number,
  criticalHigh: number
): 'normal' | 'warning' | 'critical' {
  if (value <= criticalLow || value >= criticalHigh) {
    return 'critical';
  }
  if (value < min || value > max) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Convert hex color code to RGB structure.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB values to hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Convert HSL color model parameters to hex color code.
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(Math.round(255 * f(0)), Math.round(255 * f(4)), Math.round(255 * f(8)));
}

/**
 * Determine contrast color (black or white) needed for readability against a background hex color.
 */
export function getContrastColor(hexColor: string): 'black' | 'white' {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'white';
  // YIQ luminance formula
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

/**
 * Generate a list of gradient hex steps between start and end color hexes.
 */
export function generateColorScale(startHex: string, endHex: string, steps: number): string[] {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  if (!start || !end || steps <= 1) return [startHex, endHex];

  const scale: string[] = [];
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    const r = Math.round(start.r + factor * (end.r - start.r));
    const g = Math.round(start.g + factor * (end.g - start.g));
    const b = Math.round(start.b + factor * (end.b - start.b));
    scale.push(rgbToHex(r, g, b));
  }
  return scale;
}

/**
 * Returns distinct colors from the charts palette up to the count requested.
 */
export function getChartColors(count: number): string[] {
  const palette = Object.values(CHART_PALETTE);
  if (count <= palette.length) return palette.slice(0, count);
  
  const extended: string[] = [...palette];
  let step = 0;
  while (extended.length < count) {
    extended.push(hslToHex((step * 137.5) % 360, 70, 50)); // Golden ratio distribution
    step++;
  }
  return extended.slice(0, count);
}
