/**
 * Insurance & Prior Authorization Service
 * Manages insurance eligibility, prior authorization requests, appeals, and claims
 */

import { storageService } from './storageService';
import { notificationService } from './notificationService';

const STORAGE_KEY_INSURANCE = 'patient_insurance_info';
const STORAGE_KEY_PRIOR_AUTH = 'prior_authorization_requests';
const STORAGE_KEY_CLAIMS = 'insurance_claims';
const STORAGE_KEY_APPEALS = 'insurance_appeals';
const STORAGE_KEY_COVERAGE = 'medication_coverage_lookup';

interface InsuranceInfo {
  id: string;
  patientId: string;
  insuranceCompany: string;
  memberId: string;
  groupNumber?: string;
  planName: string;
  planType: 'HMO' | 'PPO' | 'POS' | 'EPO' | 'HDHP';
  effectiveDate: string;
  terminationDate?: string;
  deductible: number;
  deductibleMet: number;
  copay: number;
  coinsurance: number; // percentage
  outOfPocketMax: number;
  outOfPocketMet: number;
  primaryCareName: string;
  primaryCarePhone: string;
  isActive: boolean;
  coverageDetails: {
    outpatientVisits: boolean;
    emergencyCare: boolean;
    hospitalization: boolean;
    prescription: boolean;
    preventiveCare: boolean;
  };
  lastVerified: string;
}

interface PriorAuthorizationRequest {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  prescriber: string;
  insuranceId: string;
  insuranceCompany: string;
  requestedDate: string;
  reason: 'NOT_COVERED' | 'REQUIRES_STEP_THERAPY' | 'MEDICAL_NECESSITY' | 'DOSAGE_LIMIT' | 'QUANTITY_LIMIT';
  medicalJustification: string;
  clinicalHistory: string;
  failedTherapies?: Array<{ medication: string; reason: string }>;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'DENIED' | 'APPEAL_SUBMITTED';
  reviewedDate?: string;
  reviewedBy?: string;
  approvalDuration?: number; // in days
  expiryDate?: string;
  denialReason?: string;
  denialCode?: string;
  notes?: string;
}

interface InsuranceClaim {
  id: string;
  patientId: string;
  claimNumber: string;
  serviceDate: string;
  submissionDate: string;
  amount: number;
  amountApproved: number;
  amountDenied: number;
  provider: string;
  serviceDescription: string;
  status: 'SUBMITTED' | 'RECEIVED' | 'PROCESSING' | 'APPROVED' | 'DENIED' | 'REJECTED' | 'PAID';
  lastStatusUpdate: string;
  denialCode?: string;
  denialReason?: string;
  applyToDeductible: boolean;
  paymentDate?: string;
  paymentMethod?: 'CHECK' | 'DIRECT_DEPOSIT' | 'EOB_CREDIT';
  notes?: string;
}

interface InsuranceAppeal {
  id: string;
  patientId: string;
  claimId?: string;
  priorAuthId?: string;
  reason: 'CLAIM_DENIED' | 'PRIOR_AUTH_DENIED' | 'COVERAGE_DENIED';
  appealNumber: string;
  submittedDate: string;
  supportingDocuments: string[];
  medicalEvidence: string;
  appealLevel: 1 | 2 | 3;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' | 'ESCALATED';
  appealedDate?: string;
  decisionDate?: string;
  decisionReason?: string;
  nextAppealDeadline?: string;
}

interface MedicationCoverage {
  medicationName: string;
  insuranceCompany: string;
  formulary: string;
  tier: 1 | 2 | 3 | 4 | 5;
  requiresPriorAuth: boolean;
  requiresStepTherapy: boolean;
  requiresQuantityLimit: boolean;
  limitDays?: number;
  limitQty?: number;
  copay: number;
  availableAlternatives: string[];
  lastUpdated: string;
}

class InsuranceAuthorizationService {
  /**
   * Add patient insurance information
   */
  addInsurance(patientId: string, insuranceData: Partial<InsuranceInfo>): InsuranceInfo {
    const insurance: InsuranceInfo = {
      id: this.generateId(),
      patientId,
      insuranceCompany: insuranceData.insuranceCompany || '',
      memberId: insuranceData.memberId || '',
      groupNumber: insuranceData.groupNumber,
      planName: insuranceData.planName || '',
      planType: insuranceData.planType || 'PPO',
      effectiveDate: insuranceData.effectiveDate || new Date().toISOString(),
      copay: insuranceData.copay || 25,
      coinsurance: insuranceData.coinsurance || 20,
      deductible: insuranceData.deductible || 500,
      deductibleMet: 0,
      outOfPocketMax: insuranceData.outOfPocketMax || 6000,
      outOfPocketMet: 0,
      primaryCareName: insuranceData.primaryCareName || '',
      primaryCarePhone: insuranceData.primaryCarePhone || '',
      isActive: true,
      coverageDetails: insuranceData.coverageDetails || {
        outpatientVisits: true,
        emergencyCare: true,
        hospitalization: true,
        prescription: true,
        preventiveCare: true,
      },
      lastVerified: new Date().toISOString(),
    };

    const insurances = this.getInsurances();
    insurances.push(insurance);
    storageService.set(STORAGE_KEY_INSURANCE, insurances);

    return insurance;
  }

  /**
   * Verify insurance eligibility (simulated call to payer)
   */
  async verifyEligibility(patientId: string, insuranceId: string): Promise<{ eligible: boolean; message: string; details?: any }> {
    const insurance = this.getInsuranceById(insuranceId);
    if (!insurance || insurance.patientId !== patientId) {
      return { eligible: false, message: 'Insurance not found' };
    }

    // Simulate eligibility verification
    const now = new Date();
    const effectiveDate = new Date(insurance.effectiveDate);
    const terminationDate = insurance.terminationDate ? new Date(insurance.terminationDate) : null;

    if (now < effectiveDate) {
      return { eligible: false, message: 'Coverage not yet effective', details: { effectiveDate: insurance.effectiveDate } };
    }

    if (terminationDate && now > terminationDate) {
      return { eligible: false, message: 'Coverage terminated', details: { terminationDate: insurance.terminationDate } };
    }

    return {
      eligible: true,
      message: 'Coverage active',
      details: {
        memberId: insurance.memberId,
        planName: insurance.planName,
        deductibleRemaining: insurance.deductible - insurance.deductibleMet,
        outOfPocketRemaining: insurance.outOfPocketMax - insurance.outOfPocketMet,
      },
    };
  }

  /**
   * Submit prior authorization request
   */
  submitPriorAuth(
    patientId: string,
    medicationName: string,
    dosage: string,
    prescriber: string,
    insuranceId: string,
    reason: PriorAuthorizationRequest['reason'],
    medicalJustification: string,
    clinicalHistory: string
  ): PriorAuthorizationRequest {
    const insurance = this.getInsuranceById(insuranceId);
    if (!insurance) {
      throw new Error('Insurance not found');
    }

    const request: PriorAuthorizationRequest = {
      id: this.generateId(),
      patientId,
      medicationId: this.generateId(),
      medicationName,
      dosage,
      prescriber,
      insuranceId,
      insuranceCompany: insurance.insuranceCompany,
      requestedDate: new Date().toISOString(),
      reason,
      medicalJustification,
      clinicalHistory,
      status: 'SUBMITTED',
    };

    const requests = this.getPriorAuthRequests();
    requests.push(request);
    storageService.set(STORAGE_KEY_PRIOR_AUTH, requests);

    // Simulate approval (80% approval rate)
    setTimeout(() => this.processPriorAuth(request.id), 2000);

    return request;
  }

  /**
   * Get prior authorization status
   */
  getPriorAuthStatus(requestId: string): PriorAuthorizationRequest | null {
    const requests = this.getPriorAuthRequests();
    return requests.find((r) => r.id === requestId) || null;
  }

  /**
   * Check medication coverage and formulary status
   */
  checkMedicationCoverage(medicationName: string, insuranceId: string): MedicationCoverage | null {
    const insurance = this.getInsuranceById(insuranceId);
    if (!insurance) {
      return null;
    }

    // Simulate formulary lookup
    const coverage: MedicationCoverage = {
      medicationName,
      insuranceCompany: insurance.insuranceCompany,
      formulary: 'Standard Formulary',
      tier: Math.floor(Math.random() * 5) + 1,
      requiresPriorAuth: Math.random() > 0.7,
      requiresStepTherapy: Math.random() > 0.8,
      requiresQuantityLimit: Math.random() > 0.9,
      copay: insurance.copay,
      availableAlternatives: ['Generic Alternative 1', 'Generic Alternative 2'],
      lastUpdated: new Date().toISOString(),
    };

    return coverage;
  }

  /**
   * Submit insurance claim
   */
  submitClaim(
    patientId: string,
    serviceDate: string,
    amount: number,
    provider: string,
    serviceDescription: string
  ): InsuranceClaim {
    const claim: InsuranceClaim = {
      id: this.generateId(),
      patientId,
      claimNumber: `CLM${Date.now()}`,
      serviceDate,
      submissionDate: new Date().toISOString(),
      amount,
      amountApproved: 0,
      amountDenied: 0,
      provider,
      serviceDescription,
      status: 'SUBMITTED',
      lastStatusUpdate: new Date().toISOString(),
      applyToDeductible: true,
    };

    const claims = this.getClaims();
    claims.push(claim);
    storageService.set(STORAGE_KEY_CLAIMS, claims);

    // Simulate claim processing
    setTimeout(() => this.processClaim(claim.id), 3000);

    return claim;
  }

  /**
   * Appeal denied claim or prior authorization
   */
  submitAppeal(
    patientId: string,
    claimIdOrPriorAuthId: string,
    reason: 'CLAIM_DENIED' | 'PRIOR_AUTH_DENIED' | 'COVERAGE_DENIED',
    medicalEvidence: string,
    supportingDocuments: string[] = []
  ): InsuranceAppeal {
    const appeal: InsuranceAppeal = {
      id: this.generateId(),
      patientId,
      appealNumber: `APL${Date.now()}`,
      submittedDate: new Date().toISOString(),
      reason,
      supportingDocuments,
      medicalEvidence,
      appealLevel: 1,
      status: 'SUBMITTED',
    };

    if (reason === 'CLAIM_DENIED') {
      appeal.claimId = claimIdOrPriorAuthId;
    } else {
      appeal.priorAuthId = claimIdOrPriorAuthId;
    }

    const appeals = this.getAppeals();
    appeals.push(appeal);
    storageService.set(STORAGE_KEY_APPEALS, appeals);

    return appeal;
  }

  /**
   * Get appeal status
   */
  getAppealStatus(appealId: string): InsuranceAppeal | null {
    const appeals = this.getAppeals();
    return appeals.find((a) => a.id === appealId) || null;
  }

  /**
   * Get patient's insurance information
   */
  getPatientInsurance(patientId: string): InsuranceInfo[] {
    return this.getInsurances().filter((i) => i.patientId === patientId);
  }

  /**
   * Get claims history
   */
  getClaimsHistory(patientId: string): InsuranceClaim[] {
    return this.getClaims().filter((c) => c.patientId === patientId).sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  }

  /**
   * Get EOB (Explanation of Benefits) summary
   */
  getEOBSummary(patientId: string, startDate: string, endDate: string): {
    period: { start: string; end: string };
    totalClaims: number;
    totalCharges: number;
    totalApproved: number;
    totalDenied: number;
    patientResponsibility: number;
    deductibleStatus: { deductible: number; met: number; remaining: number };
  } {
    const claims = this.getClaims().filter(
      (c) =>
        c.patientId === patientId && new Date(c.serviceDate) >= new Date(startDate) && new Date(c.serviceDate) <= new Date(endDate)
    );

    const totalCharges = claims.reduce((sum, c) => sum + c.amount, 0);
    const totalApproved = claims.reduce((sum, c) => sum + c.amountApproved, 0);
    const totalDenied = claims.reduce((sum, c) => sum + c.amountDenied, 0);

    const insurance = this.getPatientInsurance(patientId)[0];

    return {
      period: { start: startDate, end: endDate },
      totalClaims: claims.length,
      totalCharges,
      totalApproved,
      totalDenied,
      patientResponsibility: totalApproved * (insurance?.coinsurance || 20) / 100,
      deductibleStatus: {
        deductible: insurance?.deductible || 500,
        met: insurance?.deductibleMet || 0,
        remaining: (insurance?.deductible || 500) - (insurance?.deductibleMet || 0),
      },
    };
  }

  /**
   * Get prior authorization requests for patient
   */
  getPatientPriorAuths(patientId: string): PriorAuthorizationRequest[] {
    return this.getPriorAuthRequests().filter((r) => r.patientId === patientId);
  }

  /**
   * Private: Process prior authorization
   */
  private processPriorAuth(requestId: string): void {
    const requests = this.getPriorAuthRequests();
    const request = requests.find((r) => r.id === requestId);

    if (!request) {
      return;
    }

    // 80% approval rate
    const approved = Math.random() < 0.8;

    if (approved) {
      request.status = 'APPROVED';
      request.reviewedDate = new Date().toISOString();
      request.approvalDuration = 365; // 1 year
      request.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      request.status = 'DENIED';
      request.denialReason = 'Step therapy required';
      request.denialCode = 'STEP_THERAPY';
    }

    storageService.set(STORAGE_KEY_PRIOR_AUTH, requests);

    // Notify patient
    notificationService.addNotification({
      id: `notif_${Date.now()}`,
      userId: request.patientId,
      title: `Prior Authorization ${request.status}`,
      message: `Your prior authorization for ${request.medicationName} has been ${request.status.toLowerCase()}`,
      date: new Date().toISOString(),
      type: 'SYSTEM',
      isRead: false,
    });
  }

  /**
   * Private: Process claim
   */
  private processClaim(claimId: string): void {
    const claims = this.getClaims();
    const claim = claims.find((c) => c.id === claimId);

    if (!claim) {
      return;
    }

    // 70% approval rate
    const approved = Math.random() < 0.7;

    if (approved) {
      claim.status = 'APPROVED';
      claim.amountApproved = claim.amount * 0.8; // 80% coverage
      claim.amountDenied = claim.amount * 0.2;
      claim.paymentDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      claim.status = 'DENIED';
      claim.denialReason = 'Not covered under current plan';
      claim.denialCode = 'NOT_COVERED';
    }

    claim.lastStatusUpdate = new Date().toISOString();
    storageService.set(STORAGE_KEY_CLAIMS, claims);
  }

  /**
   * Private: Get insurances
   */
  private getInsurances(): InsuranceInfo[] {
    return (storageService.get(STORAGE_KEY_INSURANCE) || []) as InsuranceInfo[];
  }

  /**
   * Private: Get insurance by ID
   */
  private getInsuranceById(insuranceId: string): InsuranceInfo | null {
    return this.getInsurances().find((i) => i.id === insuranceId) || null;
  }

  /**
   * Private: Get prior auth requests
   */
  private getPriorAuthRequests(): PriorAuthorizationRequest[] {
    return (storageService.get(STORAGE_KEY_PRIOR_AUTH) || []) as PriorAuthorizationRequest[];
  }

  /**
   * Private: Get claims
   */
  private getClaims(): InsuranceClaim[] {
    return (storageService.get(STORAGE_KEY_CLAIMS) || []) as InsuranceClaim[];
  }

  /**
   * Private: Get appeals
   */
  private getAppeals(): InsuranceAppeal[] {
    return (storageService.get(STORAGE_KEY_APPEALS) || []) as InsuranceAppeal[];
  }

  /**
   * Private: Generate ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const insuranceAuthorizationService = new InsuranceAuthorizationService();
