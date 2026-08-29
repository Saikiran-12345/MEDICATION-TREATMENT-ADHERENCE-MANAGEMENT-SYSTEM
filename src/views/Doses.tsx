import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { doseService } from '../services/doseService';
import { patientService } from '../services/patientService';
import { medicationService } from '../services/medicationService';
import type { DoseRecord, Patient, Medication, DoseStatus } from '../types';
import { 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Undo2, 
  AlertTriangle, 
  Clock
} from 'lucide-react';

export const Doses: React.FC = () => {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';

  // State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    return isPatient ? (user?.patientId || '') : 'pat-1';
  });
  const [doses, setDoses] = useState<DoseRecord[]>(() => doseService.getAll());
  
  // Missed Dose Modal State
  const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);
  const [activeDoseId, setActiveDoseId] = useState<string | null>(null);
  const [missedReason, setMissedReason] = useState<'FORGOT' | 'TRAVEL' | 'SCHEDULE_CONFLICT' | 'UNAVAILABLE' | 'OTHER'>('FORGOT');
  const [missedNote, setMissedNote] = useState('');

  // Domain lookups
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);
  const medications = useMemo<Medication[]>(() => medicationService.getAll(), []);

  const getMedicationDetails = (medId: string) => {
    const med = medications.find(m => m.id === medId);
    return med ? { name: med.name, dosage: med.dosage, instructions: med.instructions } : { name: 'Medication', dosage: '', instructions: '' };
  };

  // Change Date Helpers
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Filter doses for selected patient and date
  const filteredDoses = useMemo(() => {
    return doses.filter(d => d.patientId === selectedPatientId && d.scheduledDate === selectedDate);
  }, [doses, selectedPatientId, selectedDate]);

  // Group doses by time periods (Morning: 04:00 - 11:59, Afternoon: 12:00 - 17:59, Evening/Night: 18:00 - 03:59)
  const groupedDoses = useMemo(() => {
    const morning: DoseRecord[] = [];
    const afternoon: DoseRecord[] = [];
    const night: DoseRecord[] = [];

    filteredDoses.forEach(dose => {
      const hour = parseInt(dose.scheduledTime.split(':')[0]);
      if (hour >= 4 && hour < 12) {
        morning.push(dose);
      } else if (hour >= 12 && hour < 18) {
        afternoon.push(dose);
      } else {
        night.push(dose);
      }
    });

    // Sort chronologically within groups
    const sortByTime = (a: DoseRecord, b: DoseRecord) => a.scheduledTime.localeCompare(b.scheduledTime);

    return {
      morning: morning.sort(sortByTime),
      afternoon: afternoon.sort(sortByTime),
      night: night.sort(sortByTime)
    };
  }, [filteredDoses]);

  // Mark Taken
  const handleMarkTaken = (id: string) => {
    doseService.updateStatus(id, 'TAKEN');
    setDoses(doseService.getAll());
  };

  // Open Missed Dialog
  const handleOpenMissed = (id: string) => {
    setActiveDoseId(id);
    setMissedReason('FORGOT');
    setMissedNote('');
    setIsMissedModalOpen(true);
  };

  // Submit Missed Dose Reason
  const handleConfirmMissed = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeDoseId) {
      doseService.updateStatus(activeDoseId, 'MISSED', undefined, missedReason, missedNote);
      setDoses(doseService.getAll());
      setIsMissedModalOpen(false);
      setActiveDoseId(null);
    }
  };

  // Mark Skipped
  const handleMarkSkipped = (id: string) => {
    doseService.updateStatus(id, 'SKIPPED');
    setDoses(doseService.getAll());
  };

  // Undo Status
  const handleUndo = (id: string) => {
    doseService.updateStatus(id, 'SCHEDULED');
    setDoses(doseService.getAll());
  };

  const getBadgeStyle = (status: DoseStatus) => {
    switch (status) {
      case 'TAKEN':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400';
      case 'MISSED':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400';
      case 'SKIPPED':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const renderDoseCard = (dose: DoseRecord) => {
    const medInfo = getMedicationDetails(dose.medicationId);
    
    return (
      <div 
        key={dose.id} 
        className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 dark:text-white text-base">{medInfo.name}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-bold text-gray-700 dark:text-gray-300">
                {medInfo.dosage}
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-normal">
              {medInfo.instructions}
            </p>
            <div className="flex items-center gap-1.5 mt-2 font-mono text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              Scheduled for: <span className="font-bold text-gray-700 dark:text-gray-300">{dose.scheduledTime}</span>
            </div>
            
            {dose.status === 'MISSED' && (
              <div className="mt-3 text-xs bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 p-2.5 rounded-xl text-red-800 dark:text-red-300 flex items-start gap-2 max-w-md">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Reason: {dose.reasonForMissed}</span>
                  {dose.reasonNote && <p className="mt-0.5">{dose.reasonNote}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeStyle(dose.status)}`}>
            {dose.status}
          </span>

          {dose.status === 'SCHEDULED' ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkTaken(dose.id)}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded-xl cursor-pointer text-xs transition"
              >
                <Check className="w-3.5 h-3.5" /> Taken
              </button>
              <button
                onClick={() => handleOpenMissed(dose.id)}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-xl cursor-pointer text-xs transition"
              >
                <X className="w-3.5 h-3.5" /> Missed
              </button>
              <button
                onClick={() => handleMarkSkipped(dose.id)}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-xl cursor-pointer text-xs transition"
              >
                Skip
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleUndo(dose.id)}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-1.5 px-3 rounded-xl cursor-pointer text-xs transition"
              title="Reset dose back to Scheduled"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Date Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Dose Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Log medication dosages, mark completions, and record adherence notes.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shrink-0 self-center">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3 font-semibold text-sm text-gray-700 dark:text-gray-200">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{selectedDate}</span>
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Patient Selector (staff/admin only) */}
      {!isPatient && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">Selected Patient:</span>
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

      {/* Daily Tracker Timelines */}
      <div className="space-y-6">
        
        {/* Morning Segment */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3.5">🌅 Morning Timings (04:00 - 11:59)</h3>
          <div className="space-y-4">
            {groupedDoses.morning.length > 0 ? (
              groupedDoses.morning.map(renderDoseCard)
            ) : (
              <div className="p-4 bg-gray-50/50 dark:bg-gray-850 border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 rounded-xl">
                No morning doses scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Afternoon Segment */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3.5">☀️ Afternoon Timings (12:00 - 17:59)</h3>
          <div className="space-y-4">
            {groupedDoses.afternoon.length > 0 ? (
              groupedDoses.afternoon.map(renderDoseCard)
            ) : (
              <div className="p-4 bg-gray-50/50 dark:bg-gray-850 border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 rounded-xl">
                No afternoon doses scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Evening / Night Segment */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3.5">🌙 Night Timings (18:00 - 03:59)</h3>
          <div className="space-y-4">
            {groupedDoses.night.length > 0 ? (
              groupedDoses.night.map(renderDoseCard)
            ) : (
              <div className="p-4 bg-gray-50/50 dark:bg-gray-850 border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 rounded-xl">
                No night doses scheduled.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Missed Dose Reason Modal */}
      {isMissedModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700 animate-slide-up">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-red-50/50 dark:bg-red-950/20">
              <h2 className="text-sm font-bold text-red-800 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Mark Missed Dose Reason
              </h2>
              <button
                onClick={() => setIsMissedModalOpen(false)}
                className="text-gray-400 hover:text-gray-650 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMissed} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Select Reason *
                </label>
                <select
                  value={missedReason}
                  onChange={(e) => setMissedReason(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="FORGOT">Forgot</option>
                  <option value="TRAVEL">Travel / Flight</option>
                  <option value="SCHEDULE_CONFLICT">Schedule Conflict / Busy</option>
                  <option value="UNAVAILABLE">Medication Unavailable / Refill Pending</option>
                  <option value="OTHER">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Explanation Notes
                </label>
                <textarea
                  value={missedNote}
                  onChange={(e) => setMissedNote(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-red-500"
                  placeholder="e.g. Woke up late..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsMissedModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-semibold cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-red-500/10 text-sm"
                >
                  Mark Missed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Doses;
