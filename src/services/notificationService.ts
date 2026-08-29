import { storageService } from './storageService';
import { KEYS } from './dbService';
import type { Notification } from '../types';

export const notificationService = {
  getAll(userId: string): Notification[] {
    const notifs = storageService.get<Notification[]>(KEYS.NOTIFICATIONS, []);
    return notifs.filter((n) => n.userId === userId);
  },

  create(userId: string, title: string, message: string, type: Notification['type']): Notification {
    const notifs = storageService.get<Notification[]>(KEYS.NOTIFICATIONS, []);
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      title,
      message,
      date: new Date().toISOString(),
      type,
      isRead: false
    };

    storageService.set(KEYS.NOTIFICATIONS, [newNotif, ...notifs]);
    return newNotif;
  },

  markAsRead(id: string): void {
    const notifs = storageService.get<Notification[]>(KEYS.NOTIFICATIONS, []);
    const index = notifs.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifs[index].isRead = true;
      storageService.set(KEYS.NOTIFICATIONS, notifs);
    }
  },

  markAllAsRead(userId: string): void {
    const notifs = storageService.get<Notification[]>(KEYS.NOTIFICATIONS, []);
    const updated = notifs.map((n) => {
      if (n.userId === userId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    storageService.set(KEYS.NOTIFICATIONS, updated);
  },

  delete(id: string): void {
    const notifs = storageService.get<Notification[]>(KEYS.NOTIFICATIONS, []);
    const filtered = notifs.filter((n) => n.id !== id);
    storageService.set(KEYS.NOTIFICATIONS, filtered);
  }
};
