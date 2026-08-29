import React, { useState } from 'react';
import { dbService } from '../services/dbService';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Database
} from 'lucide-react';

export const DataManagement: React.FC = () => {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleExport = () => {
    try {
      setSuccessMsg('');
      setErrorMsg('');
      
      const dataStr = dbService.exportJSON();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `mtams_database_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccessMsg('Database backup exported successfully.');
    } catch (e) {
      setErrorMsg('Failed to export database backup.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccessMsg('');
    setErrorMsg('');

    const fileReader = new FileReader();
    const files = e.target.files;
    
    if (files && files.length > 0) {
      fileReader.readAsText(files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const result = dbService.importJSON(content);
          
          if (result.success) {
            setSuccessMsg('Database imported successfully. Reloading view...');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            setErrorMsg(result.error || 'Failed to import JSON data.');
          }
        } catch (err) {
          setErrorMsg('Invalid file format: parsing failed.');
        }
      };
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the database? This will overwrite all custom logs, notes, treatments, and restore the initial 10-patient synthetic demo data.')) {
      setIsResetting(true);
      try {
        dbService.reset();
        setSuccessMsg('Database successfully reset to default seed data. Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (e) {
        setErrorMsg('Failed to reset database.');
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Local Data & System Backup
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
          Export clinical records, import structured backups, and reset synthetic demo databases.
        </p>
      </div>

      {/* Status Alerts */}
      {successMsg && (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl text-sm text-green-700 dark:text-green-400 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-sm text-red-700 dark:text-red-400 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Export Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between h-64">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Export Local Backup</h3>
            <p className="text-xs text-gray-550 dark:text-gray-400 mt-1.5 leading-relaxed">
              Compile and download the complete local patient clinical records database, including schedules, treatments, notes, audit logs, and settings.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer text-sm transition shadow-sm"
          >
            Download Database JSON
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between h-64">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Import Clinical Backup</h3>
            <p className="text-xs text-gray-550 dark:text-gray-400 mt-1.5 leading-relaxed">
              Upload a previously exported database backup JSON file to restore settings, logs, and clinical records. <strong>Warning:</strong> This will replace all current workspace state.
            </p>
          </div>
          
          <label className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer text-sm text-center transition shadow-sm">
            <span>Choose Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {/* Reset Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between h-64 border-red-100 dark:border-red-950/20">
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-650 flex items-center justify-center mb-4">
              <RefreshCw className={`w-5 h-5 ${isResetting ? 'animate-spin' : ''}`} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Reset Database System</h3>
            <p className="text-xs text-gray-550 dark:text-gray-400 mt-1.5 leading-relaxed">
              Purge all custom records, timing logs, scheduling configurations, and restore the default 10-patient clinical database seed values.
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer text-sm transition shadow-md shadow-red-500/10 disabled:opacity-50"
          >
            Reset Seed Data
          </button>
        </div>

      </div>

      {/* Safety Notice Panel */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3 leading-relaxed">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">⚠️ Data Security & Local-First Isolation Notice</span>
          All data generated inside the Medication & Treatment Adherence Management System (MTAMS) is stored strictly in your browser's local sandbox storage (`localStorage`). No clinical data is ever uploaded to any cloud backend or remote server. Keeping backup exports is recommended to safeguard your workspace configurations.
        </div>
      </div>

    </div>
  );
};

export default DataManagement;
