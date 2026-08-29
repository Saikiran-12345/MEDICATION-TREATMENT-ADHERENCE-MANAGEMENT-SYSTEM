import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  enableNotifications: true,
  dashboardPreferences: {
    showTrends: true,
    showQuickStats: true,
    showRecentActivity: true
  },
  dateFormat: 'YYYY-MM-DD'
};

export const settingsService = {
  get(): Settings {
    return storageService.get<Settings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  update(updates: Partial<Settings>): Settings {
    const current = this.get();
    const updated = { ...current, ...updates };
    storageService.set(KEYS.SETTINGS, updated);
    return updated;
  }
};
