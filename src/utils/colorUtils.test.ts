import { describe, it, expect } from 'vitest';
import {
  getStatusColor,
  getSeverityColor,
  getAdherenceColor,
  getVitalStatusColor,
  hexToRgb,
  rgbToHex,
  hslToHex,
  getContrastColor,
  generateColorScale,
  getChartColors,
} from './colorUtils';

describe('colorUtils', () => {
  describe('getStatusColor', () => {
    it('should return matching Tailwind colors', () => {
      expect(getStatusColor('ACTIVE')).toContain('emerald');
      expect(getStatusColor('SCHEDULED')).toContain('amber');
      expect(getStatusColor('MISSED')).toContain('rose');
      expect(getStatusColor('INACTIVE')).toContain('gray');
    });
  });

  describe('getSeverityColor', () => {
    it('should return gradient background classes', () => {
      expect(getSeverityColor(1)).toContain('emerald');
      expect(getSeverityColor(5)).toContain('amber');
      expect(getSeverityColor(10)).toContain('rose');
    });
  });

  describe('getAdherenceColor', () => {
    it('should decorate text colors', () => {
      expect(getAdherenceColor(95)).toContain('emerald');
      expect(getAdherenceColor(80)).toContain('amber');
      expect(getAdherenceColor(50)).toContain('rose');
    });
  });

  describe('getVitalStatusColor', () => {
    it('should check limits', () => {
      // SPO2: value, min, max, criticalLow, criticalHigh
      expect(getVitalStatusColor(98, 95, 100, 90, 100)).toBe('normal');
      expect(getVitalStatusColor(92, 95, 100, 90, 100)).toBe('warning');
      expect(getVitalStatusColor(85, 95, 100, 90, 100)).toBe('critical');
    });
  });

  describe('conversions', () => {
    it('should convert hex to RGB and vice versa', () => {
      const rgb = hexToRgb('#3b82f6');
      expect(rgb).toEqual({ r: 59, g: 130, b: 246 });

      const hex = rgbToHex(59, 130, 246);
      expect(hex).toBe('#3b82f6');
    });

    it('should convert HSL to hex', () => {
      expect(hslToHex(0, 100, 50)).toBe('#ff0000'); // Red
    });
  });

  describe('getContrastColor', () => {
    it('should check for contrast readability', () => {
      expect(getContrastColor('#ffffff')).toBe('black');
      expect(getContrastColor('#000000')).toBe('white');
    });
  });

  describe('generateColorScale', () => {
    it('should generate steps', () => {
      const scale = generateColorScale('#000000', '#ffffff', 3);
      expect(scale[0]).toBe('#000000');
      expect(scale[1]).toBe('#808080');
      expect(scale[2]).toBe('#ffffff');
    });
  });

  describe('getChartColors', () => {
    it('should return list of unique colors', () => {
      const list = getChartColors(10);
      expect(list.length).toBe(10);
      expect(list[0]).toBe('#3b82f6');
    });
  });
});
