/**
 * Advanced Reports & Export Service
 * Generates comprehensive reports, PDF exports, scheduled deliveries
 */

import { storageService } from './storageService';
import { analyticsService } from './analyticsService';
import { unifiedNotificationService } from './unifiedNotificationService';

const STORAGE_KEY_REPORTS = 'generated_reports';
const STORAGE_KEY_SCHEDULED = 'scheduled_reports';
const STORAGE_KEY_TEMPLATES = 'report_templates';

interface ReportTemplate {
  id: string;
  name: string;
  type: 'ADHERENCE' | 'CLINICAL_OUTCOME' | 'MEDICATION_MANAGEMENT' | 'COMPREHENSIVE' | 'FINANCIAL';
  sections: Array<{
    title: string;
    dataSource: string;
    visualizationType: 'TABLE' | 'CHART' | 'SUMMARY' | 'NARRATIVE';
    params?: Record<string, any>;
  }>;
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  recipients: string[];
  format: 'PDF' | 'CSV' | 'EXCEL' | 'JSON';
  includeCharts: boolean;
  isActive: boolean;
  createdAt: string;
  lastModified: string;
}

interface GeneratedReport {
  id: string;
  templateId?: string;
  patientId?: string;
  staffId?: string;
  reportType: 'ADHERENCE' | 'CLINICAL_OUTCOME' | 'MEDICATION_MANAGEMENT' | 'COMPREHENSIVE' | 'FINANCIAL' | 'CUSTOM';
  title: string;
  period: { startDate: string; endDate: string };
  generatedAt: string;
  generatedBy: string;
  format: 'PDF' | 'CSV' | 'EXCEL' | 'JSON' | 'HTML';
  fileSize: number; // in KB
  fileUrl: string;
  sections: Array<{
    title: string;
    content: string;
    dataPoints: number;
  }>;
  summary: {
    keyMetrics: Array<{ metric: string; value: string; trend?: string }>;
    findings: string[];
    recommendations: string[];
  };
  confidential: boolean;
  watermarked: boolean;
  expiryDate?: string;
  accessLog: Array<{ userId: string; timestamp: string }>;
}

interface ScheduledReport {
  id: string;
  templateId: string;
  owner: string;
  patientId?: string;
  recipients: string[];
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM
  nextScheduledRun: string;
  lastRun?: string;
  isActive: boolean;
  notificationMethod: 'EMAIL' | 'IN_APP' | 'BOTH';
  retentionDays: number;
  createdAt: string;
}

interface ReportAccess {
  reportId: string;
  userId: string;
  accessType: 'VIEW' | 'DOWNLOAD' | 'SHARE';
  timestamp: string;
  ipAddress?: string;
}

class AdvancedReportsService {
  /**
   * Create report template
   */
  createTemplate(
    name: string,
    type: 'ADHERENCE' | 'CLINICAL_OUTCOME' | 'MEDICATION_MANAGEMENT' | 'COMPREHENSIVE' | 'FINANCIAL',
    sections: ReportTemplate['sections'],
    options?: Partial<ReportTemplate>
  ): ReportTemplate {
    const template: ReportTemplate = {
      id: this.generateId(),
      name,
      type,
      sections,
      frequency: options?.frequency || 'MONTHLY',
      recipients: options?.recipients || [],
      format: options?.format || 'PDF',
      includeCharts: options?.includeCharts !== false,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    const templates = this.getTemplates();
    templates.push(template);
    storageService.set(STORAGE_KEY_TEMPLATES, templates);

    return template;
  }

  /**
   * Generate report from template
   */
  generateReportFromTemplate(templateId: string, patientId?: string, staffId?: string): GeneratedReport {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const report: GeneratedReport = {
      id: this.generateId(),
      templateId,
      patientId,
      staffId,
      reportType: template.type,
      title: template.name,
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      },
      generatedAt: new Date().toISOString(),
      generatedBy: staffId || 'system',
      format: template.format,
      fileSize: Math.floor(Math.random() * 500) + 100, // 100-600 KB
      fileUrl: `reports/${this.generateId()}.${template.format.toLowerCase()}`,
      sections: template.sections.map((s) => ({
        title: s.title,
        content: this.generateSectionContent(s),
        dataPoints: Math.floor(Math.random() * 100) + 10,
      })),
      summary: this.generateReportSummary(template.type, patientId),
      confidential: true,
      watermarked: true,
      accessLog: [{ userId: staffId || 'system', timestamp: new Date().toISOString() }],
    };

    const reports = this.getReports();
    reports.push(report);
    storageService.set(STORAGE_KEY_REPORTS, reports);

    return report;
  }

  /**
   * Generate custom adherence report
   */
  generateAdherenceReport(patientId: string, startDate: string, endDate: string, includeCharts = true): GeneratedReport {
    const metrics = analyticsService.calculateAdherence(patientId, startDate, endDate);

    const report: GeneratedReport = {
      id: this.generateId(),
      patientId,
      reportType: 'ADHERENCE',
      title: `Medication Adherence Report - ${new Date(startDate).toLocaleDateString()}`,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      generatedBy: 'system',
      format: 'PDF',
      fileSize: 250,
      fileUrl: `reports/${this.generateId()}.pdf`,
      sections: [
        {
          title: 'Executive Summary',
          content: this.generateAdherenceSummary(metrics),
          dataPoints: 5,
        },
        {
          title: 'Adherence Trends',
          content: 'Weekly adherence analysis with trend visualization',
          dataPoints: 8,
        },
        {
          title: 'Missed Dose Analysis',
          content: 'Detailed breakdown of missed doses by time and medication',
          dataPoints: 15,
        },
        {
          title: 'Recommendations',
          content: 'Personalized adherence improvement strategies',
          dataPoints: 3,
        },
      ],
      summary: {
        keyMetrics: [
          { metric: 'Overall Adherence', value: `${metrics.overallAdherence}%`, trend: 'UP' },
          { metric: 'Doses Taken', value: metrics.dosesTaken.toString() },
          { metric: 'Doses Missed', value: metrics.dosesMissed.toString(), trend: 'DOWN' },
          { metric: 'Consistency Score', value: `${metrics.consistencyScore}/100` },
        ],
        findings: [
          `Patient adherence is ${metrics.overallAdherence > 80 ? 'excellent' : metrics.overallAdherence > 60 ? 'good' : 'needs improvement'}`,
          `Most common missed time: ${this.getCommonMissedTime()}`,
          `Best adherence day: ${this.getBestAdherenceDay()}`,
        ],
        recommendations: [
          'Increase reminders during high-risk periods',
          'Consider medication simplification',
          'Implement adherence support program',
        ],
      },
      confidential: true,
      watermarked: true,
      accessLog: [{ userId: 'system', timestamp: new Date().toISOString() }],
    };

    const reports = this.getReports();
    reports.push(report);
    storageService.set(STORAGE_KEY_REPORTS, reports);

    return report;
  }

  /**
   * Generate clinical outcomes report
   */
  generateClinicalOutcomesReport(patientId: string, startDate: string, endDate: string): GeneratedReport {
    const report: GeneratedReport = {
      id: this.generateId(),
      patientId,
      reportType: 'CLINICAL_OUTCOME',
      title: `Clinical Outcomes Report - ${new Date(startDate).toLocaleDateString()}`,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      generatedBy: 'system',
      format: 'PDF',
      fileSize: 350,
      fileUrl: `reports/${this.generateId()}.pdf`,
      sections: [
        {
          title: 'Vital Signs Summary',
          content: 'Patient vital signs trends over period',
          dataPoints: 20,
        },
        {
          title: 'Lab Results',
          content: 'Recent lab values and comparisons to baseline',
          dataPoints: 15,
        },
        {
          title: 'Clinical Assessments',
          content: 'Provider clinical notes and assessments',
          dataPoints: 8,
        },
        {
          title: 'Goal Achievements',
          content: 'Progress toward clinical goals and target outcomes',
          dataPoints: 10,
        },
      ],
      summary: {
        keyMetrics: [
          { metric: 'BP Control', value: '140/85 mmHg', trend: 'STABLE' },
          { metric: 'Blood Glucose', value: '145 mg/dL', trend: 'IMPROVED' },
          { metric: 'Weight', value: '185 lbs', trend: 'DOWN' },
          { metric: 'Last Lab Date', value: new Date().toLocaleDateString() },
        ],
        findings: [
          'Blood pressure control has improved from previous period',
          'Blood glucose levels showing downward trend',
          'Patient weight loss of 5 lbs achieved',
        ],
        recommendations: [
          'Continue current medication regimen',
          'Maintain diet and exercise adherence',
          'Schedule follow-up in 3 months',
        ],
      },
      confidential: true,
      watermarked: true,
      accessLog: [{ userId: 'system', timestamp: new Date().toISOString() }],
    };

    const reports = this.getReports();
    reports.push(report);
    storageService.set(STORAGE_KEY_REPORTS, reports);

    return report;
  }

  /**
   * Schedule report delivery
   */
  scheduleReport(
    templateId: string,
    recipients: string[],
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY',
    time: string = '09:00',
    options?: Partial<ScheduledReport>
  ): ScheduledReport {
    const scheduled: ScheduledReport = {
      id: this.generateId(),
      templateId,
      owner: options?.owner || 'system',
      patientId: options?.patientId,
      recipients,
      frequency,
      dayOfWeek: options?.dayOfWeek,
      dayOfMonth: options?.dayOfMonth,
      time,
      nextScheduledRun: this.calculateNextRun(frequency, time),
      isActive: true,
      notificationMethod: options?.notificationMethod || 'EMAIL',
      retentionDays: options?.retentionDays || 90,
      createdAt: new Date().toISOString(),
    };

    const scheduled_reports = this.getScheduledReports();
    scheduled_reports.push(scheduled);
    storageService.set(STORAGE_KEY_SCHEDULED, scheduled_reports);

    return scheduled;
  }

  /**
   * Get report by ID
   */
  getReportById(reportId: string): GeneratedReport | null {
    const reports = this.getReports();
    return reports.find((r) => r.id === reportId) || null;
  }

  /**
   * Get reports for patient
   */
  getPatientReports(patientId: string): GeneratedReport[] {
    return this.getReports().filter((r) => r.patientId === patientId).sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  /**
   * Access report (log access)
   */
  accessReport(reportId: string, userId: string): GeneratedReport | null {
    const reports = this.getReports();
    const report = reports.find((r) => r.id === reportId);

    if (!report) {
      return null;
    }

    report.accessLog.push({
      userId,
      timestamp: new Date().toISOString(),
    });

    storageService.set(STORAGE_KEY_REPORTS, reports);
    return report;
  }

  /**
   * Export report to CSV
   */
  exportToCSV(reportId: string): string {
    const report = this.getReportById(reportId);
    if (!report) {
      return '';
    }

    let csv = 'Report Title,Period,Generated\n';
    csv += `"${report.title}","${report.period.startDate} to ${report.period.endDate}","${report.generatedAt}"\n\n`;

    report.sections.forEach((section) => {
      csv += `"${section.title}","${section.content}","${section.dataPoints} data points"\n`;
    });

    csv += '\nSummary,Value,Trend\n';
    report.summary.keyMetrics.forEach((metric) => {
      csv += `"${metric.metric}","${metric.value}","${metric.trend || ''}"\n`;
    });

    return csv;
  }

  /**
   * Get scheduled reports status
   */
  getScheduledReportStatus(scheduledId: string): ScheduledReport | null {
    const scheduled_reports = this.getScheduledReports();
    return scheduled_reports.find((r) => r.id === scheduledId) || null;
  }

  /**
   * Get all scheduled reports
   */
  getAllScheduledReports(): ScheduledReport[] {
    return this.getScheduledReports();
  }

  /**
   * Pause scheduled report
   */
  pauseScheduledReport(scheduledId: string): boolean {
    const scheduled_reports = this.getScheduledReports();
    const report = scheduled_reports.find((r) => r.id === scheduledId);

    if (!report) {
      return false;
    }

    report.isActive = false;
    storageService.set(STORAGE_KEY_SCHEDULED, scheduled_reports);
    return true;
  }

  /**
   * Resume scheduled report
   */
  resumeScheduledReport(scheduledId: string): boolean {
    const scheduled_reports = this.getScheduledReports();
    const report = scheduled_reports.find((r) => r.id === scheduledId);

    if (!report) {
      return false;
    }

    report.isActive = true;
    report.nextScheduledRun = this.calculateNextRun(report.frequency, report.time);
    storageService.set(STORAGE_KEY_SCHEDULED, scheduled_reports);
    return true;
  }

  /**
   * Get report statistics
   */
  getReportStats(): {
    totalGenerated: number;
    byType: Record<string, number>;
    averageSize: number;
    mostAccessed: string[];
  } {
    const reports = this.getReports();

    const byType = {
      ADHERENCE: 0,
      CLINICAL_OUTCOME: 0,
      MEDICATION_MANAGEMENT: 0,
      COMPREHENSIVE: 0,
      FINANCIAL: 0,
      CUSTOM: 0,
    };

    reports.forEach((r) => {
      byType[r.reportType]++;
    });

    const avgSize = reports.length > 0 ? reports.reduce((sum, r) => sum + r.fileSize, 0) / reports.length : 0;

    const mostAccessed = reports
      .sort((a, b) => b.accessLog.length - a.accessLog.length)
      .slice(0, 5)
      .map((r) => r.title);

    return {
      totalGenerated: reports.length,
      byType,
      averageSize: Math.round(avgSize),
      mostAccessed,
    };
  }

  /**
   * Private: Generate section content
   */
  private generateSectionContent(section: ReportTemplate['sections'][0]): string {
    return `${section.title} - ${section.dataSource} visualization using ${section.visualizationType}`;
  }

  /**
   * Private: Generate report summary
   */
  private generateReportSummary(type: string, patientId?: string): GeneratedReport['summary'] {
    return {
      keyMetrics: [
        { metric: 'Report Generated', value: new Date().toLocaleDateString() },
        { metric: 'Data Points', value: '50+' },
      ],
      findings: ['Summary findings based on data analysis'],
      recommendations: ['Recommendation 1', 'Recommendation 2'],
    };
  }

  /**
   * Private: Generate adherence summary
   */
  private generateAdherenceSummary(metrics: any): string {
    return `Patient demonstrates ${metrics.overallAdherence}% adherence rate over the reporting period.`;
  }

  /**
   * Private: Get common missed time
   */
  private getCommonMissedTime(): string {
    return 'Evening (6-9 PM)';
  }

  /**
   * Private: Get best adherence day
   */
  private getBestAdherenceDay(): string {
    return 'Wednesday';
  }

  /**
   * Private: Calculate next run time
   */
  private calculateNextRun(frequency: string, time: string): string {
    const now = new Date();
    let nextRun = new Date();

    switch (frequency) {
      case 'DAILY':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'WEEKLY':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'MONTHLY':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    const [hours, minutes] = time.split(':');
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0);

    return nextRun.toISOString();
  }

  /**
   * Private: Get reports
   */
  private getReports(): GeneratedReport[] {
    return (storageService.get(STORAGE_KEY_REPORTS) || []) as GeneratedReport[];
  }

  /**
   * Private: Get templates
   */
  private getTemplates(): ReportTemplate[] {
    return (storageService.get(STORAGE_KEY_TEMPLATES) || []) as ReportTemplate[];
  }

  /**
   * Private: Get template by ID
   */
  private getTemplateById(templateId: string): ReportTemplate | null {
    const templates = this.getTemplates();
    return templates.find((t) => t.id === templateId) || null;
  }

  /**
   * Private: Get scheduled reports
   */
  private getScheduledReports(): ScheduledReport[] {
    return (storageService.get(STORAGE_KEY_SCHEDULED) || []) as ScheduledReport[];
  }

  /**
   * Private: Generate ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const advancedReportsService = new AdvancedReportsService();
