import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatPercentage,
  formatCurrency,
  formatFileSize,
  formatDuration,
  formatDurationSeconds,
  formatPhone,
  formatPatientId,
  formatOrdinal,
  formatCompactNumber,
  formatBloodPressure,
  formatTemperature,
  formatWeight,
  formatBMI,
  padZero,
  formatList,
} from './formatUtils';

describe('formatUtils', () => {
  describe('formatNumber', () => {
    it('should format numbers with commas and decimals', () => {
      expect(formatNumber(1234567.89, 2)).toBe('1,234,567.89');
      expect(formatNumber(1234, 0)).toBe('1,234');
      expect(formatNumber(0, 1)).toBe('0.0');
    });

    it('should return empty string for invalid numbers', () => {
      expect(formatNumber(NaN)).toBe('');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(0.854, 1)).toBe('85.4%');
      expect(formatPercentage(85.4, 1)).toBe('85.4%');
      expect(formatPercentage(0, 0)).toBe('0%');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      // Allow for locale differences by checking basic dollar symbol and value
      const result = formatCurrency(120.5, 'USD');
      expect(result).toContain('$');
      expect(result).toContain('120.50');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes in bytes, KB, MB correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
    });
  });

  describe('formatDuration', () => {
    it('should format duration minutes to human readable', () => {
      expect(formatDuration(45)).toBe('45m');
      expect(formatDuration(150)).toBe('2h 30m');
      expect(formatDuration(120)).toBe('2h');
    });
  });

  describe('formatDurationSeconds', () => {
    it('should format duration seconds correctly', () => {
      expect(formatDurationSeconds(45)).toBe('45s');
      expect(formatDurationSeconds(95)).toBe('1m 35s');
      expect(formatDurationSeconds(120)).toBe('2m');
    });
  });

  describe('formatPhone', () => {
    it('should format phone numbers correctly', () => {
      expect(formatPhone('1234567890')).toBe('(123) 456-7890');
      expect(formatPhone('(123) 456-7890')).toBe('(123) 456-7890');
    });
  });

  describe('formatPatientId', () => {
    it('should pad patient ID correctly', () => {
      expect(formatPatientId('pat-12')).toBe('PAT-00012');
      expect(formatPatientId('12')).toBe('PAT-00012');
    });
  });

  describe('formatOrdinal', () => {
    it('should format ordinal suffixes', () => {
      expect(formatOrdinal(1)).toBe('1st');
      expect(formatOrdinal(2)).toBe('2nd');
      expect(formatOrdinal(3)).toBe('3rd');
      expect(formatOrdinal(4)).toBe('4th');
      expect(formatOrdinal(11)).toBe('11th');
    });
  });

  describe('formatCompactNumber', () => {
    it('should format compact forms correctly', () => {
      expect(formatCompactNumber(1200)).toBe('1.2K');
      expect(formatCompactNumber(3400000)).toBe('3.4M');
    });
  });

  describe('formatBloodPressure', () => {
    it('should format blood pressure readings', () => {
      expect(formatBloodPressure(120, 80)).toBe('120/80 mmHg');
    });
  });

  describe('formatTemperature', () => {
    it('should format temperature values', () => {
      expect(formatTemperature(36.6, 'C')).toBe('36.6 °C');
      expect(formatTemperature(98.6, 'F')).toBe('98.6 °F');
    });
  });

  describe('formatWeight', () => {
    it('should format weights correctly', () => {
      expect(formatWeight(70.2, 'kg')).toBe('70.2 kg');
    });
  });

  describe('formatBMI', () => {
    it('should calculate and format BMI', () => {
      expect(formatBMI(70, 175)).toBe('22.9');
    });
  });

  describe('padZero', () => {
    it('should pad single digits with leading zeros', () => {
      expect(padZero(7, 3)).toBe('007');
      expect(padZero(15, 2)).toBe('15');
    });
  });

  describe('formatList', () => {
    it('should format grammatically correct sentence list', () => {
      expect(formatList([])).toBe('');
      expect(formatList(['Apples'])).toBe('Apples');
      expect(formatList(['Apples', 'Oranges'])).toBe('Apples and Oranges');
      expect(formatList(['Apples', 'Oranges', 'Bananas'])).toBe('Apples, Oranges, and Bananas');
    });
  });
});
