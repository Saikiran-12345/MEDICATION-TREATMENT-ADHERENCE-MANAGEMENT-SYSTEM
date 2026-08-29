// ============================================================
// CSV Data Processing Utilities
// Generates, parses, escapes, downloads CSV records, and has predefined schema configurations.
// ============================================================

export interface CsvColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => any);
  format?: (value: any) => string;
}

/**
 * Escape values according to RFC 4180 CSV specifications.
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Generate CSV string from structured rows and columns.
 */
export function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  if (!columns || columns.length === 0) return '';
  
  const headerRow = columns.map(col => escapeCsvValue(col.header)).join(',');
  const dataRows = data.map(row => {
    return columns.map(col => {
      let rawVal: any;
      if (typeof col.accessor === 'function') {
        rawVal = col.accessor(row);
      } else {
        rawVal = row[col.accessor];
      }
      
      const formattedVal = col.format ? col.format(rawVal) : rawVal;
      return escapeCsvValue(formattedVal);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Download CSV file in browser environment.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  // Check if we are in browser
  if (typeof window === 'undefined' || !window.document) return;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Utility to generate and download CSV file in one step.
 */
export function exportToCsv<T>(data: T[], columns: CsvColumn<T>[], filename: string): void {
  const csv = generateCsv(data, columns);
  downloadCsv(csv, filename);
}

/**
 * Parse standard raw CSV text into a 2D string array.
 */
export function parseCsv(csvString: string): string[][] {
  if (!csvString) return [];

  const result: string[][] = [];
  let row: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvString.length; i++) {
    const char = csvString[i];
    const nextChar = csvString[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // Skip next double quote
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentVal);
        currentVal = '';
      } else if (char === '\r' || char === '\n') {
        row.push(currentVal);
        currentVal = '';
        if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
          result.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n in \r\n
        }
      } else {
        currentVal += char;
      }
    }
  }

  // Handle final value and row if file doesn't end in newline
  if (currentVal || row.length > 0) {
    row.push(currentVal);
    result.push(row);
  }

  return result;
}

/**
 * Parse CSV text into an array of records using the first line as headers.
 */
export function parseCsvToObjects(csvString: string): Record<string, string>[] {
  const lines = parseCsv(csvString);
  if (lines.length <= 1) return [];

  const headers = lines[0].map(h => h.trim());
  const objects: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] !== undefined ? values[index] : '';
    });
    objects.push(obj);
  }

  return objects;
}

/**
 * Validate that a CSV structure has all required headers.
 */
export function validateCsvStructure(csvString: string, requiredHeaders: string[]): { valid: boolean; missingHeaders: string[] } {
  const lines = parseCsv(csvString);
  if (lines.length === 0) {
    return { valid: false, missingHeaders: requiredHeaders };
  }

  const headers = lines[0].map(h => h.trim().toLowerCase());
  const missingHeaders = requiredHeaders.filter(
    req => !headers.includes(req.toLowerCase())
  );

  return {
    valid: missingHeaders.length === 0,
    missingHeaders,
  };
}

// ============================================================
// Predefined Configurations
// Column mappings for standard application exports
// ============================================================

export const PATIENT_CSV_COLUMNS: CsvColumn<any>[] = [
  { header: 'Patient ID', accessor: 'id' },
  { header: 'Full Name', accessor: 'name' },
  { header: 'Age', accessor: 'age' },
  { header: 'Gender', accessor: 'gender' },
  { header: 'Phone Number', accessor: 'phone' },
  { header: 'Email Address', accessor: 'email' },
  { header: 'Status', accessor: 'status' },
  { header: 'Registration Date', accessor: 'createdAt' },
];

export const TREATMENT_CSV_COLUMNS: CsvColumn<any>[] = [
  { header: 'Treatment ID', accessor: 'id' },
  { header: 'Patient ID', accessor: 'patientId' },
  { header: 'Treatment Name', accessor: 'name' },
  { header: 'Condition', accessor: 'condition' },
  { header: 'Start Date', accessor: 'startDate' },
  { header: 'End Date', accessor: 'endDate' },
  { header: 'Status', accessor: 'status' },
];

export const DOSE_CSV_COLUMNS: CsvColumn<any>[] = [
  { header: 'Dose ID', accessor: 'id' },
  { header: 'Schedule ID', accessor: 'scheduleId' },
  { header: 'Due Date', accessor: 'dueDate' },
  { header: 'Due Time', accessor: 'dueTime' },
  { header: 'Taken At', accessor: 'takenAt' },
  { header: 'Status', accessor: 'status' },
  { header: 'Notes', accessor: 'notes' },
];

export const VITAL_CSV_COLUMNS: CsvColumn<any>[] = [
  { header: 'Vital ID', accessor: 'id' },
  { header: 'Patient ID', accessor: 'patientId' },
  { header: 'Vital Type', accessor: 'type' },
  { header: 'Value', accessor: 'value' },
  { header: 'Secondary Value', accessor: 'secondaryValue' },
  { header: 'Unit', accessor: 'unit' },
  { header: 'Recorded At', accessor: 'recordedAt' },
  { header: 'Recorded By', accessor: 'recordedBy' },
];

export const LAB_RESULT_CSV_COLUMNS: CsvColumn<any>[] = [
  { header: 'Lab ID', accessor: 'id' },
  { header: 'Patient ID', accessor: 'patientId' },
  { header: 'Test Name', accessor: 'testName' },
  { header: 'Category', accessor: 'category' },
  { header: 'Value', accessor: 'value' },
  { header: 'Unit', accessor: 'unit' },
  { header: 'Collected Date', accessor: 'collectedDate' },
  { header: 'Abnormal Flag', accessor: 'isAbnormal', format: val => val ? 'Yes' : 'No' },
];

export const PRESCRIPTION_CSV_COLUMNS: CsvColumn<any>[] = [
  { header: 'Prescription ID', accessor: 'id' },
  { header: 'Patient ID', accessor: 'patientId' },
  { header: 'Medication ID', accessor: 'medicationId' },
  { header: 'Dosage', accessor: 'dosage' },
  { header: 'Refills Remaining', accessor: 'refillsAllowed' },
  { header: 'Status', accessor: 'status' },
  { header: 'Expiry Date', accessor: 'expiryDate' },
];
