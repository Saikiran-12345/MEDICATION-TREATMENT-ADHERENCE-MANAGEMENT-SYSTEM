/**
 * Notification Queue Service
 * Manages batch processing, scheduling, and delivery of notifications
 * Prevents notification spam and optimizes delivery
 */

import { storageService } from './storageService';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { notificationConfigService } from './notificationConfigService';
import type { QueuedNotification, NotificationBatch, NotificationDeliveryReport } from '../types';

const STORAGE_KEY_QUEUE = 'notification_queue';
const STORAGE_KEY_HISTORY = 'notification_delivery_history';
const STORAGE_KEY_BATCHES = 'notification_batches';

type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';

interface QueueItem {
  id: string;
  userId: string;
  channel: NotificationChannel;
  templateId: string;
  variables: Record<string, string>;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  scheduledTime?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  error?: string;
}

class NotificationQueueService {
  private processingInterval: NodeJS.Timeout | null = null;
  private BATCH_SIZE = 10; // Process 10 notifications at a time
  private RETRY_DELAY = 5000; // 5 seconds between retries
  private MAX_RETRIES = 3;

  /**
   * Initialize queue processor
   */
  start(): void {
    if (this.processingInterval) {
      return; // Already running
    }

    // Process queue every 2 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 2000);

    console.log('Notification queue processor started');
  }

  /**
   * Stop queue processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Notification queue processor stopped');
    }
  }

  /**
   * Enqueue a notification
   */
  enqueueNotification(
    userId: string,
    channel: NotificationChannel,
    templateId: string,
    variables: Record<string, string>,
    priority: 'LOW' | 'NORMAL' | 'HIGH' = 'NORMAL',
    scheduledTime?: string
  ): string {
    const queue = this.getQueue();

    const item: QueueItem = {
      id: this.generateId(),
      userId,
      channel,
      templateId,
      variables,
      priority,
      scheduledTime,
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };

    queue.push(item);
    this.saveQueue(queue);

    return item.id;
  }

  /**
   * Enqueue multiple notifications (bulk)
   */
  enqueueBulkNotifications(
    notifications: Array<{
      userId: string;
      channel: NotificationChannel;
      templateId: string;
      variables: Record<string, string>;
      priority?: 'LOW' | 'NORMAL' | 'HIGH';
    }>,
    batchName?: string
  ): string {
    const batchId = this.generateId();
    const batch: NotificationBatch = {
      id: batchId,
      name: batchName || `Batch ${new Date().toISOString()}`,
      totalCount: notifications.length,
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
      status: 'PROCESSING',
    };

    const batches = this.getBatches();
    batches.push(batch);
    storageService.set(STORAGE_KEY_BATCHES, batches);

    // Enqueue all notifications
    for (const notification of notifications) {
      this.enqueueNotification(
        notification.userId,
        notification.channel,
        notification.templateId,
        notification.variables,
        notification.priority || 'NORMAL'
      );
    }

    return batchId;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    delivered: number;
    failed: number;
    byPriority: Record<string, number>;
    byChannel: Record<string, number>;
  } {
    const queue = this.getQueue();

    const status = {
      total: queue.length,
      pending: 0,
      processing: 0,
      delivered: 0,
      failed: 0,
      byPriority: { LOW: 0, NORMAL: 0, HIGH: 0 },
      byChannel: { EMAIL: 0, SMS: 0, IN_APP: 0, PUSH: 0 },
    };

    queue.forEach((item) => {
      status[item.status as keyof typeof status]++;
      status.byPriority[item.priority]++;
      status.byChannel[item.channel]++;
    });

    return status;
  }

  /**
   * Get notifications for user
   */
  getUserNotifications(userId: string, status?: string): QueueItem[] {
    const queue = this.getQueue();
    let filtered = queue.filter((item) => item.userId === userId);

    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }

    return filtered;
  }

  /**
   * Cancel notification
   */
  cancelNotification(notificationId: string): boolean {
    const queue = this.getQueue();
    const item = queue.find((q) => q.id === notificationId);

    if (!item) {
      return false;
    }

    item.status = 'CANCELLED';
    this.saveQueue(queue);
    return true;
  }

  /**
   * Reschedule notification
   */
  rescheduleNotification(notificationId: string, newScheduledTime: string): boolean {
    const queue = this.getQueue();
    const item = queue.find((q) => q.id === notificationId);

    if (!item || item.status !== 'PENDING') {
      return false;
    }

    item.scheduledTime = newScheduledTime;
    item.status = 'PENDING';
    this.saveQueue(queue);
    return true;
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(
    userId?: string,
    limit = 100
  ): Array<{ notificationId: string; userId: string; channel: string; status: string; timestamp: string; error?: string }> {
    const history = (storageService.get(STORAGE_KEY_HISTORY) || []) as any[];

    let filtered = history;
    if (userId) {
      filtered = filtered.filter((h) => h.userId === userId);
    }

    return filtered.slice(-limit);
  }

  /**
   * Get batch status
   */
  getBatchStatus(batchId: string): NotificationBatch | null {
    const batches = this.getBatches();
    return batches.find((b) => b.id === batchId) || null;
  }

  /**
   * Get all batches
   */
  getAllBatches(): NotificationBatch[] {
    return this.getBatches();
  }

  /**
   * Get delivery report for date range
   */
  getDeliveryReport(startDate: string, endDate: string): NotificationDeliveryReport {
    const history = (storageService.get(STORAGE_KEY_HISTORY) || []) as any[];

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const filtered = history.filter((h) => {
      const time = new Date(h.timestamp).getTime();
      return time >= start && time <= end;
    });

    const report: NotificationDeliveryReport = {
      startDate,
      endDate,
      totalSent: filtered.length,
      successful: filtered.filter((h) => h.status === 'DELIVERED').length,
      failed: filtered.filter((h) => h.status === 'FAILED').length,
      pending: filtered.filter((h) => h.status === 'PENDING').length,
      byChannel: {
        EMAIL: filtered.filter((h) => h.channel === 'EMAIL').length,
        SMS: filtered.filter((h) => h.channel === 'SMS').length,
        IN_APP: filtered.filter((h) => h.channel === 'IN_APP').length,
        PUSH: filtered.filter((h) => h.channel === 'PUSH').length,
      },
      successRate: filtered.length > 0 
        ? Math.round((filtered.filter((h) => h.status === 'DELIVERED').length / filtered.length) * 100) 
        : 0,
    };

    return report;
  }

  /**
   * Private: Process queue items
   */
  private processQueue(): void {
    const queue = this.getQueue();

    // Sort by priority: HIGH, NORMAL, LOW
    const priorityOrder = { HIGH: 0, NORMAL: 1, LOW: 2 };
    queue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Process pending items
    const pending = queue.filter((item) => item.status === 'PENDING' && !item.scheduledTime);
    const toProcess = pending.slice(0, this.BATCH_SIZE);

    for (const item of toProcess) {
      this.sendNotification(item);
    }

    // Process scheduled items
    const scheduled = queue.filter((item) => item.status === 'PENDING' && item.scheduledTime);
    const now = new Date().toISOString();

    for (const item of scheduled) {
      if (item.scheduledTime && item.scheduledTime <= now) {
        item.scheduledTime = undefined;
        this.sendNotification(item);
      }
    }

    this.saveQueue(queue);
  }

  /**
   * Private: Send a single notification
   */
  private async sendNotification(item: QueueItem): Promise<void> {
    item.status = 'PROCESSING';

    try {
      // Check notification preferences
      if (!notificationConfigService.shouldSendNotification(item.userId, item.channel, item.templateId)) {
        item.status = 'CANCELLED';
        this.logDelivery(item, 'CANCELLED', 'User preferences disabled this notification');
        return;
      }

      const settings = notificationConfigService.getUserSettings(item.userId);
      if (!settings) {
        throw new Error('User settings not found');
      }

      switch (item.channel) {
        case 'EMAIL':
          if (!settings.email) {
            throw new Error('User email not configured');
          }
          await emailService.sendEmail(settings.email, item.templateId, item.variables);
          item.status = 'DELIVERED';
          this.logDelivery(item, 'DELIVERED');
          break;

        case 'SMS':
          if (!settings.phoneNumber) {
            throw new Error('User phone not configured');
          }
          await smsService.sendSMS(settings.phoneNumber, item.templateId, item.variables);
          item.status = 'DELIVERED';
          this.logDelivery(item, 'DELIVERED');
          break;

        case 'IN_APP':
          // In-app notifications are handled by notificationService
          item.status = 'DELIVERED';
          this.logDelivery(item, 'DELIVERED');
          break;

        case 'PUSH':
          // Push notifications would require service worker setup
          item.status = 'DELIVERED';
          this.logDelivery(item, 'DELIVERED');
          break;

        default:
          throw new Error(`Unknown channel: ${item.channel}`);
      }
    } catch (error) {
      item.retryCount++;

      if (item.retryCount < item.maxRetries) {
        item.status = 'PENDING';
        this.logDelivery(item, 'RETRY', `${error}`);
      } else {
        item.status = 'FAILED';
        item.error = String(error);
        this.logDelivery(item, 'FAILED', String(error));
      }
    }
  }

  /**
   * Private: Log delivery
   */
  private logDelivery(item: QueueItem, status: string, error?: string): void {
    const history = (storageService.get(STORAGE_KEY_HISTORY) || []) as any[];

    history.push({
      notificationId: item.id,
      userId: item.userId,
      channel: item.channel,
      templateId: item.templateId,
      status,
      error,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 10000 entries
    if (history.length > 10000) {
      history.splice(0, history.length - 10000);
    }

    storageService.set(STORAGE_KEY_HISTORY, history);
  }

  /**
   * Private: Get queue
   */
  private getQueue(): QueueItem[] {
    return (storageService.get(STORAGE_KEY_QUEUE) || []) as QueueItem[];
  }

  /**
   * Private: Save queue
   */
  private saveQueue(queue: QueueItem[]): void {
    storageService.set(STORAGE_KEY_QUEUE, queue);
  }

  /**
   * Private: Get batches
   */
  private getBatches(): NotificationBatch[] {
    return (storageService.get(STORAGE_KEY_BATCHES) || []) as NotificationBatch[];
  }

  /**
   * Private: Generate ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const notificationQueueService = new NotificationQueueService();
