/**
 * SMS Service - Handles SMS/text message sending and management
 * Supports templates, scheduling, and delivery tracking
 */

import { storageService } from './storageService';
import type { SMSTemplate, SMSMessage, SMSDeliveryLog } from '../types';

const STORAGE_KEY_TEMPLATES = 'sms_templates';
const STORAGE_KEY_MESSAGES = 'sms_messages';
const STORAGE_KEY_DELIVERY_LOG = 'sms_delivery_log';

// Default SMS templates
const DEFAULT_SMS_TEMPLATES: Record<string, SMSTemplate> = {
  MISSED_DOSE: {
    id: 'sms_missed_dose',
    name: 'Missed Dose Alert',
    category: 'MEDICATION',
    content: 'Hi {{patientFirstName}}, reminder: you may have missed your {{medicationName}} dose at {{scheduledTime}}. Please take it ASAP for your health. Reply TAKEN if done.',
    variables: ['patientFirstName', 'medicationName', 'scheduledTime'],
    isActive: true,
    characterCount: 120,
    createdAt: new Date().toISOString(),
  },
  APPOINTMENT_REMINDER: {
    id: 'sms_appointment',
    name: 'Appointment Reminder',
    category: 'APPOINTMENT',
    content: 'Reminder: You have {{appointmentType}} with {{providerName}} on {{appointmentDate}} at {{appointmentTime}} at {{locationName}}. Reply CONFIRM to confirm.',
    variables: ['appointmentType', 'providerName', 'appointmentDate', 'appointmentTime', 'locationName'],
    isActive: true,
    characterCount: 140,
    createdAt: new Date().toISOString(),
  },
  DOSE_CONFIRMATION: {
    id: 'sms_dose_confirm',
    name: 'Dose Confirmation',
    category: 'MEDICATION',
    content: 'Did you take your {{medicationName}} dose? Reply YES to confirm or NO if you missed it.',
    variables: ['medicationName'],
    isActive: true,
    characterCount: 75,
    createdAt: new Date().toISOString(),
  },
  FOLLOW_UP_REMINDER: {
    id: 'sms_followup',
    name: 'Follow-up Reminder',
    category: 'FOLLOW_UP',
    content: 'Hi {{patientFirstName}}, your follow-up check-in is due. Please visit the app to complete it. Your adherence matters!',
    variables: ['patientFirstName'],
    isActive: true,
    characterCount: 95,
    createdAt: new Date().toISOString(),
  },
  REFILL_REMINDER: {
    id: 'sms_refill',
    name: 'Refill Reminder',
    category: 'PRESCRIPTION',
    content: 'Time to refill: {{medicationName}} is running low. You have {{daysRemaining}} days of supply left. Refill now to avoid missing doses.',
    variables: ['medicationName', 'daysRemaining'],
    isActive: true,
    characterCount: 110,
    createdAt: new Date().toISOString(),
  },
};

class SMSService {
  /**
   * Initialize SMS service with default templates
   */
  initializeTemplates(): void {
    const existing = storageService.get(STORAGE_KEY_TEMPLATES);
    if (!existing) {
      storageService.set(STORAGE_KEY_TEMPLATES, Object.values(DEFAULT_SMS_TEMPLATES));
    }
  }

  /**
   * Send SMS using template
   */
  async sendSMS(
    phoneNumber: string,
    templateId: string,
    variables: Record<string, string>,
    options?: {
      priority?: 'LOW' | 'NORMAL' | 'HIGH';
      scheduledTime?: string;
      requiresConfirmation?: boolean;
    }
  ): Promise<SMSMessage> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    const template = this.getTemplateById(templateId);
    if (!template || !template.isActive) {
      throw new Error(`SMS Template ${templateId} not found or inactive`);
    }

    const content = this.interpolateTemplate(template.content, variables);

    // Check character limit (SMS typically 160 chars)
    if (content.length > 160) {
      console.warn(`SMS exceeds 160 characters (${content.length}). Will be split into multiple messages.`);
    }

    const message: SMSMessage = {
      id: this.generateMessageId(),
      templateId,
      phoneNumber,
      content,
      variables,
      status: options?.scheduledTime ? 'SCHEDULED' : 'PENDING',
      priority: options?.priority || 'NORMAL',
      requiresConfirmation: options?.requiresConfirmation || false,
      confirmationResponse: null,
      scheduledTime: options?.scheduledTime,
      createdAt: new Date().toISOString(),
      sentAt: null,
      deliveredAt: null,
      failureReason: null,
      characterCount: content.length,
      messageCount: Math.ceil(content.length / 160),
    };

    // Save message
    const messages = this.getAllMessages();
    messages.push(message);
    storageService.set(STORAGE_KEY_MESSAGES, messages);

    // Log delivery attempt
    this.logDelivery(message.id, phoneNumber, 'QUEUED', null);

    // Simulate SMS sending (in production, use Twilio/AWS SNS)
    if (!options?.scheduledTime) {
      setTimeout(() => this.simulateSMSSend(message.id), 100);
    }

    return message;
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(
    recipients: Array<{ phoneNumber: string; variables: Record<string, string> }>,
    templateId: string,
    options?: { priority?: 'LOW' | 'NORMAL' | 'HIGH' }
  ): Promise<SMSMessage[]> {
    const messages: SMSMessage[] = [];
    for (const recipient of recipients) {
      const msg = await this.sendSMS(recipient.phoneNumber, templateId, recipient.variables, {
        priority: options?.priority,
      });
      messages.push(msg);
    }
    return messages;
  }

  /**
   * Schedule SMS for later sending
   */
  async scheduleSMS(
    phoneNumber: string,
    templateId: string,
    variables: Record<string, string>,
    scheduledTime: string
  ): Promise<SMSMessage> {
    return this.sendSMS(phoneNumber, templateId, variables, {
      scheduledTime,
      priority: 'NORMAL',
    });
  }

  /**
   * Record SMS response/confirmation
   */
  recordResponse(messageId: string, response: string): SMSMessage | null {
    const messages = this.getAllMessages();
    const message = messages.find((m) => m.id === messageId);

    if (!message) {
      return null;
    }

    message.confirmationResponse = response.toUpperCase();
    storageService.set(STORAGE_KEY_MESSAGES, messages);

    // Parse response for TAKEN, CONFIRM, YES, etc
    this.logDelivery(messageId, message.phoneNumber, `RESPONSE_${response}`, null);

    return message;
  }

  /**
   * Get SMS message by ID
   */
  getMessageById(messageId: string): SMSMessage | null {
    const messages = this.getAllMessages();
    return messages.find((m) => m.id === messageId) || null;
  }

  /**
   * Get all SMS messages
   */
  getAllMessages(): SMSMessage[] {
    return storageService.get(STORAGE_KEY_MESSAGES) || [];
  }

  /**
   * Get messages by phone number
   */
  getMessagesByPhone(phoneNumber: string): SMSMessage[] {
    return this.getAllMessages().filter((m) => m.phoneNumber === phoneNumber);
  }

  /**
   * Get messages by status
   */
  getMessagesByStatus(status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'FAILED'): SMSMessage[] {
    return this.getAllMessages().filter((m) => m.status === status);
  }

  /**
   * Get messages awaiting confirmation
   */
  getMessagesAwaitingConfirmation(): SMSMessage[] {
    return this.getAllMessages().filter(
      (m) => m.requiresConfirmation && (m.status === 'DELIVERED' || m.status === 'SENT') && !m.confirmationResponse
    );
  }

  /**
   * Retry failed SMS
   */
  async retrySMS(messageId: string): Promise<SMSMessage | null> {
    const messages = this.getAllMessages();
    const message = messages.find((m) => m.id === messageId);

    if (!message) {
      return null;
    }

    message.status = 'PENDING';
    message.failureReason = null;
    storageService.set(STORAGE_KEY_MESSAGES, messages);

    this.logDelivery(messageId, message.phoneNumber, 'RETRY', null);
    setTimeout(() => this.simulateSMSSend(messageId), 100);

    return message;
  }

  /**
   * Get or create SMS template
   */
  getTemplateById(templateId: string): SMSTemplate | null {
    const templates = this.getAllTemplates();
    return templates.find((t) => t.id === templateId) || null;
  }

  /**
   * Get all SMS templates
   */
  getAllTemplates(): SMSTemplate[] {
    return storageService.get(STORAGE_KEY_TEMPLATES) || [];
  }

  /**
   * Create custom SMS template (SMS best practices: keep under 160 chars)
   */
  createTemplate(
    name: string,
    category: 'MEDICATION' | 'APPOINTMENT' | 'FOLLOW_UP' | 'PRESCRIPTION' | 'OTHER',
    content: string,
    variables: string[]
  ): SMSTemplate {
    if (content.length > 160) {
      console.warn(`SMS content exceeds 160 characters. It will be split into ${Math.ceil(content.length / 160)} messages.`);
    }

    const template: SMSTemplate = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
      content,
      variables,
      isActive: true,
      characterCount: content.length,
      createdAt: new Date().toISOString(),
    };

    const templates = this.getAllTemplates();
    templates.push(template);
    storageService.set(STORAGE_KEY_TEMPLATES, templates);

    return template;
  }

  /**
   * Update SMS template
   */
  updateTemplate(templateId: string, updates: Partial<SMSTemplate>): SMSTemplate | null {
    const templates = this.getAllTemplates();
    const index = templates.findIndex((t) => t.id === templateId);

    if (index === -1) {
      return null;
    }

    if (updates.content && updates.content.length > 160) {
      console.warn(`SMS content exceeds 160 characters`);
    }

    templates[index] = {
      ...templates[index],
      ...updates,
      id: templateId,
      characterCount: updates.content?.length || templates[index].characterCount,
    };
    storageService.set(STORAGE_KEY_TEMPLATES, templates);

    return templates[index];
  }

  /**
   * Delete SMS template
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
   * Get SMS delivery statistics
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
   * Private: Validate phone number (basic check)
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove common formatting characters
    const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    // Check if it's at least 10 digits
    return /^\+?1?\d{10,}$/.test(cleaned);
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
   * Private: Simulate SMS sending
   */
  private simulateSMSSend(messageId: string): void {
    // Simulate 95% success rate for SMS (typically higher than email)
    const success = Math.random() < 0.95;

    const messages = this.getAllMessages();
    const index = messages.findIndex((m) => m.id === messageId);

    if (index !== -1) {
      if (success) {
        messages[index].status = 'DELIVERED';
        messages[index].deliveredAt = new Date().toISOString();
        messages[index].sentAt = new Date().toISOString();
        this.logDelivery(messageId, messages[index].phoneNumber, 'DELIVERED', null);
      } else {
        messages[index].status = 'FAILED';
        messages[index].failureReason = 'Network error';
        this.logDelivery(messageId, messages[index].phoneNumber, 'FAILED', 'Network error');
      }
      storageService.set(STORAGE_KEY_MESSAGES, messages);
    }
  }

  /**
   * Private: Generate unique message ID
   */
  private generateMessageId(): string {
    return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Log delivery attempt
   */
  private logDelivery(messageId: string, phoneNumber: string, status: string, error: string | null): void {
    const log: SMSDeliveryLog = {
      messageId,
      phoneNumber,
      status,
      timestamp: new Date().toISOString(),
      error,
    };

    const logs = (storageService.get(STORAGE_KEY_DELIVERY_LOG) || []) as SMSDeliveryLog[];
    logs.push(log);
    storageService.set(STORAGE_KEY_DELIVERY_LOG, logs);
  }
}

export const smsService = new SMSService();
