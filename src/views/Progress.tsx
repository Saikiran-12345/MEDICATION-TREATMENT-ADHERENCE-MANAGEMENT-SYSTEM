import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';
import { treatmentService } from '../services/treatmentService';
import { medicationService } from '../services/medicationService';
import type { Patient, Treatment, Medication } from '../types';
import { 
  Hourglass, 
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Progress: React.FC = () => {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  
  // State
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    return isPatient ? (user?.patientId || '') : 'pat-1';
  });
  
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);
  const treatments = useMemo<Treatment[]>(() => treatmentService.getAll(), []);
  const medications = useMemo<Medication[]>(() => medicationService.getAll(), []);

  const patient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Filter treatments for selected patient
  const patientTreatments = useMemo(() => {
    return treatments.filter(t => t.patientId === selectedPatientId);
  }, [treatments, selectedPatientId]);

  const getMedicationsCount = (treatmentId: string) => {
    return medications.filter(m => m.treatmentId === treatmentId).length;
  };

  const calculateProgressMetrics = (t: Treatment) => {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    const today = new Date();
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    let daysCompleted = 0;

    if (today > end) {
      daysCompleted = totalDays;
    } else if (today > start) {
      daysCompleted = Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24));
    }

    const daysRemaining = Math.max(0, totalDays - daysCompleted);
    const percentTime = Math.min(100, Math.round((daysCompleted / totalDays) * 100));

    return {
      totalDays,
      daysCompleted,
      daysRemaining,
      percentTime
    };
  };

  const getProgressColor = (percent: number) => {
    if (percent === 100) return 'bg-green-600';
    if (percent > 50) return 'bg-blue-600';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Treatment Progress Timelines
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
          {isPatient ? 'Monitor your active treatment duration, elapsed days, and completions.' : `Monitor treatment timeline elapsed stats for: ${patient?.name || 'Patient'}`}
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

      {/* Treatments List */}
      <div className="space-y-6">
        {patientTreatments.length > 0 ? (
          patientTreatments.map((t) => {
            const metrics = calculateProgressMetrics(t);
            const medCount = getMedicationsCount(t.id);
            
            return (
              <div 
                key={t.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4 hover:shadow-md transition duration-200"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <Link 
                      to={`/treatments/${t.id}`}
                      className="text-lg font-bold text-gray-900 dark:text-white hover:text-blue-650 hover:underline flex items-center gap-1.5"
                    >
                      {t.name}
                    </Link>
                    <p className="text-xs text-gray-450 mt-0.5">
                      Course Validity: <span className="font-semibold">{t.startDate}</span> to <span className="font-semibold">{t.endDate}</span>
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    t.status === 'ACTIVE' 
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {t.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1"><Hourglass className="w-3.5 h-3.5 text-gray-455" /> Time Elapsed</span>
                    <span className="font-bold">{metrics.percentTime}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(metrics.percentTime)}`} 
                      style={{ width: `${metrics.percentTime}%` }}
                    />
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-gray-100 dark:border-gray-700/50">
                  <div>
                    <span className="text-gray-400 block">Total Duration</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{metrics.totalDays} Days</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Days Completed</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{metrics.daysCompleted} Days</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Days Remaining</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{metrics.daysRemaining} Days</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Medications Catalogued</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{medCount} Courses</span>
                  </div>
                </div>

                {/* Notes box */}
                {t.notes && (
                  <div className="bg-gray-50 dark:bg-gray-900/30 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/50 text-xs text-gray-600 dark:text-gray-450 leading-relaxed">
                    <span className="font-bold block mb-0.5 text-gray-750 dark:text-gray-300">Outcomes & Comments:</span>
                    {t.notes}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 py-12 text-center text-gray-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No treatment courses registered.
          </div>
        )}
      </div>

    </div>
  );
};

export default Progress;
