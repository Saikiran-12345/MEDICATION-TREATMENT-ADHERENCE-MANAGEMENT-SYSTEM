import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { KEYS, dbService } from '../services/dbService';
import type { ActivityLog } from '../types';
import { 
  FileSpreadsheet, 
  Trash2, 
  Search, 
  ShieldAlert, 
  Download
} from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    return storageService.get<ActivityLog[]>(KEYS.ACTIVITY_LOGS, []);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | string>('ALL');

  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    logs.forEach(l => {
      if (l.action) actions.add(l.action);
    });
    return Array.from(actions);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = 
        l.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.details && l.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.action.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, actionFilter]);

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `mtams_audit_logs_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      dbService.logActivity('ADMIN', 'Audit Logs Exported', 'User downloaded the complete JSON audit logs.');
    } catch (e) {
      alert('Failed to export audit logs');
    }
  };

  const handleClear = () => {
    if (window.confirm('WARNING: You are about to clear all compliance audit logs. This action cannot be undone. Proceed?')) {
      storageService.set(KEYS.ACTIVITY_LOGS, []);
      dbService.logActivity('ADMIN', 'Audit Logs Purged', 'User cleared compliance audit logs.');
      setLogs(storageService.get<ActivityLog[]>(KEYS.ACTIVITY_LOGS, []));
    }
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('purge') || act.includes('reset') || act.includes('missed')) {
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
    }
    if (act.includes('create') || act.includes('add') || act.includes('import')) {
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400';
    }
    if (act.includes('update') || act.includes('edit')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Compliance Audit Trail
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            System logs recording clinical modifications, authentications, and user database actions.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-850 dark:text-gray-200 font-semibold py-2 px-3.5 rounded-xl cursor-pointer text-xs transition"
          >
            <Download className="w-4 h-4" /> Export logs
          </button>
          
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3.5 rounded-xl cursor-pointer text-xs transition shadow-md shadow-red-500/10"
          >
            <Trash2 className="w-4 h-4" /> Clear Logs
          </button>
        </div>
      </div>

      {/* Searching / Filtering Controls */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search logs by user, action, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
          />
        </div>

        {/* Filter Action */}
        <div className="w-full md:w-64">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all cursor-pointer"
          >
            <option value="ALL">All Logged Actions</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Responsible Agent</th>
                <th className="py-4 px-6">Event Action</th>
                <th className="py-4 px-6">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-xs text-gray-750 dark:text-gray-350 font-mono">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap text-gray-400 dark:text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-gray-850 dark:text-gray-300">
                      {log.userId}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border uppercase ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-gray-600 dark:text-gray-400 leading-normal max-w-md break-all">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400 font-sans text-sm">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    No audit records logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ActivityLogView;
