import { describe, it, expect, beforeEach } from 'vitest';
import { doseService } from './doseService';
import { notificationService } from './notificationService';
import { dbService } from './dbService';

describe('doseService', () => {
  beforeEach(() => {
    dbService.reset();
  });

  it('should return initial doses', () => {
    const list = doseService.getAll();
    expect(list.length).toBe(573);
    expect(list[0].id).toBe('dose-1');
  });

  it('should filter doses by patient ID', () => {
    const list = doseService.getByPatientId('pat-1');
    expect(list.length).toBe(4); // 4 default doses for pat-1
  });

  it('should mark a dose as TAKEN and record actualTimeTaken', () => {
    const updated = doseService.updateStatus('dose-4', 'TAKEN');
    expect(updated.status).toBe('TAKEN');
    expect(updated.actualTimeTaken).toBeDefined();
  });

  it('should mark a dose as MISSED with reason and trigger alert to staff-1', () => {
    const initialAlertsCount = notificationService.getAll('staff-1').length;

    const updated = doseService.updateStatus('dose-4', 'MISSED', undefined, 'TRAVEL', 'Flight delayed');
    expect(updated.status).toBe('MISSED');
    expect(updated.reasonForMissed).toBe('TRAVEL');
    expect(updated.reasonNote).toBe('Flight delayed');

    // Verify staff alert was generated
    const currentAlerts = notificationService.getAll('staff-1');
    expect(currentAlerts.length).toBe(initialAlertsCount + 1);
    expect(currentAlerts[0].title).toContain('Missed Dose Alert');
  });

  it('should undo dose status to SCHEDULED and clear details', () => {
    // Initial status for dose-3 is MISSED
    const initial = doseService.getById('dose-3');
    expect(initial?.status).toBe('MISSED');

    const updated = doseService.updateStatus('dose-3', 'SCHEDULED');
    expect(updated.status).toBe('SCHEDULED');
    expect(updated.actualTimeTaken).toBeUndefined();
    expect(updated.reasonForMissed).toBeUndefined();
    expect(updated.reasonNote).toBeUndefined();
  });
});
