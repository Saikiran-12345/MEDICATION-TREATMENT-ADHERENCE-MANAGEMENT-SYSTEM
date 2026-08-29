import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';
import { treatmentService } from '../services/treatmentService';
import { doseService } from '../services/doseService';
import { followUpService } from '../services/followUpService';
import { medicationService } from '../services/medicationService';
import type { Patient, Treatment, DoseRecord, FollowUp, Medication } from '../types';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Heart,
  CheckCircle,
  Pill
} from 'lucide-react';

interface LocalReminder {
  id: string;
  type: 'MEDICATION' | 'MISSED_DOSE' | 'FOLLOW_UP' | 'TREATMENT_END';
  title: string;
  message: string;
  dateStr: string;
  severity: 'low' | 'medium' | 'high';
}

export const Reminders: React.FC = () => {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const [patientId, setPatientId] = useState(() => {
    return isPatient ? (user?.patientId || '') : 'pat-1';
  });

  // State
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [doses] = useState<DoseRecord[]>(() => doseService.getAll());
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);
  const treatments = useMemo<Treatment[]>(() => treatmentService.getAll(), []);
  const followUps = useMemo<FollowUp[]>(() => followUpService.getAll(), []);
  const medications = useMemo<Medication[]>(() => medicationService.getAll(), []);

  const getPatientName = (id: string) => {
    const pat = patients.find(p => p.id === id);
    return pat ? pat.name : 'Patient';
  };

  const getMedicationName = (medId: string) => {
    const med = medications.find(m => m.id === medId);
    return med ? med.name : 'Medication';
  };

  // Compile reminders dynamically
  const activeReminders = useMemo(() => {
    const list: LocalReminder[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    // 1. Filter data for target patient
    const patDoses = doses.filter(d => d.patientId === patientId);
    const patTreatments = treatments.filter(t => t.patientId === patientId);
    const patFollowUps = followUps.filter(f => f.patientId === patientId);

    // Reminder 1: Upcoming Medication Today
    const todayScheduled = patDoses.filter(d => d.scheduledDate === todayStr && d.status === 'SCHEDULED');
    todayScheduled.forEach((dose, idx) => {
      const medName = getMedicationName(dose.medicationId);
      list.push({
        id: `rem-med-${dose.id}-${idx}`,
        type: 'MEDICATION',
        title: 'Upcoming Medication Dose',
        message: `Scheduled dose of ${medName} is due today at ${dose.scheduledTime}.`,
        dateStr: dose.scheduledDate,
        severity: 'medium'
      });
    });

    // Reminder 2: Missed Doses in the last 48 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const missedDoses = patDoses.filter(d => d.status === 'MISSED' && d.scheduledDate >= yesterdayStr);
    missedDoses.forEach((dose, idx) => {
      const medName = getMedicationName(dose.medicationId);
      list.push({
        id: `rem-missed-${dose.id}-${idx}`,
        type: 'MISSED_DOSE',
        title: 'Missed Dose Alert',
        message: `You missed your scheduled dose of ${medName} on ${dose.scheduledDate} at ${dose.scheduledTime}. Please resume your normal schedule, do not double dose.`,
        dateStr: dose.scheduledDate,
        severity: 'high'
      });
    });

    // Reminder 3: Upcoming Follow-ups in the next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const upcomingFups = patFollowUps.filter(f => f.status === 'SCHEDULED' && f.date >= todayStr && f.date <= nextWeekStr);
    upcomingFups.forEach((fup, idx) => {
      list.push({
        id: `rem-fup-${fup.id}-${idx}`,
        type: 'FOLLOW_UP',
        title: 'Upcoming Clinical Follow-up',
        message: `Scheduled check-in on ${fup.date} at ${fup.time} regarding: "${fup.purpose}".`,
        dateStr: fup.date,
        severity: 'medium'
      });
    });

    // Reminder 4: Treatments ending in the next 7 days
    const activeTreatments = patTreatments.filter(t => t.status === 'ACTIVE');
    activeTreatments.forEach((t, idx) => {
      const end = new Date(t.endDate);
      const timeDiff = end.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff >= 0 && daysDiff <= 7) {
        list.push({
          id: `rem-end-${t.id}-${idx}`,
          type: 'TREATMENT_END',
          title: 'Treatment Plan Ending Soon',
          message: `Your treatment plan "${t.name}" is scheduled to complete in ${daysDiff} days on ${t.endDate}.`,
          dateStr: t.endDate,
          severity: 'low'
        });
      }
    });

    // Filter out acknowledged items
    return list.filter(item => !acknowledged.includes(item.id));
  }, [doses, treatments, followUps, medications, patientId, acknowledged]);

  const handleAcknowledge = (id: string) => {
    setAcknowledged(prev => [...prev, id]);
  };

  const getSeverityStyle = (severity: LocalReminder['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300';
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-300';
    }
  };

  const getReminderIcon = (type: LocalReminder['type']) => {
    switch (type) {
      case 'MEDICATION':
        return <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'MISSED_DOSE':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'FOLLOW_UP':
        return <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'TREATMENT_END':
        return <Heart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Alerts & Reminders</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            {isPatient ? 'Your active timing notifications' : `Active reminders list for patient: ${getPatientName(patientId)}`}
          </p>
        </div>
      </div>

      {/* Patient Selector (staff/admin only) */}
      {!isPatient && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">Selected Patient:</span>
          <select
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setAcknowledged([]); // reset acknowledged on patient switch
            }}
            className="block w-full max-w-xs px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-sm font-semibold"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-4">
        {activeReminders.length > 0 ? (
          activeReminders.map((reminder) => (
            <div 
              key={reminder.id}
              className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm transition-all ${getSeverityStyle(reminder.severity)}`}
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-gray-800">
                {getReminderIcon(reminder.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">{reminder.title}</h3>
                  <span className="text-xs font-mono font-bold opacity-60 shrink-0">{reminder.dateStr}</span>
                </div>
                <p className="text-sm mt-1 leading-relaxed opacity-90">{reminder.message}</p>
                
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => handleAcknowledge(reminder.id)}
                    className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold py-1.5 px-4 rounded-xl cursor-pointer text-xs transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Dismiss / Acknowledge
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 py-12 text-center text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No active alerts or timing reminders.
          </div>
        )}
      </div>

    </div>
  );
};

export default Reminders;
