import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { treatmentService } from '../services/treatmentService';
import { patientService } from '../services/patientService';
import { medicationService } from '../services/medicationService';
import { doseService } from '../services/doseService';
import { analyticsService } from '../services/analyticsService';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Pill, 
  Activity, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

export const TreatmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const doses = useMemo(() => doseService.getAll(), []);

  const treatment = useMemo(() => treatmentService.getById(id || ''), [id]);
  const patient = useMemo(() => {
    return treatment ? patientService.getById(treatment.patientId) : undefined;
  }, [treatment]);

  const medications = useMemo(() => {
    return treatment ? medicationService.getByTreatmentId(treatment.id) : [];
  }, [treatment]);

  // Filter doses specifically for this treatment
  const treatmentDoses = useMemo(() => {
    return doses.filter(d => d.treatmentId === id);
  }, [doses, id]);

  // Analytics Calculations
  const adherenceRate = useMemo(() => {
    return analyticsService.calculateAdherence(treatmentDoses);
  }, [treatmentDoses]);

  const adherenceLevel = useMemo(() => {
    return analyticsService.classifyAdherence(adherenceRate);
  }, [adherenceRate]);

  const progressMetrics = useMemo(() => {
    if (!treatment) return { totalDays: 0, daysCompleted: 0, daysRemaining: 0, percentTime: 0 };
    
    const start = new Date(treatment.startDate);
    const end = new Date(treatment.endDate);
    const today = new Date();
    
    const totalDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    let daysCompleted = 0;

    if (today > end) {
      daysCompleted = totalDuration;
    } else if (today > start) {
      daysCompleted = Math.ceil((today.getTime() - start.getTime()) / (1000 * 3600 * 24));
    }

    const daysRemaining = Math.max(0, totalDuration - daysCompleted);
    const percentTime = Math.min(100, Math.round((daysCompleted / totalDuration) * 100));

    return {
      totalDays: totalDuration,
      daysCompleted,
      daysRemaining,
      percentTime
    };
  }, [treatment]);

  if (!treatment) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Treatment Course Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">The treatment plan you are looking for does not exist or has been deleted.</p>
        <Link to="/treatments" className="mt-4 inline-flex items-center gap-1.5 text-blue-600 font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" /> Return to list
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const classes = status === 'ACTIVE' 
      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
      : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
        {status}
      </span>
    );
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH ADHERENCE':
        return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900/30';
      case 'MEDIUM ADHERENCE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/30';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Back link & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link to="/treatments" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <ArrowLeft className="w-4 h-4" /> Back to Treatments
        </Link>
        <div className="text-xs text-amber-600 dark:text-amber-400 max-w-sm text-right leading-tight">
          ⚠️ Administrative adherence indicator — not a medical risk assessment.
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{treatment.name}</h1>
              {getStatusBadge(treatment.status)}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Patient: <span className="font-semibold text-gray-800 dark:text-gray-200">{patient?.name || 'Loading...'}</span>
            </p>
          </div>

          {/* Adherence Gauge */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Treatment Adherence</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{adherenceRate}%</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getRiskBadge(adherenceLevel)}`}>
                {adherenceLevel}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic">Calculated from local logs</span>
          </div>
        </div>

        {/* Progress Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Total Duration</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{progressMetrics.totalDays} Days</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Days Completed</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{progressMetrics.daysCompleted} Days</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Days Remaining</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{progressMetrics.daysRemaining} Days</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Course Timeline Progress</span>
            <span className="font-bold">{progressMetrics.percentTime}% Elapsed</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressMetrics.percentTime}%` }}
            />
          </div>
        </div>

        {/* Notes */}
        {treatment.notes && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 text-sm">
            <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1">Target Outcomes & Notes</span>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{treatment.notes}</p>
          </div>
        )}
      </div>

      {/* Grid: Medications and Recent Doses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scheduled Medications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
              <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Scheduled Medications</h2>
            </div>
            
            <div className="space-y-4">
              {medications.length > 0 ? (
                medications.map(med => (
                  <div key={med.id} className="p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">{med.name}</span>
                      <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded ml-2 font-semibold">{med.dosage}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{med.instructions}</p>
                    </div>
                    <span className="text-xs text-gray-400 italic">ID: {med.id}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No medications linked to this treatment yet.
                </div>
              )}
            </div>
          </div>
          
          {/* Action to Medications */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/30 flex justify-end">
            <Link to="/medications" className="text-xs font-bold text-blue-600 hover:underline">
              Manage Medication Catalog &rarr;
            </Link>
          </div>
        </div>

        {/* Recent Dose Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Dose Timeline</h2>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {treatmentDoses.length > 0 ? (
                [...treatmentDoses].sort((a,b) => b.scheduledDate.localeCompare(a.scheduledDate) || b.scheduledTime.localeCompare(a.scheduledTime)).slice(0, 8).map(dose => {
                  const medication = medications.find(m => m.id === dose.medicationId);
                  
                  return (
                    <div key={dose.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
                      <div>
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                          {medication ? medication.name : 'Unknown Medication'}
                        </span>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Scheduled: {dose.scheduledDate} at {dose.scheduledTime}
                        </p>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${
                          dose.status === 'TAKEN'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400'
                            : dose.status === 'MISSED'
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800'
                        }`}>
                          {dose.status}
                        </span>
                        {dose.actualTimeTaken && (
                          <span className="text-[9px] text-gray-400 mt-1">Taken: {dose.actualTimeTaken.split(' ')[1]}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No dosage records found for this treatment course.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/30 flex justify-end">
            <Link to="/doses" className="text-xs font-bold text-blue-600 hover:underline">
              Open Daily Tracker &rarr;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TreatmentDetails;
