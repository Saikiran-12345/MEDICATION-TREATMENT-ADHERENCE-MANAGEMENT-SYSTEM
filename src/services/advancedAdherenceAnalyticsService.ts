/**
 * Advanced Adherence Analytics Service
 * Predictive adherence models, risk scoring, and pattern analysis
 */

import { storageService } from './storageService';
import { doseService } from './doseService';
import type { DoseRecord, Patient, Medication } from '../types';

const STORAGE_KEY_PREDICTIONS = 'adherence_predictions';
const STORAGE_KEY_PATTERNS = 'adherence_patterns';
const STORAGE_KEY_RISK_SCORES = 'adherence_risk_scores';

interface PatientAdherenceMetrics {
  patientId: string;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
  adherenceRate: number;
  consistencyScore: number;
  bestStreak: number;
  currentStreak: number;
  averageDailyRate: number;
  weeklyTrends: number[];
}

interface RiskFactor {
  factor: string;
  weight: number;
  impact: number;
}

interface PatientRiskProfile {
  patientId: string;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactor[];
  predictedAdherenceRate: number;
  confidenceScore: number;
  recommendations: string[];
  interventionLevel: 'MONITORING' | 'SUPPORT' | 'INTENSIVE';
  lastUpdated: string;
}

interface AdherencePattern {
  patientId: string;
  dayOfWeek: number; // 0-6
  timeOfDay: string; // Morning, Afternoon, Evening, Night
  missRate: number;
  consistency: number;
  trendDirection: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

interface AdherencePrediction {
  patientId: string;
  period: 'NEXT_7_DAYS' | 'NEXT_30_DAYS' | 'NEXT_90_DAYS';
  predictedAdherenceRate: number;
  confidenceInterval: { lower: number; upper: number };
  likelyMissedDoses: number;
  scenarioAnalysis: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  generatedAt: string;
}

interface SeasonalTrend {
  month: number;
  averageAdherence: number;
  variability: number;
  historicalData: number[];
}

class AdvancedAdherenceAnalyticsService {
  /**
   * Calculate comprehensive adherence metrics for a patient
   */
  calculatePatientMetrics(patientId: string, doseRecords: DoseRecord[]): PatientAdherenceMetrics {
    const patient_doses = doseRecords.filter((d) => d.patientId === patientId);

    if (patient_doses.length === 0) {
      return {
        patientId,
        totalDoses: 0,
        takenDoses: 0,
        missedDoses: 0,
        skippedDoses: 0,
        adherenceRate: 0,
        consistencyScore: 0,
        bestStreak: 0,
        currentStreak: 0,
        averageDailyRate: 0,
        weeklyTrends: [],
      };
    }

    const takenDoses = patient_doses.filter((d) => d.status === 'TAKEN').length;
    const missedDoses = patient_doses.filter((d) => d.status === 'MISSED').length;
    const skippedDoses = patient_doses.filter((d) => d.status === 'SKIPPED').length;
    const countable = takenDoses + missedDoses + skippedDoses;

    const adherenceRate = countable > 0 ? (takenDoses / countable) * 100 : 0;

    // Calculate streaks
    const sorted = [...patient_doses].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    let currentStreak = 0;
    let bestStreak = 0;

    for (const dose of sorted.reverse()) {
      if (dose.status === 'TAKEN') {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // Calculate consistency (variance in daily adherence)
    const dailyRates = this.calculateDailyAdherence(patient_doses);
    const avgDaily = dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length;
    const variance = dailyRates.reduce((sum, rate) => sum + Math.pow(rate - avgDaily, 2), 0) / dailyRates.length;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

    // Weekly trends
    const weeklyTrends = this.calculateWeeklyTrends(patient_doses);

    return {
      patientId,
      totalDoses: patient_doses.length,
      takenDoses,
      missedDoses,
      skippedDoses,
      adherenceRate: Math.round(adherenceRate * 100) / 100,
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      bestStreak,
      currentStreak,
      averageDailyRate: Math.round(avgDaily * 100) / 100,
      weeklyTrends,
    };
  }

  /**
   * Generate risk profile for patient based on adherence patterns
   */
  generateRiskProfile(patientId: string, doseRecords: DoseRecord[], historicalData?: any): PatientRiskProfile {
    const metrics = this.calculatePatientMetrics(patientId, doseRecords);
    const riskFactors: RiskFactor[] = [];

    // Factor 1: Low adherence rate
    if (metrics.adherenceRate < 60) {
      riskFactors.push({
        factor: 'CRITICAL_LOW_ADHERENCE',
        weight: 3.0,
        impact: 100 - metrics.adherenceRate,
      });
    } else if (metrics.adherenceRate < 75) {
      riskFactors.push({
        factor: 'LOW_ADHERENCE',
        weight: 2.0,
        impact: 100 - metrics.adherenceRate,
      });
    }

    // Factor 2: Low consistency
    if (metrics.consistencyScore < 50) {
      riskFactors.push({
        factor: 'LOW_CONSISTENCY',
        weight: 1.5,
        impact: 100 - metrics.consistencyScore,
      });
    }

    // Factor 3: Declining streak
    if (metrics.currentStreak === 0 && metrics.totalDoses > 10) {
      riskFactors.push({
        factor: 'RECENT_MISSED_DOSES',
        weight: 2.0,
        impact: 50,
      });
    }

    // Factor 4: High missed dose count
    const missRate = (metrics.missedDoses / metrics.totalDoses) * 100;
    if (missRate > 40) {
      riskFactors.push({
        factor: 'HIGH_MISS_RATE',
        weight: 2.5,
        impact: missRate,
      });
    }

    // Factor 5: Pattern analysis
    const patterns = this.identifyAdherencePatterns(patientId, doseRecords);
    const poorDayCount = patterns.filter((p) => p.missRate > 30).length;
    if (poorDayCount > 2) {
      riskFactors.push({
        factor: 'POOR_ADHERENCE_PERIODS',
        weight: 1.5,
        impact: poorDayCount * 20,
      });
    }

    // Calculate overall risk score (0-100)
    const totalWeightedImpact = riskFactors.reduce((sum, f) => sum + f.weight * (f.impact / 100), 0);
    const totalWeight = riskFactors.reduce((sum, f) => sum + f.weight, 0);
    const overallRiskScore = totalWeight > 0 ? Math.min(100, totalWeightedImpact / totalWeight * 100) : 0;

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (overallRiskScore > 75) riskLevel = 'CRITICAL';
    else if (overallRiskScore > 50) riskLevel = 'HIGH';
    else if (overallRiskScore > 25) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskFactors, metrics);

    // Determine intervention level
    let interventionLevel: 'MONITORING' | 'SUPPORT' | 'INTENSIVE';
    if (riskLevel === 'CRITICAL') interventionLevel = 'INTENSIVE';
    else if (riskLevel === 'HIGH') interventionLevel = 'SUPPORT';
    else interventionLevel = 'MONITORING';

    const predictedAdherenceRate = Math.max(0, metrics.adherenceRate - riskFactors.reduce((sum, f) => sum + f.impact / 100, 0) * 20);

    const profile: PatientRiskProfile = {
      patientId,
      overallRiskScore: Math.round(overallRiskScore * 100) / 100,
      riskLevel,
      riskFactors: riskFactors.sort((a, b) => b.weight - a.weight),
      predictedAdherenceRate: Math.round(predictedAdherenceRate * 100) / 100,
      confidenceScore: Math.min(100, metrics.totalDoses / 30 * 100), // Confidence increases with data
      recommendations,
      interventionLevel,
      lastUpdated: new Date().toISOString(),
    };

    // Cache profile
    this.cacheRiskProfile(profile);

    return profile;
  }

  /**
   * Identify time-based adherence patterns
   */
  identifyAdherencePatterns(patientId: string, doseRecords: DoseRecord[]): AdherencePattern[] {
    const patient_doses = doseRecords.filter((d) => d.patientId === patientId);
    const patterns: Record<string, AdherencePattern> = {};

    for (const dose of patient_doses) {
      const date = new Date(dose.scheduledDate);
      const dayOfWeek = date.getDay();
      const hour = parseInt(dose.scheduledTime.split(':')[0]);

      let timeOfDay = 'Night';
      if (hour >= 6 && hour < 12) timeOfDay = 'Morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
      else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';

      const key = `${dayOfWeek}_${timeOfDay}`;

      if (!patterns[key]) {
        patterns[key] = {
          patientId,
          dayOfWeek,
          timeOfDay,
          missRate: 0,
          consistency: 0,
          trendDirection: 'STABLE',
        };
      }

      if (dose.status === 'MISSED') {
        patterns[key].missRate += 1;
      }
    }

    // Calculate miss rates and normalize
    Object.values(patterns).forEach((pattern) => {
      const periodDoses = patient_doses.filter((d) => {
        const date = new Date(d.scheduledDate);
        const hour = parseInt(d.scheduledTime.split(':')[0]);
        let timeOfDay = 'Night';
        if (hour >= 6 && hour < 12) timeOfDay = 'Morning';
        else if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
        else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
        return date.getDay() === pattern.dayOfWeek && timeOfDay === pattern.timeOfDay;
      });

      pattern.missRate = (pattern.missRate / periodDoses.length) * 100;
      pattern.consistency = 100 - Math.abs(Math.random() * 20); // Simulated consistency
    });

    // Cache patterns
    const allPatterns = (storageService.get(STORAGE_KEY_PATTERNS) || []) as AdherencePattern[];
    const existingIndex = allPatterns.findIndex((p) => p.patientId === patientId);
    const newPatterns = Object.values(patterns);

    if (existingIndex >= 0) {
      allPatterns[existingIndex] = newPatterns[0];
    } else {
      allPatterns.push(...newPatterns);
    }

    storageService.set(STORAGE_KEY_PATTERNS, allPatterns.slice(-1000)); // Keep last 1000
    return newPatterns;
  }

  /**
   * Predict future adherence rates
   */
  predictAdherence(patientId: string, doseRecords: DoseRecord[], period: 'NEXT_7_DAYS' | 'NEXT_30_DAYS' | 'NEXT_90_DAYS'): AdherencePrediction {
    const metrics = this.calculatePatientMetrics(patientId, doseRecords);
    const patient_doses = doseRecords.filter((d) => d.patientId === patientId);

    // Simple prediction model: weighted average of recent trend + historical average
    const recentDoses = patient_doses.slice(-30);
    const recentRate = recentDoses.length > 0 
      ? (recentDoses.filter((d) => d.status === 'TAKEN').length / recentDoses.length) * 100 
      : 0;

    const trendWeight = Math.min(1, patient_doses.length / 100); // More data = more trust in trend
    const baselineWeight = 1 - trendWeight;

    const predictedRate = recentRate * trendWeight + metrics.adherenceRate * baselineWeight;

    // Confidence interval based on consistency
    const stdDev = (100 - metrics.consistencyScore) / 2;
    const marginOfError = 1.96 * stdDev / Math.sqrt(Math.max(1, patient_doses.length / 30));

    let expectedDoses = 0;
    let confidenceScore = Math.min(100, metrics.totalDoses / 30 * 100);

    if (period === 'NEXT_7_DAYS') {
      expectedDoses = 7; // Typically 1 dose per day
    } else if (period === 'NEXT_30_DAYS') {
      expectedDoses = 30;
    } else {
      expectedDoses = 90;
    }

    const prediction: AdherencePrediction = {
      patientId,
      period,
      predictedAdherenceRate: Math.round(predictedRate * 100) / 100,
      confidenceInterval: {
        lower: Math.max(0, Math.round((predictedRate - marginOfError) * 100) / 100),
        upper: Math.min(100, Math.round((predictedRate + marginOfError) * 100) / 100),
      },
      likelyMissedDoses: Math.round(expectedDoses * (100 - predictedRate) / 100),
      scenarioAnalysis: {
        optimistic: Math.round((predictedRate + marginOfError) * 100) / 100,
        realistic: Math.round(predictedRate * 100) / 100,
        pessimistic: Math.max(0, Math.round((predictedRate - marginOfError) * 100) / 100),
      },
      generatedAt: new Date().toISOString(),
    };

    // Cache prediction
    const predictions = (storageService.get(STORAGE_KEY_PREDICTIONS) || []) as AdherencePrediction[];
    const existingIndex = predictions.findIndex((p) => p.patientId === patientId && p.period === period);

    if (existingIndex >= 0) {
      predictions[existingIndex] = prediction;
    } else {
      predictions.push(prediction);
    }

    storageService.set(STORAGE_KEY_PREDICTIONS, predictions);

    return prediction;
  }

  /**
   * Analyze seasonal trends
   */
  analyzeSeasonalTrends(doseRecords: DoseRecord[]): SeasonalTrend[] {
    const monthlyData: Record<number, number[]> = {};

    for (const dose of doseRecords) {
      const date = new Date(dose.scheduledDate);
      const month = date.getMonth();
      const isTaken = dose.status === 'TAKEN' ? 100 : 0;

      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(isTaken);
    }

    const trends: SeasonalTrend[] = [];

    for (let month = 0; month < 12; month++) {
      const data = monthlyData[month] || [];
      const avgAdherence = data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0;

      const variance = data.length > 0 
        ? data.reduce((sum, val) => sum + Math.pow(val - avgAdherence, 2), 0) / data.length 
        : 0;

      trends.push({
        month,
        averageAdherence: Math.round(avgAdherence * 100) / 100,
        variability: Math.round(Math.sqrt(variance) * 100) / 100,
        historicalData: data,
      });
    }

    return trends;
  }

  /**
   * Get cached risk profile
   */
  getRiskProfile(patientId: string): PatientRiskProfile | null {
    const profiles = (storageService.get(STORAGE_KEY_RISK_SCORES) || []) as PatientRiskProfile[];
    return profiles.find((p) => p.patientId === patientId) || null;
  }

  /**
   * Get all risk profiles
   */
  getAllRiskProfiles(): PatientRiskProfile[] {
    return (storageService.get(STORAGE_KEY_RISK_SCORES) || []) as PatientRiskProfile[];
  }

  /**
   * Get high-risk patients for intervention
   */
  getHighRiskPatients(minRiskScore = 50): PatientRiskProfile[] {
    const profiles = this.getAllRiskProfiles();
    return profiles.filter((p) => p.overallRiskScore >= minRiskScore).sort((a, b) => b.overallRiskScore - a.overallRiskScore);
  }

  /**
   * Get patient comparison metrics
   */
  comparePatients(patientIds: string[], doseRecords: DoseRecord[]): Array<PatientAdherenceMetrics> {
    return patientIds.map((id) => this.calculatePatientMetrics(id, doseRecords)).sort((a, b) => b.adherenceRate - a.adherenceRate);
  }

  /**
   * Private: Calculate daily adherence rates
   */
  private calculateDailyAdherence(doseRecords: DoseRecord[]): number[] {
    const dailyStats: Record<string, { taken: number; total: number }> = {};

    for (const dose of doseRecords) {
      const date = dose.scheduledDate;

      if (!dailyStats[date]) {
        dailyStats[date] = { taken: 0, total: 0 };
      }

      dailyStats[date].total++;
      if (dose.status === 'TAKEN') {
        dailyStats[date].taken++;
      }
    }

    return Object.values(dailyStats).map((stat) => (stat.total > 0 ? stat.taken / stat.total : 0));
  }

  /**
   * Private: Calculate weekly trends
   */
  private calculateWeeklyTrends(doseRecords: DoseRecord[]): number[] {
    const weeklyStats: number[] = [0, 0, 0, 0];
    const today = new Date();

    for (const dose of doseRecords) {
      const doseDate = new Date(dose.scheduledDate);
      const daysAgo = Math.floor((today.getTime() - doseDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysAgo / 7);

      if (weekIndex < 4 && dose.status === 'TAKEN') {
        weeklyStats[weekIndex]++;
      }
    }

    return weeklyStats.map((count, index) => {
      const daysInWeek = 7;
      return Math.round((count / daysInWeek) * 100);
    });
  }

  /**
   * Private: Generate recommendations based on risk factors
   */
  private generateRecommendations(riskFactors: RiskFactor[], metrics: PatientAdherenceMetrics): string[] {
    const recommendations: string[] = [];

    if (riskFactors.some((f) => f.factor.includes('CRITICAL_LOW'))) {
      recommendations.push('Urgent intervention needed. Consider intensive monitoring program.');
      recommendations.push('Schedule immediate follow-up consultation with patient.');
      recommendations.push('Review medication regimen for complexity or side effects.');
    }

    if (riskFactors.some((f) => f.factor === 'LOW_CONSISTENCY')) {
      recommendations.push('Implement daily reminder system (SMS/Email).');
      recommendations.push('Consider pillbox organizer or smart medication dispenser.');
    }

    if (riskFactors.some((f) => f.factor === 'RECENT_MISSED_DOSES')) {
      recommendations.push('Contact patient immediately to understand barriers.');
      recommendations.push('Explore medication simplification strategies.');
    }

    if (metrics.currentStreak === 0) {
      recommendations.push('Patient needs encouragement and support to restart routine.');
      recommendations.push('Consider motivational interviewing approach.');
    }

    if (metrics.consistencyScore < 60) {
      recommendations.push('Suggest establishing specific daily routine for medication.');
      recommendations.push('Link medication taking to daily habit (e.g., meals).');
    }

    return recommendations;
  }

  /**
   * Private: Cache risk profile
   */
  private cacheRiskProfile(profile: PatientRiskProfile): void {
    const profiles = (storageService.get(STORAGE_KEY_RISK_SCORES) || []) as PatientRiskProfile[];
    const index = profiles.findIndex((p) => p.patientId === profile.patientId);

    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }

    storageService.set(STORAGE_KEY_RISK_SCORES, profiles);
  }
}

export const advancedAdherenceAnalyticsService = new AdvancedAdherenceAnalyticsService();
