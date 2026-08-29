import { describe, it, expect, beforeEach } from 'vitest';
import { analyticsService } from './analyticsService';
import { dbService } from './dbService';
import type { DoseRecord } from '../types';

describe('analyticsService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  describe('calculateAdherence', () => {
    it('should return 100 when array is empty', () => {
      expect(analyticsService.calculateAdherence([])).toBe(100);
    });

    it('should return 100 when all doses are TAKEN', () => {
      const mockDoses: DoseRecord[] = [
        { id: '1', scheduleId: 's', medicationId: 'm', treatmentId: 't', patientId: 'p', scheduledDate: '2026-08-01', scheduledTime: '08:00', status: 'TAKEN' },
        { id: '2', scheduleId: 's', medicationId: 'm', treatmentId: 't', patientId: 'p', scheduledDate: '2026-08-02', scheduledTime: '08:00', status: 'TAKEN' }
      ];
      expect(analyticsService.calculateAdherence(mockDoses)).toBe(100);
    });

    it('should return 50 when half are TAKEN and half are MISSED', () => {
      const mockDoses: DoseRecord[] = [
        { id: '1', scheduleId: 's', medicationId: 'm', treatmentId: 't', patientId: 'p', scheduledDate: '2026-08-01', scheduledTime: '08:00', status: 'TAKEN' },
        { id: '2', scheduleId: 's', medicationId: 'm', treatmentId: 't', patientId: 'p', scheduledDate: '2026-08-02', scheduledTime: '08:00', status: 'MISSED' }
      ];
      expect(analyticsService.calculateAdherence(mockDoses)).toBe(50);
    });

    it('should include SKIPPED doses in the adherence calculation denominator', () => {
      const mockDoses: DoseRecord[] = [
        { id: '1', scheduleId: 's', medicationId: 'm', treatmentId: 't', patientId: 'p', scheduledDate: '2026-08-01', scheduledTime: '08:00', status: 'TAKEN' },
        { id: '2', scheduleId: 's', medicationId: 'm', treatmentId: 't', patientId: 'p', scheduledDate: '2026-08-02', scheduledTime: '08:00', status: 'SKIPPED' }
      ];
      expect(analyticsService.calculateAdherence(mockDoses)).toBe(50);
    });

    it('should ignore SCHEDULED or CANCELLED doses in calculations', () => {
      const mockDoses: DoseRecord[] = [
        { id: '1', scheduleId: 's', medicationId: 'm', treatmentId: 't', patientId: 'p', scheduledDate: '2026-08-01', scheduledTime: '08:00', status: 'TAKEN' },
        { id: '2', scheduleId: 's', medicationId: 'm', treatmentId: 't', patientId: 'p', scheduledDate: '2026-08-02', scheduledTime: '08:00', status: 'SCHEDULED' },
        { id: '3', scheduleId: 's', medicationId: 'm', treatmentId: 't', patientId: 'p', scheduledDate: '2026-08-03', scheduledTime: '08:00', status: 'CANCELLED' }
      ];
      // Only 1 tracked dose ('TAKEN'), others ignored -> should be 1/1 = 100%
      expect(analyticsService.calculateAdherence(mockDoses)).toBe(100);
    });
  });

  describe('classifyAdherence', () => {
    it('should classify < 60% as LOW ADHERENCE', () => {
      expect(analyticsService.classifyAdherence(59)).toBe('LOW ADHERENCE');
      expect(analyticsService.classifyAdherence(0)).toBe('LOW ADHERENCE');
    });

    it('should classify 60% to 80% as MEDIUM ADHERENCE', () => {
      expect(analyticsService.classifyAdherence(60)).toBe('MEDIUM ADHERENCE');
      expect(analyticsService.classifyAdherence(75)).toBe('MEDIUM ADHERENCE');
      expect(analyticsService.classifyAdherence(80)).toBe('MEDIUM ADHERENCE');
    });

    it('should classify > 80% as HIGH ADHERENCE', () => {
      expect(analyticsService.classifyAdherence(81)).toBe('HIGH ADHERENCE');
      expect(analyticsService.classifyAdherence(100)).toBe('HIGH ADHERENCE');
    });
  });

  describe('getPatientAnalytics', () => {
    it('should calculate correct streaks and stats for pat-1', () => {
      const stats = analyticsService.getPatientAnalytics('pat-1');
      expect(stats).toBeDefined();
      expect(stats.adherence).toBe(67); // 2 taken, 1 missed of 3 total tracked (67%)
      expect(stats.completedDoses).toBe(2);
      expect(stats.missedDoses).toBe(1);
      expect(stats.bestStreak).toBe(2); // dose 1 & 2 taken consecutively
    });
  });
});
