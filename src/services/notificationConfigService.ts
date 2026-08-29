/**
 * Notification Configuration Service
 * Manages user notification preferences for email, SMS, and in-app notifications
 */

import { storageService } from './storageService';
import type {
  NotificationPreferences,
  NotificationChannel,
  NotificationRule,
  UserNotificationSettings,
} from '../types';

const STORAGE_KEY_PREFERENCES = 'notification_preferences';
const STORAGE_KEY_SETTINGS = 'notification_settings';
const STORAGE_KEY_RULES = 'notification_rules';

// Default notification preferences per channel
const DEFAULT_PREFERENCES: Record<NotificationChannel, Record<string, boolean>> = {
  EMAIL: {
    MISSED_DOSE: true,
    APPOINTMENT_REMINDER: true,
    LOW_ADHERENCE_ALERT: true,
    PRESCRIPTION_READY: true,
    TREATMENT_MILESTONE: true,
    FOLLOW_UP_REMINDER: true,
    SYSTEM_ALERT: true,
    WEEKLY_SUMMARY: false,
    REFILL_REMINDER: true,
  },
  SMS: {
    MISSED_DOSE: true,
    APPOINTMENT_REMINDER: true,
    LOW_ADHERENCE_ALERT: false,
    PRESCRIPTION_READY: false,
    TREATMENT_MILESTONE: false,
    FOLLOW_UP_REMINDER: true,
    SYSTEM_ALERT: false,
    WEEKLY_SUMMARY: false,
    REFILL_REMINDER: true,
  },
  IN_APP: {
    MISSED_DOSE: true,
    APPOINTMENT_REMINDER: true,
    LOW_ADHERENCE_ALERT: true,
    PRESCRIPTION_READY: true,
    TREATMENT_MILESTONE: true,
    FOLLOW_UP_REMINDER: true,
    SYSTEM_ALERT: true,
    WEEKLY_SUMMARY: true,
    REFILL_REMINDER: true,
  },
  PUSH: {
    MISSED_DOSE: false,
    APPOINTMENT_REMINDER: false,
    LOW_ADHERENCE_ALERT: false,
    PRESCRIPTION_READY: false,
    TREATMENT_MILESTONE: false,
    FOLLOW_UP_REMINDER: false,
    SYSTEM_ALERT: false,
    WEEKLY_SUMMARY: false,
    REFILL_REMINDER: false,
  },
};

class NotificationConfigService {
  /**
   * Initialize default preferences for user
   */
  initializeUserPreferences(userId: string, email?: string, phoneNumber?: string): UserNotificationSettings {
    const existingSettings = this.getUserSettings(userId);
    if (existingSettings) {
      return existingSettings;
    }

    const settings: UserNotificationSettings = {
      userId,
      email: email || null,
      phoneNumber: phoneNumber || null,
      emailEnabled: !!email,
      smsEnabled: !!phoneNumber,
      inAppEnabled: true,
      pushEnabled: false,
      preferences: this.getDefaultPreferences(),
      quiet_hours: {
        enabled: true,
        startTime: '22:00', // 10 PM
        endTime: '08:00', // 8 AM
      },
      digest_preferences: {
        enabled: true,
        frequency: 'DAILY', // IMMEDIATELY, DAILY, WEEKLY, MONTHLY
        time: '09:00',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.saveUserSettings(userId, settings);
    return settings;
  }

  /**
   * Get user notification settings
   */
  getUserSettings(userId: string): UserNotificationSettings | null {
    const allSettings = (storageService.get(STORAGE_KEY_SETTINGS) || []) as UserNotificationSettings[];
    return allSettings.find((s) => s.userId === userId) || null;
  }

  /**
   * Update user email address
   */
  updateUserEmail(userId: string, email: string): UserNotificationSettings | null {
    const settings = this.getUserSettings(userId);
    if (!settings) {
      return null;
    }

    settings.email = email;
    settings.emailEnabled = true;
    settings.updated_at = new Date().toISOString();

    this.saveUserSettings(userId, settings);
    return settings;
  }

  /**
   * Update user phone number
   */
  updateUserPhone(userId: string, phoneNumber: string): UserNotificationSettings | null {
    const settings = this.getUserSettings(userId);
    if (!settings) {
      return null;
    }

    settings.phoneNumber = phoneNumber;
    settings.smsEnabled = true;
    settings.updated_at = new Date().toISOString();

    this.saveUserSettings(userId, settings);
    return settings;
  }

  /**
   * Enable/disable notification channel
   */
  setChannelEnabled(userId: string, channel: NotificationChannel, enabled: boolean): boolean {
    const settings = this.getUserSettings(userId);
    if (!settings) {
      return false;
    }

    switch (channel) {
      case 'EMAIL':
        settings.emailEnabled = enabled;
        break;
      case 'SMS':
        settings.smsEnabled = enabled;
        break;
      case 'IN_APP':
        settings.inAppEnabled = enabled;
        break;
      case 'PUSH':
        settings.pushEnabled = enabled;
        break;
    }

    settings.updated_at = new Date().toISOString();
    this.saveUserSettings(userId, settings);
    return true;
  }

  /**
   * Get preferences for a specific channel
   */
  getChannelPreferences(userId: string, channel: NotificationChannel): Record<string, boolean> | null {
    const settings = this.getUserSettings(userId);
    if (!settings) {
      return null;
    }

    return settings.preferences[channel] || null;
  }

  /**
   * Update notification type preference for a channel
   */
  setNotificationPreference(
    userId: string,
    channel: NotificationChannel,
    notificationType: string,
    enabled: boolean
  ): boolean {
    const settings = this.getUserSettings(userId);
    if (!settings) {
      return false;
    }

    if (!settings.preferences[channel]) {
      settings.preferences[channel] = {};
    }

    settings.preferences[channel][notificationType] = enabled;
    settings.updated_at = new Date().toISOString();

    this.saveUserSettings(userId, settings);
    return true;
  }

  /**
   * Update quiet hours (no notifications outside business hours)
   */
  setQuietHours(
    userId: string,
    enabled: boolean,
    startTime?: string,
    endTime?: string
  ): UserNotificationSettings | null {
    const settings = this.getUserSettings(userId);
    if (!settings) {
      return null;
    }

    settings.quiet_hours.enabled = enabled;
    if (startTime) settings.quiet_hours.startTime = startTime;
    if (endTime) settings.quiet_hours.endTime = endTime;
    settings.updated_at = new Date().toISOString();

    this.saveUserSettings(userId, settings);
    return settings;
  }

  /**
   * Check if current time is within quiet hours
   */
  isInQuietHours(userId: string): boolean {
    const settings = this.getUserSettings(userId);
    if (!settings || !settings.quiet_hours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const startTime = settings.quiet_hours.startTime;
    const endTime = settings.quiet_hours.endTime;

    // Handle case where quiet hours span midnight (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  /**
   * Update digest frequency
   */
  setDigestFrequency(
    userId: string,
    frequency: 'IMMEDIATELY' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
    time?: string
  ): UserNotificationSettings | null {
    const settings = this.getUserSettings(userId);
    if (!settings) {
      return null;
    }

    settings.digest_preferences.frequency = frequency;
    if (time) settings.digest_preferences.time = time;
    settings.updated_at = new Date().toISOString();

    this.saveUserSettings(userId, settings);
    return settings;
  }

  /**
   * Check if notification should be sent based on preferences
   */
  shouldSendNotification(
    userId: string,
    channel: NotificationChannel,
    notificationType: string
  ): boolean {
    const settings = this.getUserSettings(userId);
    if (!settings) {
      return false;
    }

    // Check if channel is enabled
    switch (channel) {
      case 'EMAIL':
        if (!settings.emailEnabled || !settings.email) return false;
        break;
      case 'SMS':
        if (!settings.smsEnabled || !settings.phoneNumber) return false;
        break;
      case 'IN_APP':
        if (!settings.inAppEnabled) return false;
        break;
      case 'PUSH':
        if (!settings.pushEnabled) return false;
        break;
    }

    // Check quiet hours (not applicable to IN_APP immediate notifications typically)
    if (channel !== 'IN_APP' && this.isInQuietHours(userId)) {
      return false;
    }

    // Check notification type preference
    const preferences = settings.preferences[channel];
    if (!preferences) {
      return false;
    }

    return preferences[notificationType] !== false;
  }

  /**
   * Create a custom notification rule
   */
  createRule(
    userId: string,
    name: string,
    trigger: string,
    actions: NotificationChannel[],
    condition?: Record<string, any>
  ): NotificationRule {
    const rule: NotificationRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      trigger,
      actions,
      condition: condition || {},
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    const rules = this.getAllRules();
    rules.push(rule);
    storageService.set(STORAGE_KEY_RULES, rules);

    return rule;
  }

  /**
   * Get all rules for user
   */
  getUserRules(userId: string): NotificationRule[] {
    const allRules = (storageService.get(STORAGE_KEY_RULES) || []) as NotificationRule[];
    return allRules.filter((r) => r.userId === userId);
  }

  /**
   * Get all rules
   */
  getAllRules(): NotificationRule[] {
    return (storageService.get(STORAGE_KEY_RULES) || []) as NotificationRule[];
  }

  /**
   * Update rule
   */
  updateRule(ruleId: string, updates: Partial<NotificationRule>): NotificationRule | null {
    const rules = this.getAllRules();
    const index = rules.findIndex((r) => r.id === ruleId);

    if (index === -1) {
      return null;
    }

    rules[index] = { ...rules[index], ...updates, id: ruleId };
    storageService.set(STORAGE_KEY_RULES, rules);

    return rules[index];
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId: string): boolean {
    const rules = this.getAllRules();
    const index = rules.findIndex((r) => r.id === ruleId);

    if (index === -1) {
      return false;
    }

    rules.splice(index, 1);
    storageService.set(STORAGE_KEY_RULES, rules);
    return true;
  }

  /**
   * Get all user settings
   */
  getAllUserSettings(): UserNotificationSettings[] {
    return (storageService.get(STORAGE_KEY_SETTINGS) || []) as UserNotificationSettings[];
  }

  /**
   * Export user preferences (for data export)
   */
  exportPreferences(userId: string): UserNotificationSettings | null {
    return this.getUserSettings(userId);
  }

  /**
   * Import user preferences
   */
  importPreferences(userId: string, preferences: UserNotificationSettings): boolean {
    preferences.userId = userId;
    preferences.updated_at = new Date().toISOString();
    this.saveUserSettings(userId, preferences);
    return true;
  }

  /**
   * Reset preferences to defaults
   */
  resetToDefaults(userId: string): UserNotificationSettings | null {
    const settings = this.getUserSettings(userId);
    if (!settings) {
      return null;
    }

    settings.preferences = this.getDefaultPreferences();
    settings.updated_at = new Date().toISOString();

    this.saveUserSettings(userId, settings);
    return settings;
  }

  /**
   * Private: Save user settings
   */
  private saveUserSettings(userId: string, settings: UserNotificationSettings): void {
    const allSettings = (storageService.get(STORAGE_KEY_SETTINGS) || []) as UserNotificationSettings[];
    const index = allSettings.findIndex((s) => s.userId === userId);

    if (index >= 0) {
      allSettings[index] = settings;
    } else {
      allSettings.push(settings);
    }

    storageService.set(STORAGE_KEY_SETTINGS, allSettings);
  }

  /**
   * Private: Get default preferences structure
   */
  private getDefaultPreferences(): Record<NotificationChannel, Record<string, boolean>> {
    return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
  }
}

export const notificationConfigService = new NotificationConfigService();
