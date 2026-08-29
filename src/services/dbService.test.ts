import { describe, it, expect, beforeEach } from 'vitest';
import { dbService, KEYS } from './dbService';
import { storageService } from './storageService';

describe('dbService', () => {
  beforeEach(() => {
    storageService.remove(KEYS.PATIENTS);
    storageService.remove(KEYS.TREATMENTS);
    storageService.remove(KEYS.MEDICATIONS);
    storageService.remove(KEYS.SCHEDULES);
    storageService.remove(KEYS.DOSES);
    storageService.remove(KEYS.FOLLOW_UPS);
    storageService.remove(KEYS.NOTES);
    storageService.remove(KEYS.NOTIFICATIONS);
    storageService.remove(KEYS.ACTIVITY_LOGS);
    storageService.remove(KEYS.SETTINGS);
  });

  it('should initialize database with seed data if empty', () => {
    expect(storageService.get(KEYS.PATIENTS, null)).toBeNull();
    
    dbService.initialize();
    
    const patients = storageService.get<any[]>(KEYS.PATIENTS, []);
    expect(patients.length).toBeGreaterThan(0);
    expect(patients[0].id).toBe('pat-1');
  });

  it('should export database as a structured JSON string', () => {
    dbService.initialize();
    const jsonStr = dbService.exportJSON();
    
    expect(jsonStr).toBeDefined();
    const parsed = JSON.parse(jsonStr);
    expect(parsed.patients).toBeDefined();
    expect(parsed.patients[0].id).toBe('pat-1');
  });

  it('should log audit log activities in the database', () => {
    dbService.initialize();
    
    // Initial logs from seeding
    const initialLogs = storageService.get<any[]>(KEYS.ACTIVITY_LOGS, []);
    const initialCount = initialLogs.length;

    dbService.logActivity('ADMIN-X', 'Test Action', 'Something happened');

    const updatedLogs = storageService.get<any[]>(KEYS.ACTIVITY_LOGS, []);
    expect(updatedLogs.length).toBe(initialCount + 1);
    expect(updatedLogs[0].userId).toBe('ADMIN-X');
    expect(updatedLogs[0].action).toBe('Test Action');
    expect(updatedLogs[0].details).toBe('Something happened');
  });

  it('should cap audit trail logs to a maximum of 500 entries', () => {
    dbService.initialize();
    
    // Log 510 items rapidly
    for (let i = 0; i < 510; i++) {
      dbService.logActivity('SYSTEM', `Log-${i}`);
    }

    const logs = storageService.get<any[]>(KEYS.ACTIVITY_LOGS, []);
    expect(logs.length).toBe(500); // capped at 500!
    expect(logs[0].action).toBe('Log-509'); // newest should be first
  });

  it('should import database cleanly from valid JSON', () => {
    dbService.initialize();
    const dataStr = dbService.exportJSON();

    // Clear DB completely
    dbService.clear();
    expect(storageService.get(KEYS.PATIENTS, null)).toBeNull();

    // Import again
    const result = dbService.importJSON(dataStr);
    expect(result.success).toBe(true);

    const patients = storageService.get<any[]>(KEYS.PATIENTS, []);
    expect(patients.length).toBeGreaterThan(0);
    expect(patients[0].id).toBe('pat-1');
  });

  it('should fail database importing on malformed JSON format', () => {
    const malformed = '{"patients": "not-an-array"}';
    const result = dbService.importJSON(malformed);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid file format');
  });
});
