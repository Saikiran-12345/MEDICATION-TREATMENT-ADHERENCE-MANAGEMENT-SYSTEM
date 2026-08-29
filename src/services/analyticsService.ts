import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { DoseRecord, Treatment, FollowUp, Patient } from '../types';

export interface DashboardMetrics {
  totalPatients: number;
  activeTreatments: number;
  todayScheduledDoses: number;
  completedDoses: number; // taken
  missedDoses: number; // missed + skipped
  averageAdherence: number;
  upcomingFollowUps: number;
  pendingReminders: number;
  lowAdherencePatientsCount: number;
}

export interface AdherenceTrend {
  date: string;
  adherence: number;
  taken: number;
  missed: number;
}

export const analyticsService = {
  // Calculates the adherence rate for a set of dose records
  calculateAdherence(doses: DoseRecord[]): number {
    const trackingDoses = doses.filter(
      (d) => d.status === 'TAKEN' || d.status === 'MISSED' || d.status === 'SKIPPED'
    );

    if (trackingDoses.length === 0) return 100; // Default to 100 if no tracking history

    const taken = trackingDoses.filter((d) => d.status === 'TAKEN').length;
    return Math.round((taken / trackingDoses.length) * 100);
  },

  // Classifies adherence into non-clinical levels
  classifyAdherence(percentage: number): 'LOW ADHERENCE' | 'MEDIUM ADHERENCE' | 'HIGH ADHERENCE' {
    if (percentage < 60) return 'LOW ADHERENCE';
    if (percentage <= 80) return 'MEDIUM ADHERENCE';
    return 'HIGH ADHERENCE';
  },

  // Generates aggregated high-level stats for Dashboards
  getDashboardMetrics(): DashboardMetrics {
    const patients = storageService.get<Patient[]>(KEYS.PATIENTS, []);
    const treatments = storageService.get<Treatment[]>(KEYS.TREATMENTS, []);
    const doses = storageService.get<DoseRecord[]>(KEYS.DOSES, []);
    const followUps = storageService.get<FollowUp[]>(KEYS.FOLLOW_UPS, []);
    const notifs = storageService.get<any[]>(KEYS.NOTIFICATIONS, []);

    const todayStr = new Date().toISOString().split('T')[0];

    const todayDoses = doses.filter((d) => d.scheduledDate === todayStr);
    const completedDoses = doses.filter((d) => d.status === 'TAKEN').length;
    const missedDoses = doses.filter((d) => d.status === 'MISSED' || d.status === 'SKIPPED').length;

    // Calculate low adherence count (patients with adherence < 60%)
    let lowAdherenceCount = 0;
    patients.filter(p => p.status === 'ACTIVE').forEach(pat => {
      const patDoses = doses.filter(d => d.patientId === pat.id);
      if (patDoses.length > 0) {
        const rate = this.calculateAdherence(patDoses);
        if (rate < 60) lowAdherenceCount++;
      }
    });

    return {
      totalPatients: patients.length,
      activeTreatments: treatments.filter((t) => t.status === 'ACTIVE').length,
      todayScheduledDoses: todayDoses.length,
      completedDoses,
      missedDoses,
      averageAdherence: this.calculateAdherence(doses),
      upcomingFollowUps: followUps.filter((f) => f.status === 'SCHEDULED' && f.date >= todayStr).length,
      pendingReminders: notifs.filter((n) => !n.isRead).length,
      lowAdherencePatientsCount: lowAdherenceCount
    };
  },

  // Gets adherence trend data grouped by date for charts
  getAdherenceTrend(daysCount = 7): AdherenceTrend[] {
    const doses = storageService.get<DoseRecord[]>(KEYS.DOSES, []);
    const trend: AdherenceTrend[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayDoses = doses.filter((dose) => dose.scheduledDate === dateStr);
      const rate = this.calculateAdherence(dayDoses);
      const taken = dayDoses.filter((dose) => dose.status === 'TAKEN').length;
      const missed = dayDoses.filter((dose) => dose.status === 'MISSED' || dose.status === 'SKIPPED').length;

      trend.push({
        date: dateStr.substring(5), // e.g. "08-29"
        adherence: rate,
        taken,
        missed
      });
    }

    return trend;
  },

  // Gets stats for a specific patient
  getPatientAnalytics(patientId: string) {
    const doses = storageService.get<DoseRecord[]>(KEYS.DOSES, []).filter((d) => d.patientId === patientId);
    const treatments = storageService.get<Treatment[]>(KEYS.TREATMENTS, []).filter((t) => t.patientId === patientId);
    const followUps = storageService.get<FollowUp[]>(KEYS.FOLLOW_UPS, []).filter((f) => f.patientId === patientId);

    const adherence = this.calculateAdherence(doses);
    const completedDoses = doses.filter((d) => d.status === 'TAKEN').length;
    const missedDoses = doses.filter((d) => d.status === 'MISSED').length;
    const skippedDoses = doses.filter((d) => d.status === 'SKIPPED').length;

    // Streak calculations
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    // Sort all tracked doses chronologically to calculate streaks
    const trackedDosesSorted = [...doses]
      .filter(d => d.status === 'TAKEN' || d.status === 'MISSED')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    trackedDosesSorted.forEach(d => {
      if (d.status === 'TAKEN') {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    });
    
    // Current streak working backwards from today
    const todayStr = new Date().toISOString().split('T')[0];
    const pastDoses = doses
      .filter(d => d.scheduledDate <= todayStr && (d.status === 'TAKEN' || d.status === 'MISSED'))
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()); // descending (newest first)

    for (const d of pastDoses) {
      if (d.status === 'TAKEN') {
        currentStreak++;
      } else if (d.status === 'MISSED') {
        break;
      }
    }

    return {
      adherence,
      completedDoses,
      missedDoses,
      skippedDoses,
      activeTreatmentsCount: treatments.filter((t) => t.status === 'ACTIVE').length,
      completedTreatmentsCount: treatments.filter((t) => t.status === 'COMPLETED').length,
      followUpsCount: followUps.length,
      currentStreak,
      bestStreak,
      riskLevel: this.classifyAdherence(adherence)
    };
  }
};
