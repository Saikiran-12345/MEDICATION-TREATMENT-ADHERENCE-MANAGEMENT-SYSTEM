import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { settingsService } from '../services/settingsService';
import type { Settings as SettingsType } from '../types';
import { 
  Settings2, 
  Sun, 
  Moon, 
  BellRing, 
  BellOff, 
  BarChart3, 
  Zap, 
  Activity,
  CheckCircle2,
  Download,
  User
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsType>(() => settingsService.get());
  const [saved, setSaved] = useState(false);

  const updateSetting = (updates: Partial<SettingsType>) => {
    const updated = settingsService.update(updates);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateDashPref = (key: keyof SettingsType['dashboardPreferences'], value: boolean) => {
    updateSetting({
      dashboardPreferences: {
        ...settings.dashboardPreferences,
        [key]: value
      }
    });
  };

  const handleExportPersonal = () => {
    if (!user) return;
    
    const allKeys = Object.keys(localStorage);
    const personalData: Record<string, unknown> = {};
    
    allKeys.forEach(key => {
      if (key.startsWith('mtams_')) {
        try {
          personalData[key] = JSON.parse(localStorage.getItem(key) || '""');
        } catch {
          personalData[key] = localStorage.getItem(key);
        }
      }
    });
    
    const blob = new Blob([JSON.stringify(personalData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mtams_personal_backup_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          System Settings & Preferences
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
          Customise your workspace appearance, notification preferences, and dashboard configuration.
        </p>
      </div>

      {/* Save confirmation */}
      {saved && (
        <div className="p-3.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">Settings saved successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Theme Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
            Appearance
          </h3>
          <p className="text-xs text-gray-400 mb-5">Toggle between light and dark themes for the application interface.</p>

          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
            <div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">Current Theme</span>
              <span className="text-xs text-gray-400 capitalize">{theme} mode active</span>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl cursor-pointer text-xs transition shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* Date Format Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
            <Zap className="w-5 h-5 text-amber-500" />
            Date Format
          </h3>
          <p className="text-xs text-gray-400 mb-5">Choose how dates are displayed across views and reports.</p>

          <div className="space-y-2.5">
            {(['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'] as const).map(fmt => (
              <label 
                key={fmt}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  settings.dateFormat === fmt 
                    ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800/50' 
                    : 'border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/60'
                }`}
              >
                <input
                  type="radio"
                  name="dateFormat"
                  value={fmt}
                  checked={settings.dateFormat === fmt}
                  onChange={() => updateSetting({ dateFormat: fmt })}
                  className="accent-blue-600"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fmt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
            {settings.enableNotifications ? <BellRing className="w-5 h-5 text-blue-500" /> : <BellOff className="w-5 h-5 text-gray-400" />}
            Notification Preferences
          </h3>
          <p className="text-xs text-gray-400 mb-5">Control whether system notifications and reminders are generated.</p>

          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
            <div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">Enable Notifications</span>
              <span className="text-xs text-gray-400">{settings.enableNotifications ? 'Active — system alerts are generated' : 'Disabled — no alerts generated'}</span>
            </div>
            <button
              onClick={() => updateSetting({ enableNotifications: !settings.enableNotifications })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition cursor-pointer ${
                settings.enableNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                  settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Dashboard Preferences Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Dashboard Widgets
          </h3>
          <p className="text-xs text-gray-400 mb-5">Toggle which sections display on the main Dashboard view.</p>

          <div className="space-y-3">
            {([
              { key: 'showTrends' as const, label: 'Adherence Trends Chart', icon: <Activity className="w-4 h-4 text-blue-500" /> },
              { key: 'showQuickStats' as const, label: 'Quick Statistics Cards', icon: <Zap className="w-4 h-4 text-amber-500" /> },
              { key: 'showRecentActivity' as const, label: 'Recent Activity Feed', icon: <BarChart3 className="w-4 h-4 text-emerald-500" /> },
            ]).map(item => (
              <div key={item.key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-xl p-3.5 border border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</span>
                </div>
                <button
                  onClick={() => updateDashPref(item.key, !settings.dashboardPreferences[item.key])}
                  className={`relative inline-flex h-6 w-10 items-center rounded-full transition cursor-pointer ${
                    settings.dashboardPreferences[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${
                      settings.dashboardPreferences[item.key] ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Personal Export Section (Patient self-service) */}
      {user?.role === 'PATIENT' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
            <User className="w-5 h-5 text-purple-500" />
            Personal Data Export
          </h3>
          <p className="text-xs text-gray-400 mb-5">Download a backup of your personal adherence records and settings as a JSON file.</p>
          
          <button
            onClick={handleExportPersonal}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl cursor-pointer text-sm transition shadow-sm"
          >
            <Download className="w-4 h-4" /> Download Personal Backup
          </button>
        </div>
      )}

      {/* Logged-in User Info */}
      <div className="bg-gray-50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Session Information</span>
        Logged in as <span className="font-semibold text-gray-800 dark:text-gray-200">{user?.username || 'Unknown'}</span> · 
        Role: <span className="font-semibold uppercase text-gray-800 dark:text-gray-200">{user?.role || 'N/A'}</span> · 
        All preferences are persisted in browser localStorage.
      </div>

    </div>
  );
};

export default Settings;
