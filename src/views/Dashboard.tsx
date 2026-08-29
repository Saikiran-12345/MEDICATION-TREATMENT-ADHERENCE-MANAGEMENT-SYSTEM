import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { patientService } from '../services/patientService';
import { treatmentService } from '../services/treatmentService';
import { doseService } from '../services/doseService';
import { followUpService } from '../services/followUpService';
import { medicationService } from '../services/medicationService';
import type { Patient, Treatment, DoseRecord, FollowUp, Medication } from '../types';
import { 
  Users, 
  Activity,
  CheckSquare, 
  AlertTriangle, 
  Percent, 
  Calendar, 
  Pill, 
  Award, 
  Clock 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';

// Colors for Pie chart
const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Taken, Skipped, Missed

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [doses] = useState<DoseRecord[]>(() => doseService.getAll());
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);
  const treatments = useMemo<Treatment[]>(() => treatmentService.getAll(), []);
  const followUps = useMemo<FollowUp[]>(() => followUpService.getAll(), []);
  const medications = useMemo<Medication[]>(() => medicationService.getAll(), []);

  const todayStr = new Date().toISOString().split('T')[0];

  const getPatientName = (id: string) => {
    const pat = patients.find(p => p.id === id);
    return pat ? pat.name : 'Patient';
  };

  const getMedicationName = (medId: string) => {
    const med = medications.find(m => m.id === medId);
    return med ? med.name : 'Medication';
  };

  const getMedicationDetails = (medId: string) => {
    const med = medications.find(m => m.id === medId);
    return med ? { name: med.name, dosage: med.dosage, instructions: med.instructions } : { name: 'Medication', dosage: '', instructions: '' };
  };

  // 1. Shared Analytics calculations
  const dashboardStats = useMemo(() => {
    return analyticsService.getDashboardMetrics();
  }, []);

  const weeklyTrend = useMemo(() => {
    return analyticsService.getAdherenceTrend(7);
  }, []);

  const pieData = useMemo(() => {
    const taken = doses.filter(d => d.status === 'TAKEN').length;
    const skipped = doses.filter(d => d.status === 'SKIPPED').length;
    const missed = doses.filter(d => d.status === 'MISSED').length;
    return [
      { name: 'Taken', value: taken || 1 },
      { name: 'Skipped', value: skipped },
      { name: 'Missed', value: missed }
    ];
  }, [doses]);

  // 2. Staff-specific info
  const staffPatientsCount = useMemo(() => {
    return patients.filter(p => p.assignedStaffId === user?.id).length;
  }, [patients, user]);

  const patientsNeedingAttention = useMemo(() => {
    // List patients assigned to staff who have adherence < 60%
    const staffPats = patients.filter(p => p.assignedStaffId === user?.id && p.status === 'ACTIVE');
    return staffPats.filter(pat => {
      const patDoses = doses.filter(d => d.patientId === pat.id);
      if (patDoses.length === 0) return false;
      const rate = analyticsService.calculateAdherence(patDoses);
      return rate < 60;
    });
  }, [patients, doses, user]);

  // 3. Patient-specific info
  const patientStats = useMemo(() => {
    if (user?.role !== 'PATIENT' || !user.patientId) return null;

    const patDoses = doses.filter(d => d.patientId === user.patientId);
    const patTreatments = treatments.filter(t => t.patientId === user.patientId && t.status === 'ACTIVE');
    const patFollowUps = followUps.filter(f => f.patientId === user.patientId && f.status === 'SCHEDULED' && f.date >= todayStr);

    const activePlan = patTreatments[0];
    const nextFollowUp = [...patFollowUps].sort((a,b) => a.date.localeCompare(b.date))[0];
    
    const todayScheduled = patDoses.filter(d => d.scheduledDate === todayStr);
    const completed = todayScheduled.filter(d => d.status === 'TAKEN').length;
    const missed = todayScheduled.filter(d => d.status === 'MISSED' || d.status === 'SKIPPED').length;

    // Find next upcoming dose today
    const nowTime = new Date().toTimeString().substring(0, 5); // "HH:MM"
    const nextDose = [...todayScheduled]
      .filter(d => d.status === 'SCHEDULED' && d.scheduledTime >= nowTime)
      .sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime))[0];

    const stats = analyticsService.getPatientAnalytics(user.patientId);

    return {
      todayScheduledCount: todayScheduled.length,
      completedCount: completed,
      missedCount: missed,
      adherenceRate: stats.adherence,
      streak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      activePlan,
      nextFollowUp,
      nextDose,
      level: stats.riskLevel
    };
  }, [user, doses, treatments, followUps, todayStr]);

  // UI Stat Card Component
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    description?: string;
  }> = ({ title, value, icon, color, description }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between">
      <div>
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</span>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{value}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{description}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  );

  // RENDER ADMIN DASHBOARD
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Patients Registered" 
          value={dashboardStats.totalPatients} 
          icon={<Users className="w-6 h-6" />}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          description="Active clinical database records"
        />
        <StatCard 
          title="Active Treatments" 
          value={dashboardStats.activeTreatments} 
          icon={<Activity className="w-6 h-6" />}
          color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          description="Courses currently in progress"
        />
        <StatCard 
          title="Average Adherence" 
          value={`${dashboardStats.averageAdherence}%`} 
          icon={<Percent className="w-6 h-6" />}
          color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
          description={`Indicator level: ${analyticsService.classifyAdherence(dashboardStats.averageAdherence)}`}
        />
        <StatCard 
          title="Upcoming Follow-ups" 
          value={dashboardStats.upcomingFollowUps} 
          icon={<Calendar className="w-6 h-6" />}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          description="Scheduled staff consultations"
        />
      </div>

      {/* Doses tracking cards for Today */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 pb-4 sm:pb-0 sm:pr-6">
          <span className="text-xs text-gray-400 font-semibold uppercase block">Today's Scheduled Doses</span>
          <span className="text-3xl font-black text-gray-900 dark:text-white mt-1 block">{dashboardStats.todayScheduledDoses}</span>
        </div>
        <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 py-4 sm:py-0 sm:px-6">
          <span className="text-xs text-green-500 font-semibold uppercase block">Logged Taken Doses</span>
          <span className="text-3xl font-black text-green-600 dark:text-green-400 mt-1 block">{dashboardStats.completedDoses}</span>
        </div>
        <div className="text-center sm:text-left pt-4 sm:pt-0 sm:pl-6">
          <span className="text-xs text-red-500 font-semibold uppercase block">Logged Missed Doses</span>
          <span className="text-3xl font-black text-red-600 dark:text-red-400 mt-1 block">{dashboardStats.missedDoses}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adherence Trend Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Adherence Timeline Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11}/>
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`}/>
                <Tooltip formatter={(value) => [`${value}%`, 'Adherence']}/>
                <Area type="monotone" dataKey="adherence" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorAdherence)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Logged Doses Breakdown</h3>
            <div className="h-48 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Legend */}
          <div className="flex justify-around text-xs mt-4">
            <span className="flex items-center gap-1.5 font-semibold text-gray-600 dark:text-gray-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Taken
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-gray-600 dark:text-gray-400">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Skipped
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-gray-600 dark:text-gray-400">
              <span className="w-3 h-3 rounded-full bg-red-500"></span> Missed
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // RENDER STAFF DASHBOARD
  const renderStaffDashboard = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Assigned Active Patients" 
          value={staffPatientsCount} 
          icon={<Users className="w-6 h-6" />}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard 
          title="Today's Scheduled Doses" 
          value={dashboardStats.todayScheduledDoses} 
          icon={<CheckSquare className="w-6 h-6" />}
          color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
        />
        <StatCard 
          title="Patients Needing Attention" 
          value={patientsNeedingAttention.length} 
          icon={<AlertTriangle className="w-6 h-6" />}
          color={patientsNeedingAttention.length > 0 ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}
          description="Adherence < 60%"
        />
        <StatCard 
          title="Upcoming Consultations" 
          value={dashboardStats.upcomingFollowUps} 
          icon={<Calendar className="w-6 h-6" />}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needing attention list */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Patients Requiring Adherence Review</h3>
            <div className="divide-y divide-gray-150 dark:divide-gray-700">
              {patientsNeedingAttention.length > 0 ? (
                patientsNeedingAttention.map(pat => {
                  const patDoses = doses.filter(d => d.patientId === pat.id);
                  const rate = analyticsService.calculateAdherence(patDoses);
                  return (
                    <div key={pat.id} className="py-3 flex justify-between items-center">
                      <div>
                        <Link to={`/patients/${pat.id}`} className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                          {pat.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">Phone: {pat.contactInfo.phone}</p>
                      </div>
                      <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/30">
                        {rate}% Adherence
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-400 text-sm">
                  🎉 Good news! All assigned patients exceed the 60% adherence threshold.
                </div>
              )}
            </div>
          </div>
          {patientsNeedingAttention.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-750 flex justify-end">
              <Link to="/patients" className="text-xs font-bold text-blue-600 hover:underline">
                View All Patients &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Consultations Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Scheduled Follow-ups</h3>
            <div className="space-y-4">
              {followUps.filter(f => f.status === 'SCHEDULED' && f.date >= todayStr).slice(0, 4).map(f => (
                <div key={f.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">{getPatientName(f.patientId)}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{f.date} at {f.time}</p>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{f.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-750 flex justify-end">
            <Link to="/follow-ups" className="text-xs font-bold text-blue-600 hover:underline">
              Open Planner &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // RENDER PATIENT DASHBOARD
  const renderPatientDashboard = () => {
    if (!patientStats) return null;

    return (
      <div className="space-y-6">
        
        {/* Core Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="My Adherence Rate" 
            value={`${patientStats.adherenceRate}%`} 
            icon={<Percent className="w-6 h-6" />}
            color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            description={`Status level: ${patientStats.level}`}
          />
          <StatCard 
            title="Current Taken Streak" 
            value={`${patientStats.streak} Days`} 
            icon={<Award className="w-6 h-6" />}
            color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
            description={`Personal best: ${patientStats.bestStreak} Days`}
          />
          <StatCard 
            title="Doses Logged Today" 
            value={`${patientStats.completedCount} / ${patientStats.todayScheduledCount}`} 
            icon={<CheckSquare className="w-6 h-6" />}
            color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
            description="Taken out of total scheduled"
          />
          <StatCard 
            title="Missed Doses Today" 
            value={patientStats.missedCount} 
            icon={<AlertTriangle className="w-6 h-6" />}
            color={patientStats.missedCount > 0 ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}
            description="Skip or Missed logs"
          />
        </div>

        {/* Treatment info & Next timings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Active Treatment plan progress */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">📋 Active Treatment Plan</h3>
              {patientStats.activePlan ? (
                <div>
                  <h4 className="font-extrabold text-lg text-gray-900 dark:text-white">{patientStats.activePlan.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">Course validity: {patientStats.activePlan.startDate} to {patientStats.activePlan.endDate}</p>
                  
                  {patientStats.activePlan.notes && (
                    <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 text-xs text-gray-600 dark:text-gray-400 leading-normal">
                      <span className="font-semibold block mb-0.5">Special Instructions:</span>
                      {patientStats.activePlan.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">
                  No active treatment plan registered.
                </div>
              )}
            </div>
            
            {patientStats.activePlan && (
              <div className="mt-6 pt-4 border-t border-gray-150 dark:border-gray-750 flex justify-end">
                <Link to="/treatments" className="text-xs font-bold text-blue-600 hover:underline">
                  My Treatment Timeline &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Next Scheduled dose */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">🔔 Upcoming Dose Notification</h3>
              
              {patientStats.nextDose ? (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-gray-900 dark:text-white text-base">
                      {getMedicationName(patientStats.nextDose.medicationId)}
                    </span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded ml-2">
                      {getMedicationDetails(patientStats.nextDose.medicationId).dosage}
                    </span>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Take at: <span className="font-bold text-blue-600 dark:text-blue-400">{patientStats.nextDose.scheduledTime} today</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 italic">
                      ({getMedicationDetails(patientStats.nextDose.medicationId).instructions})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">
                  No upcoming doses scheduled for the remainder of today.
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-150 dark:border-gray-750 flex justify-between items-center text-xs">
              {patientStats.nextFollowUp ? (
                <span className="text-gray-500">
                  🗓️ Next Consultation: <span className="font-bold text-gray-800 dark:text-gray-200">{patientStats.nextFollowUp.date}</span>
                </span>
              ) : (
                <span className="text-gray-400 italic">No scheduled follow-up appointment</span>
              )}
              <Link to="/doses" className="font-bold text-blue-600 hover:underline">
                Mark Taken &rarr;
              </Link>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Healthcare Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
          {user?.role === 'ADMIN' && 'System Supervisor Overview'}
          {user?.role === 'STAFF' && `Assigned Ward Overview for: ${user.name}`}
          {user?.role === 'PATIENT' && `Personal Patient Dashboard for: ${user.name}`}
        </p>
      </div>

      {user?.role === 'ADMIN' && renderAdminDashboard()}
      {user?.role === 'STAFF' && renderStaffDashboard()}
      {user?.role === 'PATIENT' && renderPatientDashboard()}
    </div>
  );
};

export default Dashboard;
