// ============================================================
// Validation Utilities and Engine
// Field validation rules, regex patterns, vital ranges, and form validator.
// ============================================================

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Check if a value is present (not null, undefined, empty string, or empty array).
 */
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate email address.
 */
export function isEmail(value: string): boolean {
  if (!value) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(value);
}

/**
 * Validate telephone numbers (10 digits minimum, optional symbols).
 */
export function isPhone(value: string): boolean {
  if (!value) return false;
  const cleanPhone = value.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

/**
 * Validate URL.
 */
export function isUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Check if a string is numeric.
 */
export function isNumeric(value: string): boolean {
  if (value === null || value === undefined) return false;
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

/**
 * Check if a string is an integer.
 */
export function isInteger(value: string): boolean {
  if (!isNumeric(value)) return false;
  const num = Number(value);
  return Number.isInteger(num);
}

/**
 * Check if a number is positive.
 */
export function isPositive(value: number): boolean {
  return value > 0;
}

/**
 * Check if a number falls within a given range (inclusive).
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Check if a string is at least min length.
 */
export function isMinLength(value: string, min: number): boolean {
  if (!value) return min <= 0;
  return value.length >= min;
}

/**
 * Check if a string does not exceed max length.
 */
export function isMaxLength(value: string, max: number): boolean {
  if (!value) return true;
  return value.length <= max;
}

/**
 * Check if a string matches YYYY-MM-DD date format.
 */
export function isDateString(value: string): boolean {
  if (!value) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * Check if a string matches HH:MM 24-hour time format.
 */
export function isTimeString(value: string): boolean {
  if (!value) return false;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(value);
}

/**
 * Check if a patient's age is realistic (0 to 125).
 */
export function isValidAge(age: number): boolean {
  return Number.isInteger(age) && age >= 0 && age <= 125;
}

/**
 * Check if blood pressure values are within physiological limits.
 */
export function isValidBloodPressure(systolic: number, diastolic: number): boolean {
  return systolic >= 50 && systolic <= 250 && diastolic >= 30 && diastolic <= 150;
}

/**
 * Check if human body temperature is within physiological limits (°C).
 */
export function isValidTemperature(value: number): boolean {
  return value >= 30 && value <= 45;
}

/**
 * Check if heart rate is within physiological limits (bpm).
 */
export function isValidHeartRate(value: number): boolean {
  return value >= 30 && value <= 220;
}

/**
 * Check if glucose levels are within physiological limits (mg/dL).
 */
export function isValidGlucose(value: number): boolean {
  return value >= 20 && value <= 600;
}

/**
 * Check if weight is within physiological limits (kg).
 */
export function isValidWeight(value: number): boolean {
  return value >= 1 && value <= 400;
}

/**
 * Check if oxygen saturation is within physiological limits (%).
 */
export function isValidSpO2(value: number): boolean {
  return value >= 50 && value <= 100;
}

/**
 * Check if string matches pattern.
 */
export function matchesPattern(value: string, pattern: RegExp): boolean {
  if (!value) return false;
  return pattern.test(value);
}

/**
 * Validate a single value against multiple rules.
 * Returns array of error messages (empty if valid).
 */
export function validateField(value: unknown, rules: ValidationRule[]): string[] {
  const errors: string[] = [];
  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }
  return errors;
}

/**
 * Validate a form's data object using a schema map of field rules.
 */
export function validateForm(
  data: Record<string, unknown>,
  schema: Record<string, ValidationRule[]>
): ValidationResult {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const fieldName in schema) {
    const rules = schema[fieldName];
    const value = data[fieldName];
    const fieldErrors = validateField(value, rules);
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
      isValid = false;
    }
  }

  return { isValid, errors };
}

// ============================================================
// Rule Creators (Factories)
// Helper builders for creating common rules
// ============================================================

export function createRequiredRule(fieldName: string = 'Field'): ValidationRule {
  return {
    validate: isRequired,
    message: `${fieldName} is required.`,
  };
}

export function createMinLengthRule(min: number): ValidationRule {
  return {
    validate: (value: string) => isMinLength(value, min),
    message: `Must be at least ${min} characters long.`,
  };
}

export function createMaxLengthRule(max: number): ValidationRule {
  return {
    validate: (value: string) => isMaxLength(value, max),
    message: `Cannot exceed ${max} characters.`,
  };
}

export function createRangeRule(min: number, max: number): ValidationRule {
  return {
    validate: (value: number) => isInRange(value, min, max),
    message: `Must be between ${min} and ${max}.`,
  };
}

export function createEmailRule(): ValidationRule {
  return {
    validate: isEmail,
    message: 'Please enter a valid email address.',
  };
}

export function createPhoneRule(): ValidationRule {
  return {
    validate: isPhone,
    message: 'Please enter a valid 10-digit phone number.',
  };
}

export function createDateRangeRule(): ValidationRule {
  return {
    validate: (value: any) => {
      return isDateString(value);
    },
    message: `End date must be after start date.`,
  };
}

export function createPatternRule(pattern: RegExp, message: string): ValidationRule {
  return {
    validate: (value: string) => matchesPattern(value, pattern),
    message,
  };
}
