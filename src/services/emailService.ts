/**
 * Email Service - Handles email sending and management
 * Supports templates, scheduling, and delivery tracking
 */

import { storageService } from './storageService';
import { notificationService } from './notificationService';
import type { EmailTemplate, EmailMessage, EmailSchedule, EmailDeliveryLog } from '../types';

const STORAGE_KEY_TEMPLATES = 'email_templates';
const STORAGE_KEY_MESSAGES = 'email_messages';
const STORAGE_KEY_DELIVERY_LOG = 'email_delivery_log';

// Default email templates
const DEFAULT_TEMPLATES: Record<string, EmailTemplate> = {
  MISSED_DOSE: {
    id: 'tpl_missed_dose',
    name: 'Missed Dose Alert',
    category: 'MEDICATION',
    subject: 'Medication Reminder: {{medicationName}}',
    body: `Dear {{patientName}},

We noticed you may have missed your scheduled {{medicationName}} dose at {{scheduledTime}}.

Taking your medications as prescribed is crucial for your treatment success and health outcomes.

If you haven't taken your dose yet, please do so as soon as possible. If you have any issues or concerns, please contact your healthcare provider immediately.

Best regards,
Healthcare Team`,
    variables: ['patientName', 'medicationName', 'scheduledTime', 'dosageInfo'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  APPOINTMENT_REMINDER: {
    id: 'tpl_appointment',
    name: 'Appointment Reminder',
    category: 'APPOINTMENT',
    subject: 'Appointment Reminder - {{appointmentDate}}',
    body: `Dear {{patientName}},

This is a reminder about your upcoming appointment:

Date: {{appointmentDate}}
Time: {{appointmentTime}}
Location: {{appointmentLocation}}
Provider: {{providerName}}
Type: {{appointmentType}}

Please arrive 10-15 minutes early. If you need to reschedule, contact us as soon as possible.

Best regards,
Healthcare Team`,
    variables: ['patientName', 'appointmentDate', 'appointmentTime', 'appointmentLocation', 'providerName', 'appointmentType'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  LOW_ADHERENCE_ALERT: {
    id: 'tpl_low_adherence',
    name: 'Low Adherence Alert',
    category: 'ADHERENCE',
    subject: 'We\'re Here to Help - Medication Adherence Support',
    body: `Dear {{patientName}},

We\'ve noticed that your medication adherence has dropped to {{adherenceRate}}% over the past {{period}} days. This concerns us as consistent adherence is vital for your treatment success.

Current Adherence: {{adherenceRate}}%
Expected Level: {{expectedAdherence}}%

Common reasons for missed doses:
- Forgetting to take medication
- Side effects
- Cost concerns
- Confusion about instructions

Please reach out to your healthcare provider or our support team if you\'re experiencing any challenges. We\'re here to help!

Best regards,
Healthcare Team`,
    variables: ['patientName', 'adherenceRate', 'period', 'expectedAdherence'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  PRESCRIPTION_READY: {
    id: 'tpl_prescription_ready',
    name: 'Prescription Ready',
    category: 'PRESCRIPTION',
    subject: 'Your Prescription is Ready - {{medicationName}}',
    body: `Dear {{patientName}},

Good news! Your prescription for {{medicationName}} is ready for pickup.

Pharmacy: {{pharmacyName}}
Address: {{pharmacyAddress}}
Phone: {{pharmacyPhone}}
Ready Since: {{readyDate}}

Please pick up your prescription within {{expirationDays}} days. If you have any questions, contact the pharmacy directly.

Best regards,
Healthcare Team`,
    variables: ['patientName', 'medicationName', 'pharmacyName', 'pharmacyAddress', 'pharmacyPhone', 'readyDate', 'expirationDays'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  TREATMENT_MILESTONE: {
    id: 'tpl_milestone',
    name: 'Treatment Milestone',
    category: 'TREATMENT',
    subject: 'Congratulations! Treatment Milestone Reached - {{milestone}}',
    body: `Dear {{patientName}},

Congratulations! You\'ve achieved an important milestone in your treatment journey!

Milestone: {{milestone}}
Achievement Date: {{achievementDate}}
Treatment: {{treatmentName}}
Progress: {{progress}}%

This is a testament to your commitment and dedication. Keep up the excellent work! Your healthcare team is proud of your progress.

Next Steps: {{nextSteps}}

Best regards,
Healthcare Team`,
    variables: ['patientName', 'milestone', 'achievementDate', 'treatmentName', 'progress', 'nextSteps'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
};

class EmailService {
  /**
   * Initialize email service with default templates
   */
  initializeTemplates(): void {
    const existing = storageService.get(STORAGE_KEY_TEMPLATES);
    if (!existing) {
      storageService.set(STORAGE_KEY_TEMPLATES, Object.values(DEFAULT_TEMPLATES));
    }
  }

  /**
   * Send an email using template
   */
  async sendEmail(
    recipientEmail: string,
    templateId: string,
    variables: Record<string, string>,
    options?: {
      cc?: string[];
      bcc?: string[];
      priority?: 'LOW' | 'NORMAL' | 'HIGH';
      scheduledTime?: string;
    }
  ): Promise<EmailMessage> {
    const template = this.getTemplateById(templateId);
    if (!template || !template.isActive) {
      throw new Error(`Template ${templateId} not found or inactive`);
    }

    const message: EmailMessage = {
      id: this.generateMessageId(),
      templateId,
      recipientEmail,
      subject: this.interpolateTemplate(template.subject, variables),
      body: this.interpolateTemplate(template.body, variables),
      variables,
      status: options?.scheduledTime ? 'SCHEDULED' : 'PENDING',
      priority: options?.priority || 'NORMAL',
      cc: options?.cc || [],
      bcc: options?.bcc || [],
      scheduledTime: options?.scheduledTime,
      createdAt: new Date().toISOString(),
      sentAt: null,
      deliveredAt: null,
      failureReason: null,
    };

    // Save message
    const messages = this.getAllMessages();
    messages.push(message);
    storageService.set(STORAGE_KEY_MESSAGES, messages);

    // Log delivery attempt
    this.logDelivery(message.id, recipientEmail, 'QUEUED', null);

    // Simulate email sending (in production, use Sendgrid/AWS SES)
    if (!options?.scheduledTime) {
      setTimeout(() => this.simulateEmailSend(message.id), 100);
    }

    return message;
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    recipients: Array<{ email: string; variables: Record<string, string> }>,
    templateId: string,
    options?: { priority?: 'LOW' | 'NORMAL' | 'HIGH' }
  ): Promise<EmailMessage[]> {
    const messages: EmailMessage[] = [];
    for (const recipient of recipients) {
      const msg = await this.sendEmail(recipient.email, templateId, recipient.variables, {
        priority: options?.priority,
      });
      messages.push(msg);
    }
    return messages;
  }

  /**
   * Schedule email for later sending
   */
  async scheduleEmail(
    recipientEmail: string,
    templateId: string,
    variables: Record<string, string>,
    scheduledTime: string
  ): Promise<EmailMessage> {
    return this.sendEmail(recipientEmail, templateId, variables, {
      scheduledTime,
      priority: 'NORMAL',
    });
  }

  /**
   * Get email message by ID
   */
  getMessageById(messageId: string): EmailMessage | null {
    const messages = this.getAllMessages();
    return messages.find((m) => m.id === messageId) || null;
  }

  /**
   * Get all email messages
   */
  getAllMessages(): EmailMessage[] {
    return storageService.get(STORAGE_KEY_MESSAGES) || [];
  }

  /**
   * Get messages by recipient
   */
  getMessagesByRecipient(email: string): EmailMessage[] {
    return this.getAllMessages().filter((m) => m.recipientEmail === email);
  }

  /**
   * Get messages by status
   */
  getMessagesByStatus(status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'FAILED'): EmailMessage[] {
    return this.getAllMessages().filter((m) => m.status === status);
  }

  /**
   * Retry failed email
   */
  async retryEmail(messageId: string): Promise<EmailMessage | null> {
    const messages = this.getAllMessages();
    const messageIndex = messages.findIndex((m) => m.id === messageId);

    if (messageIndex === -1) {
      return null;
    }

    const message = messages[messageIndex];
    message.status = 'PENDING';
    message.failureReason = null;

    storageService.set(STORAGE_KEY_MESSAGES, messages);
    this.logDelivery(messageId, message.recipientEmail, 'RETRY', null);

    // Simulate sending
    setTimeout(() => this.simulateEmailSend(messageId), 100);

    return message;
  }

  /**
   * Get or create template
   */
  getTemplateById(templateId: string): EmailTemplate | null {
    const templates = this.getAllTemplates();
    return templates.find((t) => t.id === templateId) || null;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): EmailTemplate[] {
    return storageService.get(STORAGE_KEY_TEMPLATES) || [];
  }

  /**
   * Create custom template
   */
  createTemplate(
    name: string,
    category: 'MEDICATION' | 'APPOINTMENT' | 'ADHERENCE' | 'PRESCRIPTION' | 'TREATMENT' | 'OTHER',
    subject: string,
    body: string,
    variables: string[]
  ): EmailTemplate {
    const template: EmailTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
      subject,
      body,
      variables,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const templates = this.getAllTemplates();
    templates.push(template);
    storageService.set(STORAGE_KEY_TEMPLATES, templates);

    return template;
  }

  /**
   * Update template
   */
  updateTemplate(templateId: string, updates: Partial<EmailTemplate>): EmailTemplate | null {
    const templates = this.getAllTemplates();
    const index = templates.findIndex((t) => t.id === templateId);

    if (index === -1) {
      return null;
    }

    templates[index] = { ...templates[index], ...updates, id: templateId };
    storageService.set(STORAGE_KEY_TEMPLATES, templates);

    return templates[index];
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    const templates = this.getAllTemplates();
    const index = templates.findIndex((t) => t.id === templateId);

    if (index === -1) {
      return false;
    }

    templates.splice(index, 1);
    storageService.set(STORAGE_KEY_TEMPLATES, templates);
    return true;
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats(): {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
  } {
    const messages = this.getAllMessages();
    const total = messages.length;
    const sent = messages.filter((m) => m.status === 'SENT').length;
    const delivered = messages.filter((m) => m.status === 'DELIVERED').length;
    const failed = messages.filter((m) => m.status === 'FAILED').length;
    const pending = messages.filter((m) => m.status === 'PENDING' || m.status === 'SCHEDULED').length;

    return {
      total,
      sent,
      delivered,
      failed,
      pending,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
    };
  }

  /**
   * Private: Interpolate template variables
   */
  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    });
    return result;
  }

  /**
   * Private: Simulate email sending
   */
  private simulateEmailSend(messageId: string): void {
    // Simulate 90% success rate
    const success = Math.random() < 0.9;

    const messages = this.getAllMessages();
    const index = messages.findIndex((m) => m.id === messageId);

    if (index !== -1) {
      if (success) {
        messages[index].status = 'DELIVERED';
        messages[index].deliveredAt = new Date().toISOString();
        messages[index].sentAt = new Date().toISOString();
        this.logDelivery(messageId, messages[index].recipientEmail, 'DELIVERED', null);
      } else {
        messages[index].status = 'FAILED';
        messages[index].failureReason = 'SMTP connection failed';
        this.logDelivery(messageId, messages[index].recipientEmail, 'FAILED', 'SMTP connection failed');
      }
      storageService.set(STORAGE_KEY_MESSAGES, messages);
    }
  }

  /**
   * Private: Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Log delivery attempt
   */
  private logDelivery(messageId: string, email: string, status: string, error: string | null): void {
    const log: EmailDeliveryLog = {
      messageId,
      email,
      status,
      timestamp: new Date().toISOString(),
      error,
    };

    const logs = (storageService.get(STORAGE_KEY_DELIVERY_LOG) || []) as EmailDeliveryLog[];
    logs.push(log);
    storageService.set(STORAGE_KEY_DELIVERY_LOG, logs);
  }
}

export const emailService = new EmailService();
