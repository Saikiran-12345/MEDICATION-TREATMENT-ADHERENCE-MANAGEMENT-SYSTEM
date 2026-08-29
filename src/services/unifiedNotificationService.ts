/**
 * Unified Notification Service
 * Integrates Email, SMS, and In-App notifications with queuing and preferences
 */

import { emailService } from './emailService';
import { smsService } from './smsService';
import { notificationService } from './notificationService';
import { notificationConfigService } from './notificationConfigService';
import { notificationQueueService } from './notificationQueueService';

type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';

interface SendNotificationOptions {
  userId: string;
  channels?: NotificationChannel[];
  templateId: string;
  variables: Record<string, string>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  scheduledTime?: string;
  title?: string; // For in-app notifications
  message?: string; // For in-app notifications
}

class UnifiedNotificationService {
  /**
   * Initialize all notification services
   */
  initialize(): void {
    console.log('Initializing Notification System...');

    // Initialize templates
    emailService.initializeTemplates();
    smsService.initializeTemplates();

    // Start queue processor
    notificationQueueService.start();

    console.log('Notification System Ready');
  }

  /**
   * Send notifications through configured channels
   */
  async sendNotification(options: SendNotificationOptions): Promise<void> {
    const {
      userId,
      channels = ['EMAIL', 'SMS', 'IN_APP'],
      templateId,
      variables,
      priority = 'NORMAL',
      scheduledTime,
      title = 'Notification',
      message,
    } = options;

    // Get user settings
    let userSettings = notificationConfigService.getUserSettings(userId);
    if (!userSettings) {
      userSettings = notificationConfigService.initializeUserPreferences(userId);
    }

    // Send through each channel
    for (const channel of channels) {
      if (notificationConfigService.shouldSendNotification(userId, channel, templateId)) {
        notificationQueueService.enqueueNotification(userId, channel, templateId, variables, priority, scheduledTime);
      }
    }

    // Also send in-app notification immediately if enabled
    if (channels.includes('IN_APP') && userSettings.inAppEnabled) {
      notificationService.addNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title,
        message: message || templateId,
        date: new Date().toISOString(),
        type: 'SYSTEM',
        isRead: false,
      });
    }
  }

  /**
   * Send missed dose notification (common use case)
   */
  async sendMissedDoseNotification(
    patientId: string,
    medicationName: string,
    scheduledTime: string,
    channels: NotificationChannel[] = ['EMAIL', 'SMS', 'IN_APP']
  ): Promise<void> {
    const scheduledDateTime = new Date(scheduledTime);
    const timeStr = scheduledDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    await this.sendNotification({
      userId: patientId,
      channels,
      templateId: 'tpl_missed_dose',
      variables: {
        patientName: 'User',
        medicationName,
        scheduledTime: timeStr,
      },
      priority: 'HIGH',
      title: `Missed Dose Alert: ${medicationName}`,
      message: `You may have missed your ${medicationName} dose at ${timeStr}. Please take it ASAP.`,
    });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    patientId: string,
    appointmentDetails: {
      date: string;
      time: string;
      type: string;
      provider: string;
      location: string;
    },
    channels: NotificationChannel[] = ['EMAIL', 'SMS', 'IN_APP']
  ): Promise<void> {
    await this.sendNotification({
      userId: patientId,
      channels,
      templateId: 'tpl_appointment',
      variables: {
        patientName: 'User',
        appointmentDate: appointmentDetails.date,
        appointmentTime: appointmentDetails.time,
        appointmentType: appointmentDetails.type,
        providerName: appointmentDetails.provider,
        appointmentLocation: appointmentDetails.location,
        locationName: appointmentDetails.location,
      },
      priority: 'NORMAL',
      title: 'Appointment Reminder',
      message: `Your ${appointmentDetails.type} is scheduled for ${appointmentDetails.date} at ${appointmentDetails.time}.`,
    });
  }

  /**
   * Send low adherence alert
   */
  async sendLowAdherenceAlert(
    patientId: string,
    adherenceRate: number,
    period: number,
    channels: NotificationChannel[] = ['EMAIL', 'SMS']
  ): Promise<void> {
    await this.sendNotification({
      userId: patientId,
      channels,
      templateId: 'tpl_low_adherence',
      variables: {
        patientName: 'User',
        adherenceRate: adherenceRate.toString(),
        period: period.toString(),
        expectedAdherence: '80',
      },
      priority: 'HIGH',
      title: 'Medication Adherence Alert',
      message: `Your adherence rate has dropped to ${adherenceRate}%. We want to help you stay on track.`,
    });
  }

  /**
   * Send follow-up reminder
   */
  async sendFollowUpReminder(patientId: string, followUpDetails: { purpose: string; date: string; time: string }): Promise<void> {
    await this.sendNotification({
      userId: patientId,
      channels: ['IN_APP', 'SMS'],
      templateId: 'sms_followup',
      variables: {
        patientFirstName: 'User',
      },
      priority: 'NORMAL',
      title: 'Follow-up Reminder',
      message: `Your follow-up check-in for ${followUpDetails.purpose} is due on ${followUpDetails.date} at ${followUpDetails.time}.`,
    });
  }

  /**
   * Send refill reminder
   */
  async sendRefillReminder(patientId: string, medicationName: string, daysRemaining: number): Promise<void> {
    await this.sendNotification({
      userId: patientId,
      channels: ['SMS', 'IN_APP'],
      templateId: 'sms_refill',
      variables: {
        medicationName,
        daysRemaining: daysRemaining.toString(),
      },
      priority: 'NORMAL',
      title: 'Medication Refill Due',
      message: `Time to refill ${medicationName}. You have ${daysRemaining} days of supply left.`,
    });
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    recipients: Array<{
      userId: string;
      variables: Record<string, string>;
    }>,
    templateId: string,
    channels: NotificationChannel[] = ['EMAIL', 'IN_APP'],
    batchName?: string
  ): Promise<string> {
    const notifications = recipients.map((r) => ({
      userId: r.userId,
      channels,
      templateId,
      variables: r.variables,
    }));

    const batchId = notificationQueueService.enqueueBulkNotifications(
      notifications.map((n) => ({
        userId: n.userId,
        channel: n.channels[0] as NotificationChannel,
        templateId: n.templateId,
        variables: n.variables,
      })),
      batchName
    );

    return batchId;
  }

  /**
   * Get user notification preferences
   */
  getUserPreferences(userId: string) {
    return notificationConfigService.getUserSettings(userId);
  }

  /**
   * Update user email
   */
  updateUserEmail(userId: string, email: string) {
    return notificationConfigService.updateUserEmail(userId, email);
  }

  /**
   * Update user phone
   */
  updateUserPhone(userId: string, phoneNumber: string) {
    return notificationConfigService.updateUserPhone(userId, phoneNumber);
  }

  /**
   * Set notification channel enabled/disabled
   */
  setChannelEnabled(userId: string, channel: NotificationChannel, enabled: boolean) {
    return notificationConfigService.setChannelEnabled(userId, channel, enabled);
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return notificationQueueService.getQueueStatus();
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats() {
    return {
      email: emailService.getDeliveryStats(),
      sms: smsService.getDeliveryStats(),
    };
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(userId?: string, limit?: number) {
    return notificationQueueService.getDeliveryHistory(userId, limit);
  }

  /**
   * Get delivery report
   */
  getDeliveryReport(startDate: string, endDate: string) {
    return notificationQueueService.getDeliveryReport(startDate, endDate);
  }

  /**
   * Shutdown notification service
   */
  shutdown(): void {
    notificationQueueService.stop();
    console.log('Notification System Shutdown');
  }
}

export const unifiedNotificationService = new UnifiedNotificationService();
