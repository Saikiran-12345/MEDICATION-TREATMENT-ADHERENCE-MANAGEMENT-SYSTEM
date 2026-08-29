import React, { useState, useMemo } from 'react';
import { patientService } from '../services/patientService';
import { treatmentService } from '../services/treatmentService';
import { doseService } from '../services/doseService';
import type { Patient, Treatment, DoseRecord } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  FileBarChart2, 
  Users, 
  CalendarDays 
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280']; // Reason colors

export const Analytics: React.FC = () => {
  const [doses] = useState<DoseRecord[]>(() => doseService.getAll());
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);
  const treatments = useMemo<Treatment[]>(() => treatmentService.getAll(), []);

  // Filter Date states
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  // 1. Patient Adherence Comparison Data
  const patientComparisonData = useMemo(() => {
    return patients.map(pat => {
      const patDoses = doses.filter(d => d.patientId === pat.id);
      const rate = analyticsService.calculateAdherence(patDoses);
      return {
        name: pat.name,
        adherence: rate
      };
    }).sort((a,b) => b.adherence - a.adherence);
  }, [patients, doses]);

  // 2. Missed Dose Reason Distribution Data
  const missedReasonData = useMemo(() => {
    const reasons: Record<string, number> = {
      'FORGOT': 0,
      'TRAVEL': 0,
      'SCHEDULE_CONFLICT': 0,
      'UNAVAILABLE': 0,
      'OTHER': 0
    };

    doses.filter(d => d.status === 'MISSED' && d.reasonForMissed).forEach(dose => {
      if (dose.reasonForMissed) {
        reasons[dose.reasonForMissed] = (reasons[dose.reasonForMissed] || 0) + 1;
      }
    });

    return Object.entries(reasons).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    })).filter(item => item.value > 0);
  }, [doses]);

  // 3. Treatment Category Comparisons (e.g. Hypertension vs Diabetes vs Arthritis)
  const treatmentAdherenceData = useMemo(() => {
    // Group treatments by names (e.g. Hypertension, Diabetes)
    const categoryRates: Record<string, { total: number; taken: number; count: number }> = {};

    treatments.forEach(t => {
      // Find core name prefix (e.g. 'Hypertension Control Plan' -> 'Hypertension')
      const category = t.name.split(' ')[0] || 'General';
      const tDoses = doses.filter(d => d.treatmentId === t.id);
      
      const tracked = tDoses.filter(d => d.status !== 'SCHEDULED' && d.status !== 'CANCELLED');
      const taken = tracked.filter(d => d.status === 'TAKEN').length;
      
      if (!categoryRates[category]) {
        categoryRates[category] = { total: 0, taken: 0, count: 0 };
      }
      
      categoryRates[category].total += tracked.length;
      categoryRates[category].taken += taken;
      categoryRates[category].count += 1;
    });

    return Object.entries(categoryRates).map(([name, stats]) => {
      const adherence = stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 100;
      return {
        name,
        adherence,
        count: stats.count
      };
    }).sort((a,b) => b.adherence - a.adherence);
  }, [treatments, doses]);

  // 4. Time Trend Data
  const trendData = useMemo(() => {
    return analyticsService.getAdherenceTrend(timeRange);
  }, [timeRange]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Clinical Analytics Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Analyze medication adherence rates, track trends, and identify missed reason patterns.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shrink-0 self-center">
          <button
            onClick={() => setTimeRange(7)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${timeRange === 7 ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange(30)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${timeRange === 30 ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange(90)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${timeRange === 90 ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Grid: Comparisons & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Timeline trend line chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Adherence Trend Over Time
            </h3>
            <p className="text-xs text-gray-400 mb-4">Timeline view of average patient compliance percentages.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11}/>
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`}/>
                <Tooltip formatter={(v) => [`${v}%`, 'Average Adherence']}/>
                <Line type="monotone" dataKey="adherence" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient comparisons chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-blue-600" /> Patient Adherence Comparisons
            </h3>
            <p className="text-xs text-gray-400 mb-4">Compare compliance indices across active patient records.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" height={50}/>
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`}/>
                <Tooltip formatter={(v) => [`${v}%`, 'Adherence']}/>
                <Bar dataKey="adherence" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Second Row Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Treatment category bar chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
              <CalendarDays className="w-5 h-5 text-blue-600" /> Adherence by Treatment Program
            </h3>
            <p className="text-xs text-gray-400 mb-4">Average adherence rated across active disease profiles.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={treatmentAdherenceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`}/>
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80}/>
                <Tooltip formatter={(v) => [`${v}%`, 'Adherence']}/>
                <Bar dataKey="adherence" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Missed dose reasons breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Missed Dose Reasons
            </h3>
            <p className="text-xs text-gray-400 mb-4">Analysis of documented explanations for missed schedules.</p>
          </div>
          
          <div className="h-44 flex justify-center">
            {missedReasonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={missedReasonData}
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {missedReasonData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center text-center text-xs text-gray-400">
                No missed dose reasons documented in current log history.
              </div>
            )}
          </div>

          {/* Legend */}
          {missedReasonData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-[10px] mt-4 font-semibold text-gray-500 dark:text-gray-400">
              {missedReasonData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Analytics;
