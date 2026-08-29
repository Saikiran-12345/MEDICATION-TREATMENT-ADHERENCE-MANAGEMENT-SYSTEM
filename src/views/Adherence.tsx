import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';
import { doseService } from '../services/doseService';
import { analyticsService } from '../services/analyticsService';
import type { Patient, DoseRecord } from '../types';
import { 
  Award, 
  CheckCircle2, 
  Calendar, 
  Flame, 
  CalendarDays,
  Activity
} from 'lucide-react';

export const Adherence: React.FC = () => {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);

  // State
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    return isPatient ? (user?.patientId || '') : 'pat-1';
  });
  const [doses] = useState<DoseRecord[]>(() => doseService.getAll());

  const patient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Calculations
  const stats = useMemo(() => {
    return analyticsService.getPatientAnalytics(selectedPatientId);
  }, [selectedPatientId]);

  // Generate last 28 days list for compliance calendar matrix
  const matrixDays = useMemo(() => {
    const list = [];
    const today = new Date();
    
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Get doses for this day
      const dayDoses = doses.filter(ds => ds.patientId === selectedPatientId && ds.scheduledDate === dateStr);
      
      let status: 'NONE' | 'ALL_TAKEN' | 'ANY_MISSED' | 'SKIPPED' = 'NONE';
      
      if (dayDoses.length > 0) {
        const hasMissed = dayDoses.some(ds => ds.status === 'MISSED');
        const hasTaken = dayDoses.some(ds => ds.status === 'TAKEN');
        const allTrackedTaken = dayDoses.filter(ds => ds.status === 'TAKEN' || ds.status === 'MISSED').every(ds => ds.status === 'TAKEN');
        
        if (hasMissed) {
          status = 'ANY_MISSED';
        } else if (hasTaken && allTrackedTaken) {
          status = 'ALL_TAKEN';
        } else {
          status = 'SKIPPED';
        }
      }
      
      list.push({
        dateStr,
        dayOfMonth: d.getDate(),
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
        status,
        dayDoses
      });
    }
    return list;
  }, [doses, selectedPatientId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ALL_TAKEN':
        return 'bg-green-500 text-white';
      case 'ANY_MISSED':
        return 'bg-red-500 text-white';
      case 'SKIPPED':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Adherence Tracker
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
          {isPatient ? 'Your compliance statistics, streaks, and tracked dates calendar' : `Review adherence records for: ${patient?.name || 'Patient'}`}
        </p>
      </div>

      {/* Patient Selector (staff/admin only) */}
      {!isPatient && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">Select Patient Profile:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="block w-full max-w-xs px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-sm font-semibold"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Adherence Rate */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase block">Adherence Rate</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white mt-1.5 block">{stats.adherence}%</span>
            <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider block font-bold">{stats.riskLevel}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase block">Current Streak</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white mt-1.5 block">{stats.currentStreak} Days</span>
            <span className="text-[10px] text-gray-400 mt-1 block">Consecutive completions</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-455 flex items-center justify-center">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Best Streak */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase block">Best Streak</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white mt-1.5 block">{stats.bestStreak} Days</span>
            <span className="text-[10px] text-gray-400 mt-1 block">Personal record</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Total Logs */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase block">Total Logged Doses</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white mt-1.5 block">{stats.completedDoses + stats.missedDoses} Doses</span>
            <span className="text-[10px] text-gray-450 mt-1 block">Taken: {stats.completedDoses} | Missed: {stats.missedDoses}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Grid: Calendar Matrix & Help Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance Calendar (28 Days) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-5 h-5 text-blue-600" /> Compliance Activity Grid
          </h3>
          <p className="text-xs text-gray-400 mb-6">Daily logging history tracking patient schedules for the last 28 days.</p>

          <div className="grid grid-cols-7 gap-3 text-center">
            {matrixDays.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">{day.dayOfWeek}</span>
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${getStatusColor(day.status)}`}
                  title={`${day.dateStr}: ${day.dayDoses.length} doses scheduled.`}
                >
                  {day.dayOfMonth}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Legend */}
          <div className="flex justify-start gap-4 text-[10px] font-bold text-gray-500 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-green-500 shrink-0"></span> All Taken
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-500 shrink-0"></span> Any Missed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0"></span> Skipped
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-gray-100 dark:bg-gray-700 shrink-0"></span> No Schedule
            </span>
          </div>
        </div>

        {/* Adherence Guide and Disclaimer */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-blue-600" /> Adherence Education
            </h3>
            <div className="space-y-3.5 text-xs text-gray-600 dark:text-gray-400 leading-normal">
              <p>
                <strong>What is Adherence?</strong> It measures how closely you follow your prescribed medication schedules. High adherence (above 80%) is critical to achieve optimal clinical outcomes.
              </p>
              <p>
                <strong>Building a Streak:</strong> Logging your medication as TAKEN consecutively builds your daily streak! Consistent daily routines reduce forgotten timings.
              </p>
              <p>
                <strong>Logging Missed Doses:</strong> Documenting missed doses helps healthcare providers customize treatment plans if schedules conflict with daily activities.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/20 text-[10px] text-amber-800 dark:text-amber-300 rounded-xl leading-normal mt-6">
            ⚠️ <span className="font-semibold">Disclaimer:</span> Compliance stats are for informational logging only. Consultation with clinical professionals is required for medical changes.
          </div>
        </div>

      </div>

    </div>
  );
};

export default Adherence;
