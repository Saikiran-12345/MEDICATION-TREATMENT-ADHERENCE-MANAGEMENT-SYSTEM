// ============================================================
// Print Layout and Template Generator Utilities
// Print CSS configurations, template structures, browser printing dialog triggers.
// ============================================================

import type { Patient, Treatment } from '../types';

// Declare localized interfaces since they are introduced in a later phase (Phase E)
export interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  priority: number;
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medicationId: string;
  prescribedBy: string; // staffId
  prescribedDate: string;
  dosage: string;
  instructions: string;
  quantity: number;
  refillsAllowed: number;
  refillsUsed: number;
  pharmacyId?: string;
  expiryDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  notes?: string;
}

export const PRINT_STYLES = `
  @media print {
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: 0;
      margin: 1.5cm;
    }
    a { text-decoration: none; color: #000; }
    .no-print { display: none !important; }
    .page-break { page-break-after: always; }
    .header { border-bottom: 2px solid #1a365d; padding-bottom: 15px; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #1a365d; font-size: 24pt; font-weight: bold; }
    .header p { margin: 5px 0 0 0; color: #4a5568; font-size: 11pt; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 40px; font-size: 9pt; color: #718096; position: fixed; bottom: 0; left: 0; right: 0; }
    .footer p { margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { border-bottom: 2px solid #e2e8f0; padding: 10px; text-align: left; font-weight: bold; background-color: #f7fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    td { border-bottom: 1px solid #e2e8f0; padding: 10px; }
    .section-title { font-size: 14pt; font-weight: bold; color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin: 30px 0 15px 0; }
    .card { border: 1px solid #cbd5e0; padding: 15px; border-radius: 4px; margin-bottom: 20px; page-break-inside: avoid; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .disclaimer { font-style: italic; font-size: 8pt; color: #a0aec0; margin-top: 20px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; }
  }
`;

/**
 * Generate print layout header with custom title.
 */
export function generatePrintHeader(title: string, subtitle: string = ''): string {
  const subtitleHtml = subtitle ? `<p>${subtitle}</p>` : '';
  return `
    <div class="header">
      <h1>${title}</h1>
      <p>MTAMS - Medication & Treatment Adherence Management System</p>
      ${subtitleHtml}
    </div>
  `;
}

/**
 * Generate page break tag.
 */
export function addPageBreak(): string {
  return '<div class="page-break"></div>';
}

/**
 * Generate footer disclaimer block required for safety compliance.
 */
export function generatePrintFooter(): string {
  const dateStr = new Date().toLocaleString();
  return `
    <div class="footer">
      <p>Printed on: ${dateStr} | Generated from MTAMS Client App</p>
      <div class="disclaimer">
        <strong>Medical Disclaimer:</strong> This document is for educational/demo purposes and must NOT replace a medical professional. If you are experiencing a medical emergency, please contact local emergency services immediately.
      </div>
    </div>
  `;
}

/**
 * Generate formatted HTML table for printable views.
 */
export function generatePrintTable(headers: string[], rows: string[][]): string {
  const headHtml = headers.map(h => `<th>${h}</th>`).join('');
  const rowsHtml = rows.map(row => {
    const cells = row.map(cell => `<td>${cell || ''}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <table>
      <thead>
        <tr>${headHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

/**
 * Generate complete patient summaries as formatted HTML.
 */
export function generatePatientSummaryHtml(patient: Patient, treatments: Treatment[], vitals: any[] = []): string {
  const header = generatePrintHeader(`Patient Health Summary: ${patient.name}`, `Patient ID: ${patient.id}`);
  
  const treatmentsRows = treatments.map(t => [
    t.name,
    t.startDate,
    t.endDate || 'Ongoing',
    t.status
  ]);
  const treatmentsTable = generatePrintTable(
    ['Treatment Plan', 'Start Date', 'End Date', 'Status'],
    treatmentsRows
  );

  const vitalsRows = vitals.map(v => [
    v.type ? String(v.type).replace('_', ' ') : '',
    v.secondaryValue ? `${v.value}/${v.secondaryValue}` : `${v.value}`,
    v.unit || '',
    v.recordedAt ? new Date(v.recordedAt).toLocaleString() : ''
  ]);
  
  const vitalsTable = vitals.length > 0 
    ? `
      <div class="section-title">Recorded Vitals</div>
      ${generatePrintTable(['Vital Type', 'Value', 'Unit', 'Recorded At'], vitalsRows)}
    `
    : '<p>No vital logs recorded.</p>';

  const footer = generatePrintFooter();

  return `
    <html>
      <head>
        <title>Patient Summary - ${patient.name}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        ${header}
        <div class="grid">
          <div class="card">
            <h3>Demographics</h3>
            <p><strong>Name:</strong> ${patient.name}</p>
            <p><strong>Age:</strong> ${patient.age}</p>
            <p><strong>Gender:</strong> ${patient.gender}</p>
            <p><strong>Status:</strong> ${patient.status}</p>
          </div>
          <div class="card">
            <h3>Contact Information</h3>
            <p><strong>Phone:</strong> ${patient.contactInfo ? patient.contactInfo.phone : ''}</p>
            <p><strong>Email:</strong> ${patient.contactInfo ? patient.contactInfo.email : ''}</p>
          </div>
        </div>
        
        <div class="section-title">Active Treatments</div>
        ${treatmentsTable}
        
        ${vitalsTable}
        ${footer}
      </body>
    </html>
  `;
}

/**
 * Generate formatted HTML layout for patient pocket prescription cards.
 */
export function generatePrescriptionCardHtml(prescription: Prescription, medicationName: string): string {
  const header = generatePrintHeader(`Prescription Card`, `Prescription Ref: ${prescription.id}`);
  const footer = generatePrintFooter();

  return `
    <html>
      <head>
        <title>Prescription Card - ${prescription.id}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        ${header}
        <div class="card" style="border: 2px dashed #4a5568; max-width: 500px; margin: 0 auto; padding: 25px;">
          <h2 style="margin-top:0; color:#2b6cb0;">${medicationName}</h2>
          <hr style="border: 0; border-top: 1px solid #cbd5e0; margin: 15px 0;" />
          <p><strong>Dosage:</strong> ${prescription.dosage}</p>
          <p><strong>Instructions:</strong> ${prescription.instructions}</p>
          <p><strong>Quantity:</strong> ${prescription.quantity} units</p>
          <p><strong>Refills Remaining:</strong> ${prescription.refillsAllowed - prescription.refillsUsed} (of ${prescription.refillsAllowed})</p>
          <p><strong>Expiry Date:</strong> ${prescription.expiryDate}</p>
          <p><strong>Status:</strong> ${prescription.status}</p>
        </div>
        ${footer}
      </body>
    </html>
  `;
}

/**
 * Generate formatted printable Wallet emergency contact cards.
 */
export function generateEmergencyCardHtml(patientName: string, contacts: EmergencyContact[]): string {
  const header = generatePrintHeader(`Emergency Care Info Card`, `Patient: ${patientName}`);
  const footer = generatePrintFooter();

  const contactsRows = contacts.map(c => [
    c.name,
    c.relationship,
    c.phone,
    c.isPrimary ? 'Yes' : 'No'
  ]);
  const contactsTable = generatePrintTable(
    ['Contact Name', 'Relationship', 'Phone Number', 'Primary Contact'],
    contactsRows
  );

  return `
    <html>
      <head>
        <title>Emergency Care Card - ${patientName}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        ${header}
        <div class="card" style="border: 3px double #e53e3e; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h3 style="margin-top: 0; color: #e53e3e; text-align: center;">IN CASE OF EMERGENCY (ICE)</h3>
          ${contactsTable}
        </div>
        ${footer}
      </body>
    </html>
  `;
}

/**
 * Open print window dialog and populate with content.
 */
export function printContent(htmlContent: string): void {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait short duration to ensure content renders completely before print dialog appears
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 350);
}
