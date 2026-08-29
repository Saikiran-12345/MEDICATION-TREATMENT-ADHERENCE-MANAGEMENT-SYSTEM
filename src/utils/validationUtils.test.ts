import { describe, it, expect } from 'vitest';
import {
  isRequired,
  isEmail,
  isPhone,
  isUrl,
  isNumeric,
  isDateString,
  isTimeString,
  isValidAge,
  isValidBloodPressure,
  isValidTemperature,
  isValidHeartRate,
  isValidGlucose,
  isValidWeight,
  isValidSpO2,
  validateField,
  validateForm,
  createRequiredRule,
  createEmailRule,
} from './validationUtils';

describe('validationUtils', () => {
  describe('isRequired', () => {
    it('should validate presence of value', () => {
      expect(isRequired('test')).toBe(true);
      expect(isRequired('')).toBe(false);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  describe('isEmail', () => {
    it('should validate email format', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('invalid-email')).toBe(false);
    });
  });

  describe('isPhone', () => {
    it('should validate phone formats', () => {
      expect(isPhone('1234567890')).toBe(true);
      expect(isPhone('123')).toBe(false);
    });
  });

  describe('isUrl', () => {
    it('should validate urls', () => {
      expect(isUrl('https://google.com')).toBe(true);
      expect(isUrl('google.com')).toBe(false);
    });
  });

  describe('isNumeric', () => {
    it('should identify numeric strings', () => {
      expect(isNumeric('123')).toBe(true);
      expect(isNumeric('123.45')).toBe(true);
      expect(isNumeric('abc')).toBe(false);
    });
  });

  describe('isDateString', () => {
    it('should validate YYYY-MM-DD date formats', () => {
      expect(isDateString('2026-08-29')).toBe(true);
      expect(isDateString('08/29/2026')).toBe(false);
    });
  });

  describe('isTimeString', () => {
    it('should validate HH:MM time formats', () => {
      expect(isTimeString('14:30')).toBe(true);
      expect(isTimeString('25:00')).toBe(false);
    });
  });

  describe('physiological limits', () => {
    it('should validate vitals boundaries correctly', () => {
      expect(isValidAge(45)).toBe(true);
      expect(isValidAge(150)).toBe(false);
      
      expect(isValidBloodPressure(120, 80)).toBe(true);
      expect(isValidBloodPressure(300, 200)).toBe(false);

      expect(isValidTemperature(37.0)).toBe(true);
      expect(isValidTemperature(46.0)).toBe(false);

      expect(isValidHeartRate(72)).toBe(true);
      expect(isValidHeartRate(250)).toBe(false);

      expect(isValidGlucose(100)).toBe(true);
      expect(isValidGlucose(900)).toBe(false);

      expect(isValidWeight(70)).toBe(true);
      expect(isValidWeight(600)).toBe(false);

      expect(isValidSpO2(98)).toBe(true);
      expect(isValidSpO2(40)).toBe(false);
    });
  });

  describe('validateField and validateForm', () => {
    it('should validate field rules aggregate', () => {
      const rules = [
        createRequiredRule('Email'),
        createEmailRule()
      ];
      expect(validateField('', rules)).toEqual(['Email is required.']);
      expect(validateField('invalid', rules)).toEqual(['Please enter a valid email address.']);
      expect(validateField('test@example.com', rules)).toEqual([]);
    });

    it('should validate form schema', () => {
      const data = {
        email: 'invalid',
        username: ''
      };
      
      const schema = {
        email: [createRequiredRule('Email'), createEmailRule()],
        username: [createRequiredRule('Username')]
      };

      const result = validateForm(data, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.username).toBeDefined();
    });
  });
});
