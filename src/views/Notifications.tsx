import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types';
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  AlertTriangle, 
  Calendar, 
  Heart,
  Mail,
  Info
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    return user ? notificationService.getAll(user.id) : [];
  });

  const getUnreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const handleMarkRead = (id: string) => {
    notificationService.markAsRead(id);
    if (user) {
      setNotifications(notificationService.getAll(user.id));
    }
  };

  const handleMarkAllRead = () => {
    if (user) {
      notificationService.markAllAsRead(user.id);
      setNotifications(notificationService.getAll(user.id));
    }
  };

  const handleDelete = (id: string) => {
    notificationService.delete(id);
    if (user) {
      setNotifications(notificationService.getAll(user.id));
    }
  };

  const getCategoryIcon = (type: Notification['type']) => {
    switch (type) {
      case 'MISSED_DOSE':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'FOLLOW_UP':
        return <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'TREATMENT_END':
        return <Heart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getCategoryStyle = (type: Notification['type'], isRead: boolean) => {
    if (isRead) return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70';
    
    switch (type) {
      case 'MISSED_DOSE':
        return 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30';
      case 'FOLLOW_UP':
        return 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30';
      case 'TREATMENT_END':
        return 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30';
      default:
        return 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Notifications Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Review status updates, missed schedule alerts, and consultation reminders.
          </p>
        </div>

        {getUnreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-850 dark:text-gray-200 font-semibold py-2 px-4 rounded-xl cursor-pointer text-xs transition"
          >
            <CheckCheck className="w-4.5 h-4.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm transition-all ${getCategoryStyle(notif.type, notif.isRead)}`}
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-gray-800">
                {getCategoryIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`text-sm uppercase tracking-wider ${notif.isRead ? 'font-semibold text-gray-600 dark:text-gray-450' : 'font-black text-gray-900 dark:text-white'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 shrink-0">
                    {new Date(notif.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm mt-1.5 leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                  {notif.message}
                </p>
                
                <div className="flex justify-end gap-3 mt-4">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold py-1.5 px-3.5 rounded-xl cursor-pointer text-xs transition"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-green-600" /> Mark Read
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-1.5 text-gray-400 hover:text-red-650 dark:hover:bg-red-950/20 rounded cursor-pointer transition"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 py-12 text-center text-gray-400">
            <Mail className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No new messages or active warnings in your mailbox.
          </div>
        )}
      </div>

    </div>
  );
};

export default Notifications;
