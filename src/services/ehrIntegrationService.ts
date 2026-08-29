/**
 * EHR Integration Service
 * Handles integration with external EHR systems using HL7/FHIR standards
 */

import { storageService } from './storageService';
import { patientService } from './patientService';
import { medicationService } from './medicationService';
import { labResultService } from './labResultService';
import { vitalsService } from './vitalsService';

const STORAGE_KEY_CONNECTIONS = 'ehr_connections';
const STORAGE_KEY_SYNC_LOG = 'ehr_sync_log';
const STORAGE_KEY_MAPPINGS = 'ehr_field_mappings';

interface EHRConnection {
  id: string;
  name: string;
  type: 'HL7V2' | 'HL7V3' | 'FHIR_REST' | 'DIRECT' | 'CCD';
  endpoint: string;
  authType: 'OAUTH2' | 'BASIC' | 'MTLS' | 'API_KEY';
  credentials?: {
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    certificate?: string;
  };
  isActive: boolean;
  syncFrequency: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MANUAL';
  bidirectional: boolean;
  dataElements: string[];
  createdAt: string;
  lastSyncAt?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  errorMessage?: string;
}

interface EHRSyncLog {
  id: string;
  connectionId: string;
  syncType: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: Array<{
    recordId: string;
    errorMessage: string;
    errorCode: string;
  }>;
  syncDetails: {
    patientsSync: number;
    medicationsSync: number;
    labResultsSync: number;
    vitalsSync: number;
    appointmentsSync: number;
    diagnosticsSync: number;
  };
}

interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{ system: string; value: string }>;
  name: Array<{ use: string; family: string; given: string[] }>;
  telecom: Array<{ system: 'phone' | 'email'; value: string }>;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  address: Array<{ use: string; type: string; line: string[]; city: string; state: string; postalCode: string; country: string }>;
  contact: Array<{ relationship: Array<{ text: string }>; name: { text: string }; telecom: Array<{ system: string; value: string }> }>;
  generalPractitioner: Array<{ reference: string }>;
  managingOrganization: { reference: string };
}

interface FHIRMedication {
  resourceType: 'Medication';
  id: string;
  code: { coding: Array<{ system: string; code: string; display: string }> };
  status: 'active' | 'inactive' | 'entered-in-error';
  manufacturer: { reference: string };
  form: { coding: Array<{ system: string; code: string }> };
  ingredient: Array<{ item: { reference: string }; strength: { numerator: { value: number; unit: string } } }>;
}

interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'on-hold' | 'cancelled' | 'completed';
  intent: string;
  medicationReference: { reference: string };
  subject: { reference: string };
  authoredOn: string;
  requester: { reference: string };
  dosageInstruction: Array<{ text: string; timing: { repeat: { frequency: number; period: number; periodUnit: string } }; route: { coding: Array<{ code: string }> } }>;
}

interface HL7Message {
  type: string; // MSH, ADT, ORU, etc.
  version: string; // 2.3, 2.4, 2.5
  messageId: string;
  sendingApplication: string;
  receivingApplication: string;
  timestamp: string;
  segments: Record<string, string[][]>;
}

interface MedicationReconciliation {
  patientId: string;
  ehrMedications: string[];
  ourMedications: string[];
  discrepancies: Array<{
    medication: string;
    source: 'EHR' | 'LOCAL' | 'BOTH';
    reason: string;
    resolved: boolean;
  }>;
  reconciliedAt: string;
  reconciliedBy: string;
}

class EHRIntegrationService {
  /**
   * Create EHR connection
   */
  createConnection(
    name: string,
    type: 'HL7V2' | 'HL7V3' | 'FHIR_REST' | 'DIRECT' | 'CCD',
    endpoint: string,
    authType: 'OAUTH2' | 'BASIC' | 'MTLS' | 'API_KEY',
    credentials: any,
    dataElements: string[] = ['PATIENTS', 'MEDICATIONS', 'LAB_RESULTS', 'VITALS']
  ): EHRConnection {
    const connection: EHRConnection = {
      id: this.generateId(),
      name,
      type,
      endpoint,
      authType,
      credentials,
      isActive: false,
      syncFrequency: 'DAILY',
      bidirectional: true,
      dataElements,
      createdAt: new Date().toISOString(),
      status: 'DISCONNECTED',
    };

    const connections = this.getConnections();
    connections.push(connection);
    storageService.set(STORAGE_KEY_CONNECTIONS, connections);

    return connection;
  }

  /**
   * Test EHR connection
   */
  async testConnection(connectionId: string): Promise<{ success: boolean; message: string }> {
    const connection = this.getConnectionById(connectionId);
    if (!connection) {
      return { success: false, message: 'Connection not found' };
    }

    try {
      // Simulate connection test
      const isConnected = Math.random() > 0.2; // 80% success rate

      if (isConnected) {
        connection.status = 'CONNECTED';
        connection.errorMessage = undefined;
      } else {
        connection.status = 'ERROR';
        connection.errorMessage = 'Network timeout';
      }

      this.updateConnection(connectionId, connection);
      return { success: isConnected, message: isConnected ? 'Connected successfully' : 'Connection failed' };
    } catch (error) {
      connection.status = 'ERROR';
      connection.errorMessage = String(error);
      this.updateConnection(connectionId, connection);
      return { success: false, message: String(error) };
    }
  }

  /**
   * Activate EHR connection
   */
  activateConnection(connectionId: string): boolean {
    const connection = this.getConnectionById(connectionId);
    if (!connection) {
      return false;
    }

    connection.isActive = true;
    return this.updateConnection(connectionId, connection);
  }

  /**
   * Deactivate EHR connection
   */
  deactivateConnection(connectionId: string): boolean {
    const connection = this.getConnectionById(connectionId);
    if (!connection) {
      return false;
    }

    connection.isActive = false;
    return this.updateConnection(connectionId, connection);
  }

  /**
   * Sync data from EHR (inbound)
   */
  async syncFromEHR(connectionId: string): Promise<EHRSyncLog> {
    const connection = this.getConnectionById(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not available');
    }

    const syncLog: EHRSyncLog = {
      id: this.generateId(),
      connectionId,
      syncType: 'INBOUND',
      status: 'IN_PROGRESS',
      startTime: new Date().toISOString(),
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
      syncDetails: {
        patientsSync: 0,
        medicationsSync: 0,
        labResultsSync: 0,
        vitalsSync: 0,
        appointmentsSync: 0,
        diagnosticsSync: 0,
      },
    };

    try {
      // Simulate data retrieval from EHR
      if (connection.dataElements.includes('PATIENTS')) {
        syncLog.syncDetails.patientsSync = this.simulatePatientSync();
      }

      if (connection.dataElements.includes('MEDICATIONS')) {
        syncLog.syncDetails.medicationsSync = this.simulateMedicationSync();
      }

      if (connection.dataElements.includes('LAB_RESULTS')) {
        syncLog.syncDetails.labResultsSync = this.simulateLabResultSync();
      }

      if (connection.dataElements.includes('VITALS')) {
        syncLog.syncDetails.vitalsSync = this.simulateVitalsSync();
      }

      syncLog.recordsProcessed = Object.values(syncLog.syncDetails).reduce((a, b) => a + b, 0);
      syncLog.recordsSuccessful = Math.floor(syncLog.recordsProcessed * 0.95);
      syncLog.recordsFailed = syncLog.recordsProcessed - syncLog.recordsSuccessful;

      syncLog.status = syncLog.recordsFailed === 0 ? 'SUCCESS' : 'PARTIAL';
      syncLog.endTime = new Date().toISOString();

      connection.lastSyncAt = syncLog.endTime;
      this.updateConnection(connectionId, connection);
    } catch (error) {
      syncLog.status = 'FAILED';
      syncLog.errors.push({
        recordId: 'SYNC_GENERAL',
        errorMessage: String(error),
        errorCode: 'EHR_SYNC_ERROR',
      });
    }

    this.logSync(syncLog);
    return syncLog;
  }

  /**
   * Sync data to EHR (outbound)
   */
  async syncToEHR(connectionId: string, dataType: string): Promise<EHRSyncLog> {
    const connection = this.getConnectionById(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not available');
    }

    const syncLog: EHRSyncLog = {
      id: this.generateId(),
      connectionId,
      syncType: 'OUTBOUND',
      status: 'IN_PROGRESS',
      startTime: new Date().toISOString(),
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
      syncDetails: {
        patientsSync: 0,
        medicationsSync: 0,
        labResultsSync: 0,
        vitalsSync: 0,
        appointmentsSync: 0,
        diagnosticsSync: 0,
      },
    };

    try {
      // Simulate outbound sync
      switch (dataType) {
        case 'ADHERENCE_DATA':
          syncLog.syncDetails.appointmentsSync = 5;
          break;
        case 'CLINICAL_OUTCOMES':
          syncLog.syncDetails.labResultsSync = 3;
          break;
        case 'MEDICATION_UPDATES':
          syncLog.syncDetails.medicationsSync = 8;
          break;
      }

      syncLog.recordsProcessed = Object.values(syncLog.syncDetails).reduce((a, b) => a + b, 0);
      syncLog.recordsSuccessful = syncLog.recordsProcessed;

      syncLog.status = 'SUCCESS';
      syncLog.endTime = new Date().toISOString();

      connection.lastSyncAt = syncLog.endTime;
      this.updateConnection(connectionId, connection);
    } catch (error) {
      syncLog.status = 'FAILED';
      syncLog.errors.push({
        recordId: 'SYNC_GENERAL',
        errorMessage: String(error),
        errorCode: 'EHR_SYNC_ERROR',
      });
    }

    this.logSync(syncLog);
    return syncLog;
  }

  /**
   * Medication reconciliation
   */
  medicationReconciliation(patientId: string): MedicationReconciliation {
    // Get our medications
    const ourMeds = ['Lisinopril 10mg', 'Metformin 500mg', 'Aspirin 81mg'];

    // Simulate getting EHR medications
    const ehrMeds = ['Lisinopril 10mg', 'Atorvastatin 20mg', 'Aspirin 81mg'];

    const reconciliation: MedicationReconciliation = {
      patientId,
      ehrMedications: ehrMeds,
      ourMedications: ourMeds,
      discrepancies: [
        {
          medication: 'Metformin 500mg',
          source: 'LOCAL',
          reason: 'In our system but not in EHR',
          resolved: false,
        },
        {
          medication: 'Atorvastatin 20mg',
          source: 'EHR',
          reason: 'In EHR but not in our system',
          resolved: false,
        },
      ],
      reconciliedAt: new Date().toISOString(),
      reconciliedBy: 'system',
    };

    return reconciliation;
  }

  /**
   * Export to FHIR format
   */
  exportToFHIR(patientId: string): FHIRPatient | null {
    // Simulate patient export to FHIR
    const fhirPatient: FHIRPatient = {
      resourceType: 'Patient',
      id: patientId,
      identifier: [
        {
          system: 'http://example.com/mrn',
          value: `MRN-${patientId}`,
        },
      ],
      name: [
        {
          use: 'official',
          family: 'Doe',
          given: ['John'],
        },
      ],
      telecom: [
        { system: 'phone', value: '555-1234' },
        { system: 'email', value: 'john@example.com' },
      ],
      birthDate: '1980-01-01',
      gender: 'male',
      address: [
        {
          use: 'home',
          type: 'physical',
          line: ['123 Main St'],
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'USA',
        },
      ],
      contact: [],
      generalPractitioner: [{ reference: 'Practitioner/dr-smith' }],
      managingOrganization: { reference: 'Organization/clinic-1' },
    };

    return fhirPatient;
  }

  /**
   * Import from FHIR format
   */
  importFromFHIR(fhirPatient: FHIRPatient): boolean {
    try {
      // Validate FHIR resource
      if (!fhirPatient.resourceType || fhirPatient.resourceType !== 'Patient') {
        return false;
      }

      // Process FHIR patient data
      const patientData = {
        id: fhirPatient.id,
        name: fhirPatient.name?.[0]?.family || 'Unknown',
        age: new Date().getFullYear() - new Date(fhirPatient.birthDate).getFullYear(),
        gender: fhirPatient.gender || 'unknown',
        contactInfo: {
          phone: fhirPatient.telecom?.find((t) => t.system === 'phone')?.value || '',
          email: fhirPatient.telecom?.find((t) => t.system === 'email')?.value || '',
          address: fhirPatient.address?.[0]?.line?.join(', ') || '',
        },
        registrationDate: new Date().toISOString(),
        assignedStaffId: 'staff_1',
        status: 'ACTIVE' as const,
      };

      return true;
    } catch (error) {
      console.error('FHIR import error:', error);
      return false;
    }
  }

  /**
   * Generate HL7 message
   */
  generateHL7Message(messageType: string, patientId: string): HL7Message {
    const message: HL7Message = {
      type: messageType,
      version: '2.5',
      messageId: this.generateId(),
      sendingApplication: 'MedicationAdherence',
      receivingApplication: 'EHRSystem',
      timestamp: new Date().toISOString(),
      segments: {
        MSH: [
          [
            'MSH',
            '^~\\&',
            'MedicationAdherence',
            'CLINIC_1',
            'EHRSystem',
            'EHR_CLINIC',
            new Date().toISOString(),
            '',
            messageType,
            this.generateId(),
            'P',
            '2.5',
          ],
        ],
        PID: [
          ['PID', '', patientId, 'MRN_' + patientId, '', 'Doe^John'],
        ],
      },
    };

    return message;
  }

  /**
   * Parse HL7 message
   */
  parseHL7Message(hl7Text: string): HL7Message | null {
    try {
      const lines = hl7Text.split('\r');
      const message: HL7Message = {
        type: '',
        version: '',
        messageId: '',
        sendingApplication: '',
        receivingApplication: '',
        timestamp: '',
        segments: {},
      };

      for (const line of lines) {
        const parts = line.split('|');
        const segmentType = parts[0];

        if (!message.segments[segmentType]) {
          message.segments[segmentType] = [];
        }
        message.segments[segmentType].push(parts);

        if (segmentType === 'MSH') {
          message.version = parts[11] || '';
          message.messageId = parts[9] || '';
          message.sendingApplication = parts[2] || '';
          message.receivingApplication = parts[4] || '';
          message.type = parts[8] || '';
        }
      }

      return message;
    } catch (error) {
      console.error('HL7 parsing error:', error);
      return null;
    }
  }

  /**
   * Get all connections
   */
  getConnections(): EHRConnection[] {
    return (storageService.get(STORAGE_KEY_CONNECTIONS) || []) as EHRConnection[];
  }

  /**
   * Get connection by ID
   */
  getConnectionById(connectionId: string): EHRConnection | null {
    const connections = this.getConnections();
    return connections.find((c) => c.id === connectionId) || null;
  }

  /**
   * Get sync logs
   */
  getSyncLogs(connectionId?: string): EHRSyncLog[] {
    const logs = (storageService.get(STORAGE_KEY_SYNC_LOG) || []) as EHRSyncLog[];
    if (connectionId) {
      return logs.filter((l) => l.connectionId === connectionId);
    }
    return logs;
  }

  /**
   * Private: Update connection
   */
  private updateConnection(connectionId: string, updated: EHRConnection): boolean {
    const connections = this.getConnections();
    const index = connections.findIndex((c) => c.id === connectionId);

    if (index < 0) {
      return false;
    }

    connections[index] = updated;
    storageService.set(STORAGE_KEY_CONNECTIONS, connections);
    return true;
  }

  /**
   * Private: Log sync
   */
  private logSync(log: EHRSyncLog): void {
    const logs = (storageService.get(STORAGE_KEY_SYNC_LOG) || []) as EHRSyncLog[];
    logs.push(log);
    storageService.set(STORAGE_KEY_SYNC_LOG, logs.slice(-1000)); // Keep last 1000
  }

  /**
   * Private: Simulate patient sync
   */
  private simulatePatientSync(): number {
    return Math.floor(Math.random() * 20) + 5;
  }

  /**
   * Private: Simulate medication sync
   */
  private simulateMedicationSync(): number {
    return Math.floor(Math.random() * 15) + 3;
  }

  /**
   * Private: Simulate lab result sync
   */
  private simulateLabResultSync(): number {
    return Math.floor(Math.random() * 10) + 2;
  }

  /**
   * Private: Simulate vitals sync
   */
  private simulateVitalsSync(): number {
    return Math.floor(Math.random() * 50) + 10;
  }

  /**
   * Private: Generate ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const ehrIntegrationService = new EHRIntegrationService();
