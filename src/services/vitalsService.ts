import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { Vital, VitalType } from '../types';
import { getVitalStatusColor } from '../utils/colorUtils';
import { VITAL_TYPES } from '../utils/constants';

export const vitalsService = {
  getAll(): Vital[] {
    return storageService.get<Vital[]>(KEYS.VITALS, []);
  },

  getByPatient(patientId: string): Vital[] {
    return this.getAll()
      .filter(v => v.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  },

  getByPatientAndType(patientId: string, type: VitalType): Vital[] {
    return this.getByPatient(patientId).filter(v => v.type === type);
  },

  getLatestByPatient(patientId: string): Record<VitalType, Vital | null> {
    const vitals = this.getByPatient(patientId);
    const latest: Record<VitalType, Vital | null> = {
      BLOOD_PRESSURE: null,
      HEART_RATE: null,
      WEIGHT: null,
      GLUCOSE: null,
      TEMPERATURE: null,
      SPO2: null
    };

    for (const v of vitals) {
      if (!latest[v.type]) {
        latest[v.type] = v;
      }
    }
    return latest;
  },

  add(vital: Omit<Vital, 'id' | 'recordedAt'>): Vital {
    const vitals = this.getAll();
    const newVital: Vital = {
      ...vital,
      id: `vit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recordedAt: new Date().toISOString()
    };
    
    storageService.set(KEYS.VITALS, [newVital, ...vitals]);
    return newVital;
  },

  delete(id: string): boolean {
    const vitals = this.getAll();
    const filtered = vitals.filter(v => v.id !== id);
    if (filtered.length === vitals.length) return false;
    storageService.set(KEYS.VITALS, filtered);
    return true;
  },

  getVitalStatus(vital: Vital): 'normal' | 'warning' | 'critical' {
    const typeDef = VITAL_TYPES.find(t => t.key === vital.type);
    if (!typeDef) return 'normal';
    return getVitalStatusColor(
      vital.value,
      typeDef.min,
      typeDef.max,
      typeDef.criticalLow,
      typeDef.criticalHigh
    );
  },

  getAverages(patientId: string, days = 30): Record<VitalType, number | null> {
    const vitals = this.getByPatient(patientId);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = vitals.filter(v => new Date(v.recordedAt).getTime() >= cutoff);

    const sums: Record<VitalType, number> = {
      BLOOD_PRESSURE: 0,
      HEART_RATE: 0,
      WEIGHT: 0,
      GLUCOSE: 0,
      TEMPERATURE: 0,
      SPO2: 0
    };

    const counts: Record<VitalType, number> = {
      BLOOD_PRESSURE: 0,
      HEART_RATE: 0,
      WEIGHT: 0,
      GLUCOSE: 0,
      TEMPERATURE: 0,
      SPO2: 0
    };

    for (const v of recent) {
      sums[v.type] += v.value;
      counts[v.type]++;
    }

    const averages: Record<VitalType, number | null> = {
      BLOOD_PRESSURE: null,
      HEART_RATE: null,
      WEIGHT: null,
      GLUCOSE: null,
      TEMPERATURE: null,
      SPO2: null
    };

    for (const key in sums) {
      const type = key as VitalType;
      averages[type] = counts[type] > 0 ? sums[type] / counts[type] : null;
    }

    return averages;
  }
};
