/**
 * Clinical Decision Support Service
 * Evidence-based recommendations, clinical guidelines, and alerts
 */

import { storageService } from './storageService';
import { enhancedDrugInteractionService } from './enhancedDrugInteractionService';

const STORAGE_KEY_GUIDELINES = 'clinical_guidelines';
const STORAGE_KEY_RECOMMENDATIONS = 'clinical_recommendations';
const STORAGE_KEY_ALERTS = 'clinical_alerts';
const STORAGE_KEY_EVIDENCE = 'clinical_evidence';

interface ClinicalGuideline {
  id: string;
  title: string;
  condition: string;
  source: string; // 'AHA', 'ADA', 'ACC', etc.
  year: number;
  recommendations: Array<{
    priority: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    recommendation: string;
    evidence: string;
    implementation: string;
  }>;
  targetPopulation: string;
  contraindications: string[];
  isActive: boolean;
}

interface DrugEfficacyData {
  medication: string;
  condition: string;
  efficacy: number; // 0-100
  effectOnsetDays: number;
  responseRate: number; // percentage
  remissionRate: number;
  studyCount: number;
  sourcesCount: number;
  metadata: {
    ageGroup?: string;
    gender?: 'ANY' | 'MALE' | 'FEMALE';
    comorbidities?: string[];
  };
}

interface ClinicalRecommendation {
  id: string;
  patientId: string;
  recommendationType: 'MEDICATION_ADJUSTMENT' | 'ADDITIONAL_TESTING' | 'SPECIALIST_REFERRAL' | 'DOSAGE_OPTIMIZATION' | 'ADHERENCE_INTERVENTION';
  priority: 'URGENT' | 'HIGH' | 'MODERATE' | 'LOW';
  title: string;
  description: string;
  rationale: string;
  evidenceSupport: string;
  actionItems: string[];
  estimatedBenefit: string;
  risks: string[];
  alternatives: string[];
  implementationSteps: string[];
  timeframe: string;
  createdAt: string;
  acceptedAt?: string;
  implementedAt?: string;
  status: 'PENDING' | 'ACCEPTED' | 'IMPLEMENTED' | 'DECLINED' | 'ARCHIVED';
}

interface ClinicalAlert {
  id: string;
  patientId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  category: 'DRUG_INTERACTION' | 'CONTRAINDICATION' | 'ALLERGY' | 'LAB_ABNORMALITY' | 'DOSAGE_ERROR' | 'RENAL_HEPATIC' | 'PREGNANCY' | 'ELDERLY';
  message: string;
  details: Record<string, any>;
  actions: Array<{
    action: string;
    urgency: 'IMMEDIATE' | 'TODAY' | 'WITHIN_24H' | 'WITHIN_7D';
  }>;
  suppressedUntil?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

interface ClinicalGoal {
  id: string;
  patientId: string;
  goal: string;
  condition: string;
  startDate: string;
  targetDate: string;
  targetValue: string;
  currentValue?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'AT_TARGET' | 'EXCEEDED' | 'NOT_MET';
  progressNotes: Array<{ date: string; value: string; note: string }>;
  interventions: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

class ClinicalDecisionSupportService {
  /**
   * Get guideline for condition
   */
  getGuidelineForCondition(condition: string): ClinicalGuideline | null {
    const guidelines = this.getGuidelines();
    return guidelines.find((g) => g.condition.toLowerCase() === condition.toLowerCase() && g.isActive) || null;
  }

  /**
   * Get drug efficacy for condition
   */
  getDrugEfficacy(medication: string, condition: string): DrugEfficacyData | null {
    const evidence = (storageService.get(STORAGE_KEY_EVIDENCE) || []) as DrugEfficacyData[];

    // Simulate efficacy lookup
    const efficacy: DrugEfficacyData = {
      medication,
      condition,
      efficacy: 75 + Math.random() * 20,
      effectOnsetDays: 7 + Math.floor(Math.random() * 14),
      responseRate: 70 + Math.random() * 25,
      remissionRate: 30 + Math.random() * 40,
      studyCount: 50 + Math.floor(Math.random() * 100),
      sourcesCount: 10 + Math.floor(Math.random() * 50),
      metadata: { ageGroup: '18-65', gender: 'ANY' },
    };

    return efficacy;
  }

  /**
   * Generate medication recommendation
   */
  recommendMedication(patientId: string, condition: string, currentMedications: string[], patientFactors: Record<string, any>): ClinicalRecommendation | null {
    const guideline = this.getGuidelineForCondition(condition);
    if (!guideline) {
      return null;
    }

    const rec = guideline.recommendations[0];
    if (!rec) {
      return null;
    }

    const recommendation: ClinicalRecommendation = {
      id: this.generateId(),
      patientId,
      recommendationType: 'MEDICATION_ADJUSTMENT',
      priority: rec.priority as any,
      title: `Update ${condition} Management`,
      description: rec.recommendation,
      rationale: `Based on ${guideline.source} ${guideline.year} guidelines`,
      evidenceSupport: rec.evidence,
      actionItems: [rec.implementation],
      estimatedBenefit: 'Improved disease control and clinical outcomes',
      risks: this.identifyRisks(currentMedications, rec.recommendation),
      alternatives: this.getAlternatives(rec.recommendation),
      implementationSteps: [
        'Review patient history and contraindications',
        'Calculate appropriate dosage',
        'Monitor for side effects',
        'Assess response at 4 weeks',
      ],
      timeframe: 'Implement within 1-2 weeks',
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };

    const recommendations = this.getRecommendations();
    recommendations.push(recommendation);
    storageService.set(STORAGE_KEY_RECOMMENDATIONS, recommendations);

    return recommendation;
  }

  /**
   * Generate dosage optimization recommendation
   */
  optimizeDosage(patientId: string, medication: string, currentDose: number, labValues?: Record<string, number>): ClinicalRecommendation | null {
    // Check renal/hepatic function
    const renalFunction = labValues?.creatinine || 1.0;
    const adjustedDose = this.calculateAdjustedDose(medication, currentDose, renalFunction);

    if (Math.abs(adjustedDose - currentDose) < 10) {
      return null; // No significant adjustment needed
    }

    const recommendation: ClinicalRecommendation = {
      id: this.generateId(),
      patientId,
      recommendationType: 'DOSAGE_OPTIMIZATION',
      priority: 'MODERATE',
      title: `Dosage Adjustment for ${medication}`,
      description: `Recommend adjusting ${medication} from ${currentDose}mg to ${adjustedDose}mg based on renal function`,
      rationale: `Patient has creatinine level of ${renalFunction} (${this.getKidneyFunction(renalFunction)})`,
      evidenceSupport: 'Standard dose adjustments for renal function',
      actionItems: [`Adjust dosage to ${adjustedDose}mg daily`],
      estimatedBenefit: 'Optimize therapeutic efficacy and reduce toxicity risk',
      risks: ['Risk of underdosing if creatinine values improve', 'Risk of overdosing if renal function deteriorates'],
      alternatives: ['Consider alternative medication with less renal clearance', 'Increase monitoring frequency'],
      implementationSteps: [
        'Confirm renal function before implementing',
        'Adjust dose gradually if possible',
        'Monitor efficacy over 2-4 weeks',
        'Check lab values at follow-up',
      ],
      timeframe: 'Implement within 1 week',
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };

    const recommendations = this.getRecommendations();
    recommendations.push(recommendation);
    storageService.set(STORAGE_KEY_RECOMMENDATIONS, recommendations);

    return recommendation;
  }

  /**
   * Create clinical alert
   */
  createAlert(patientId: string, category: ClinicalAlert['category'], message: string, details: Record<string, any>, severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'HIGH'): ClinicalAlert {
    const alert: ClinicalAlert = {
      id: this.generateId(),
      patientId,
      severity,
      category,
      message,
      details,
      actions: this.generateAlertActions(category, severity),
      acknowledged: false,
    };

    const alerts = (storageService.get(STORAGE_KEY_ALERTS) || []) as ClinicalAlert[];
    alerts.push(alert);
    storageService.set(STORAGE_KEY_ALERTS, alerts);

    return alert;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, userId: string): ClinicalAlert | null {
    const alerts = (storageService.get(STORAGE_KEY_ALERTS) || []) as ClinicalAlert[];
    const alert = alerts.find((a) => a.id === alertId);

    if (!alert) {
      return null;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date().toISOString();

    storageService.set(STORAGE_KEY_ALERTS, alerts);
    return alert;
  }

  /**
   * Set clinical goal
   */
  setClinicalGoal(patientId: string, goal: string, condition: string, targetValue: string, targetDays = 90): ClinicalGoal {
    const clinicalGoal: ClinicalGoal = {
      id: this.generateId(),
      patientId,
      goal,
      condition,
      startDate: new Date().toISOString(),
      targetDate: new Date(Date.now() + targetDays * 24 * 60 * 60 * 1000).toISOString(),
      targetValue,
      status: 'NOT_STARTED',
      progressNotes: [],
      interventions: [],
      priority: 'HIGH',
    };

    return clinicalGoal;
  }

  /**
   * Get clinical alerts for patient
   */
  getPatientAlerts(patientId: string, includeAcknowledged = false): ClinicalAlert[] {
    const alerts = (storageService.get(STORAGE_KEY_ALERTS) || []) as ClinicalAlert[];
    return alerts.filter((a) => a.patientId === patientId && (includeAcknowledged || !a.acknowledged));
  }

  /**
   * Check for contraindications
   */
  checkContraindications(patientId: string, medication: string, patientConditions: string[], allergies: string[]): Array<{ type: string; severity: string; detail: string }> {
    const contraindications: Array<{ type: string; severity: string; detail: string }> = [];

    // Check for drug allergies
    if (allergies.includes(medication)) {
      contraindications.push({
        type: 'ALLERGY',
        severity: 'CRITICAL',
        detail: `Patient has documented allergy to ${medication}`,
      });
    }

    // Check for condition contraindications
    const guideline = this.getGuidelineForCondition(medication);
    if (guideline) {
      for (const condition of patientConditions) {
        if (guideline.contraindications.some((c) => c.toLowerCase().includes(condition.toLowerCase()))) {
          contraindications.push({
            type: 'CONDITION_CONTRAINDICATION',
            severity: 'HIGH',
            detail: `${medication} is contraindicated in patients with ${condition}`,
          });
        }
      }
    }

    return contraindications;
  }

  /**
   * Get drug interaction recommendations
   */
  getDrugInteractionRecommendations(patientId: string, currentMedications: string[], newMedication: string): Array<{ interaction: string; severity: string; recommendation: string }> {
    const recommendations: Array<{ interaction: string; severity: string; recommendation: string }> = [];

    for (const currentMed of currentMedications) {
      const interaction = enhancedDrugInteractionService.checkInteraction(currentMed, newMedication);
      if (interaction) {
        recommendations.push({
          interaction: `${currentMed} + ${newMedication}`,
          severity: interaction.severity,
          recommendation: interaction.recommendation,
        });
      }
    }

    return recommendations;
  }

  /**
   * Get recommendations for patient
   */
  getPatientRecommendations(patientId: string, status?: string): ClinicalRecommendation[] {
    const recommendations = this.getRecommendations();
    let filtered = recommendations.filter((r) => r.patientId === patientId);

    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    return filtered;
  }

  /**
   * Accept recommendation
   */
  acceptRecommendation(recommendationId: string): ClinicalRecommendation | null {
    const recommendations = this.getRecommendations();
    const rec = recommendations.find((r) => r.id === recommendationId);

    if (!rec) {
      return null;
    }

    rec.status = 'ACCEPTED';
    rec.acceptedAt = new Date().toISOString();

    storageService.set(STORAGE_KEY_RECOMMENDATIONS, recommendations);
    return rec;
  }

  /**
   * Mark recommendation as implemented
   */
  markImplemented(recommendationId: string): ClinicalRecommendation | null {
    const recommendations = this.getRecommendations();
    const rec = recommendations.find((r) => r.id === recommendationId);

    if (!rec) {
      return null;
    }

    rec.status = 'IMPLEMENTED';
    rec.implementedAt = new Date().toISOString();

    storageService.set(STORAGE_KEY_RECOMMENDATIONS, recommendations);
    return rec;
  }

  /**
   * Private: Get guidelines
   */
  private getGuidelines(): ClinicalGuideline[] {
    let guidelines = (storageService.get(STORAGE_KEY_GUIDELINES) || []) as ClinicalGuideline[];

    if (guidelines.length === 0) {
      guidelines = this.createDefaultGuidelines();
      storageService.set(STORAGE_KEY_GUIDELINES, guidelines);
    }

    return guidelines;
  }

  /**
   * Private: Create default guidelines
   */
  private createDefaultGuidelines(): ClinicalGuideline[] {
    return [
      {
        id: this.generateId(),
        title: 'Hypertension Management Guidelines',
        condition: 'Hypertension',
        source: 'AHA',
        year: 2023,
        recommendations: [
          {
            priority: 'HIGH',
            recommendation: 'Initiate ACE inhibitor or ARB as first-line therapy',
            evidence: 'Multiple RCTs demonstrate superior cardiovascular outcomes',
            implementation: 'Start with lisinopril 10mg daily or equivalent',
          },
        ],
        targetPopulation: 'Adults with systolic BP ≥130 mmHg or diastolic BP ≥80 mmHg',
        contraindications: ['Pregnancy', 'Renal artery stenosis'],
        isActive: true,
      },
      {
        id: this.generateId(),
        title: 'Diabetes Management Guidelines',
        condition: 'Type 2 Diabetes',
        source: 'ADA',
        year: 2023,
        recommendations: [
          {
            priority: 'HIGH',
            recommendation: 'Consider GLP-1 RA for cardiovascular protection',
            evidence: 'Strong evidence for cardiovascular and weight benefits',
            implementation: 'Initiate semaglutide 0.25mg weekly or equivalent',
          },
        ],
        targetPopulation: 'Adults with type 2 diabetes and CVD or CKD',
        contraindications: ['Personal history of medullary thyroid carcinoma'],
        isActive: true,
      },
    ];
  }

  /**
   * Private: Get recommendations
   */
  private getRecommendations(): ClinicalRecommendation[] {
    return (storageService.get(STORAGE_KEY_RECOMMENDATIONS) || []) as ClinicalRecommendation[];
  }

  /**
   * Private: Identify risks
   */
  private identifyRisks(currentMedications: string[], recommendation: string): string[] {
    const risks: string[] = [];

    // Check for drug interactions
    for (const med of currentMedications) {
      const interaction = enhancedDrugInteractionService.checkInteraction(med, recommendation);
      if (interaction) {
        risks.push(`Potential interaction with ${med}: ${interaction.clinicalEffect}`);
      }
    }

    return risks;
  }

  /**
   * Private: Get alternatives
   */
  private getAlternatives(medication: string): string[] {
    const alternatives: Record<string, string[]> = {
      'lisinopril': ['ramipril', 'losartan', 'valsartan'],
      'metformin': ['glipizide', 'sitagliptin', 'pioglitazone'],
      'simvastatin': ['atorvastatin', 'pravastatin', 'rosuvastatin'],
    };

    return alternatives[medication.toLowerCase()] || ['Alternative agent in same drug class'];
  }

  /**
   * Private: Calculate adjusted dose
   */
  private calculateAdjustedDose(medication: string, currentDose: number, creatinine: number): number {
    if (creatinine < 1.2) {
      return currentDose; // Normal renal function
    }

    if (creatinine < 2.0) {
      return Math.floor(currentDose * 0.75); // Mild reduction
    }

    if (creatinine < 3.0) {
      return Math.floor(currentDose * 0.5); // Moderate reduction
    }

    return Math.floor(currentDose * 0.25); // Severe reduction
  }

  /**
   * Private: Get kidney function description
   */
  private getKidneyFunction(creatinine: number): string {
    if (creatinine < 1.2) return 'normal renal function';
    if (creatinine < 2.0) return 'mild renal impairment';
    if (creatinine < 3.0) return 'moderate renal impairment';
    return 'severe renal impairment';
  }

  /**
   * Private: Generate alert actions
   */
  private generateAlertActions(category: ClinicalAlert['category'], severity: string): Array<{ action: string; urgency: string }> {
    const actions: Record<string, Array<{ action: string; urgency: string }>> = {
      'DRUG_INTERACTION': [{ action: 'Review interaction and consider drug change', urgency: 'IMMEDIATE' }],
      'CONTRAINDICATION': [{ action: 'Discontinue medication immediately', urgency: 'IMMEDIATE' }],
      'ALLERGY': [{ action: 'Remove from allergy list and avoid future use', urgency: 'IMMEDIATE' }],
      'LAB_ABNORMALITY': [{ action: 'Repeat lab test and review medication', urgency: 'TODAY' }],
      'DOSAGE_ERROR': [{ action: 'Verify dosage with prescriber', urgency: 'IMMEDIATE' }],
      'RENAL_HEPATIC': [{ action: 'Assess dosing adjustment needs', urgency: 'WITHIN_24H' }],
      'PREGNANCY': [{ action: 'Evaluate medication safety in pregnancy', urgency: 'IMMEDIATE' }],
      'ELDERLY': [{ action: 'Consider geriatric dosing', urgency: 'WITHIN_7D' }],
    };

    return actions[category] || [{ action: 'Review alert and take appropriate action', urgency: 'WITHIN_24H' }];
  }

  /**
   * Private: Generate ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const clinicalDecisionSupportService = new ClinicalDecisionSupportService();
