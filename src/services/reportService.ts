import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { DoseRecord, Patient, Treatment, FollowUp } from '../types';
import { analyticsService } from './analyticsService';

export interface AdherenceReportItem {
  patientId: string;
  patientName: string;
  adherenceRate: number;
  riskLevel: string;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
}

export interface ProgressReportItem {
  treatmentId: string;
  patientName: string;
  treatmentName: string;
  startDate: string;
  endDate: string;
  daysDuration: number;
  daysCompleted: number;
  daysRemaining: number;
  adherenceRate: number;
  status: string;
}

export interface MissedDoseReportItem {
  patientName: string;
  medicationName: string;
  date: string;
  time: string;
  reason: string;
  note: string;
}

export const reportService = {
  getAdherenceReport(): AdherenceReportItem[] {
    const patients = storageService.get<Patient[]>(KEYS.PATIENTS, []);
    const doses = storageService.get<DoseRecord[]>(KEYS.DOSES, []);

    return patients.map(p => {
      const patDoses = doses.filter(d => d.patientId === p.id);
      const rate = analyticsService.calculateAdherence(patDoses);
      const tracked = patDoses.filter(d => d.status === 'TAKEN' || d.status === 'MISSED' || d.status === 'SKIPPED');

      return {
        patientId: p.id,
        patientName: p.name,
        adherenceRate: rate,
        riskLevel: analyticsService.classifyAdherence(rate),
        totalDoses: tracked.length,
        takenDoses: tracked.filter(d => d.status === 'TAKEN').length,
        missedDoses: tracked.filter(d => d.status === 'MISSED' || d.status === 'SKIPPED').length
      };
    });
  },

  getProgressReport(): ProgressReportItem[] {
    const treatments = storageService.get<Treatment[]>(KEYS.TREATMENTS, []);
    const patients = storageService.get<Patient[]>(KEYS.PATIENTS, []);
    const doses = storageService.get<DoseRecord[]>(KEYS.DOSES, []);

    const today = new Date();

    return treatments.map(t => {
      const patient = patients.find(p => p.id === t.patientId);
      const start = new Date(t.startDate);
      const end = new Date(t.endDate);
      
      const totalDurationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      
      let daysCompleted = 0;
      let daysRemaining = 0;

      if (today > end) {
        daysCompleted = totalDurationDays;
        daysRemaining = 0;
      } else if (today < start) {
        daysCompleted = 0;
        daysRemaining = totalDurationDays;
      } else {
        daysCompleted = Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24));
        daysRemaining = totalDurationDays - daysCompleted;
      }

      const treatmentDoses = doses.filter(d => d.treatmentId === t.id);
      const rate = analyticsService.calculateAdherence(treatmentDoses);

      return {
        treatmentId: t.id,
        patientName: patient ? patient.name : 'Unknown',
        treatmentName: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        daysDuration: totalDurationDays,
        daysCompleted,
        daysRemaining,
        adherenceRate: rate,
        status: t.status
      };
    });
  },

  getMissedDoseReport(): MissedDoseReportItem[] {
    const doses = storageService.get<DoseRecord[]>(KEYS.DOSES, []);
    const patients = storageService.get<Patient[]>(KEYS.PATIENTS, []);
    const medications = storageService.get<any[]>(KEYS.MEDICATIONS, []);

    const missed = doses.filter(d => d.status === 'MISSED' || d.status === 'SKIPPED');

    return missed.map(d => {
      const patient = patients.find(p => p.id === d.patientId);
      const medication = medications.find(m => m.id === d.medicationId);

      return {
        patientName: patient ? patient.name : 'Unknown',
        medicationName: medication ? medication.name : 'Medication',
        date: d.scheduledDate,
        time: d.scheduledTime,
        reason: d.reasonForMissed || 'FORGOT',
        note: d.reasonNote || ''
      };
    });
  },

  getFollowUpReport(): FollowUp[] {
    return storageService.get<FollowUp[]>(KEYS.FOLLOW_UPS, []);
  }
};
