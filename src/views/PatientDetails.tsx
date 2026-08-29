import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { treatmentService } from '../services/treatmentService';
import { doseService } from '../services/doseService';
import { analyticsService } from '../services/analyticsService';
import { followUpService } from '../services/followUpService';
import type { Treatment, DoseRecord, FollowUp } from '../types';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Activity, 
  Award, 
  Flame,
  ArrowLeft,
  FileText,
  HeartPulse
} from 'lucide-react';

export const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const patient = useMemo(() => {
    return id ? patientService.getById(id) : undefined;
  }, [id]);

  const treatments = useMemo<Treatment[]>(() => {
    return id ? treatmentService.getAll().filter(t => t.patientId === id) : [];
  }, [id]);

  const doses = useMemo<DoseRecord[]>(() => {
    return id ? doseService.getAll().filter(d => d.patientId === id) : [];
  }, [id]);

  const followUps = useMemo<FollowUp[]>(() => {
    return id ? followUpService.getAll().filter(f => f.patientId === id) : [];
  }, [id]);

  const stats = useMemo(() => {
    return id ? analyticsService.getPatientAnalytics(id) : null;
  }, [id]);

  if (!patient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <User className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Patient Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">No patient record exists for ID: <span className="font-mono">{id}</span></p>
        <Link to="/patients" className="text-blue-600 hover:underline text-sm mt-3 inline-block font-semibold">← Back to Patients</Link>
      </div>
    );
  }

  const takenDoses = doses.filter(d => d.status === 'TAKEN').length;
  const missedDoses = doses.filter(d => d.status === 'MISSED').length;
  const upcomingFollowUps = followUps.filter(f => f.status === 'SCHEDULED').length;

  return (
    <div className="space-y-6">

      {/* Back link */}
      <Link to="/patients" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to Patient Registry
      </Link>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Patient ID: <span className="font-mono font-semibold">{patient.id}</span> · 
              Age: <span className="font-semibold">{patient.age}</span> · 
              Gender: <span className="font-semibold capitalize">{patient.gender}</span>
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                patient.status === 'ACTIVE' 
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30' 
                  : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
              }`}>
                {patient.status}
              </span>
              <span className="text-xs text-gray-400">
                Registered: {patient.registrationDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info + Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Contact Details */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
            <User className="w-5 h-5 text-blue-600" /> Contact Information
          </h3>
          <div className="space-y-3.5">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{patient.contactInfo.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{patient.contactInfo.email}</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">{patient.contactInfo.address}</span>
            </div>
          </div>
        </div>

        {/* Adherence Quick Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-emerald-600" /> Adherence Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 text-center">
              <Award className="w-6 h-6 mx-auto text-blue-500 mb-1.5" />
              <span className="text-2xl font-black text-gray-900 dark:text-white block">{stats?.adherence ?? 0}%</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Compliance</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 text-center">
              <Flame className="w-6 h-6 mx-auto text-orange-500 mb-1.5" />
              <span className="text-2xl font-black text-gray-900 dark:text-white block">{stats?.currentStreak ?? 0}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Day Streak</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 text-center">
              <HeartPulse className="w-6 h-6 mx-auto text-green-500 mb-1.5" />
              <span className="text-2xl font-black text-gray-900 dark:text-white block">{takenDoses}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Taken</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 text-center">
              <Calendar className="w-6 h-6 mx-auto text-red-500 mb-1.5" />
              <span className="text-2xl font-black text-gray-900 dark:text-white block">{missedDoses}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Missed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Treatment Plans List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
          <FileText className="w-5 h-5 text-indigo-600" /> Treatment Plans ({treatments.length})
        </h3>
        {treatments.length > 0 ? (
          <div className="space-y-3">
            {treatments.map(t => (
              <Link
                key={t.id}
                to={`/treatments/${t.id}`}
                className="block bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</span>
                    <span className="text-xs text-gray-400 block mt-0.5">{t.startDate} → {t.endDate}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    t.status === 'ACTIVE' 
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400' 
                      : t.status === 'COMPLETED' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No treatment plans assigned to this patient.</p>
        )}
      </div>

      {/* Upcoming Follow-Ups */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
          <Calendar className="w-5 h-5 text-amber-600" /> Follow-Up Appointments ({upcomingFollowUps} upcoming)
        </h3>
        {followUps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/50 text-left">
                  <th className="py-2 px-3 text-xs font-bold text-gray-400 uppercase">Date</th>
                  <th className="py-2 px-3 text-xs font-bold text-gray-400 uppercase">Time</th>
                  <th className="py-2 px-3 text-xs font-bold text-gray-400 uppercase">Purpose</th>
                  <th className="py-2 px-3 text-xs font-bold text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {followUps.slice(0, 10).map(f => (
                  <tr key={f.id} className="border-b border-gray-50 dark:border-gray-700/30">
                    <td className="py-2.5 px-3 font-medium text-gray-800 dark:text-gray-200">{f.date}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{f.time}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{f.purpose}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        f.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                        : f.status === 'COMPLETED' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No follow-up appointments recorded.</p>
        )}
      </div>

    </div>
  );
};

export default PatientDetails;
