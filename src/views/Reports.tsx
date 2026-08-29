import React, { useState, useMemo } from 'react';
import { patientService } from '../services/patientService';
import { treatmentService } from '../services/treatmentService';
import { doseService } from '../services/doseService';
import { medicationService } from '../services/medicationService';
import type { Patient, Treatment, Medication } from '../types';
import { 
  Printer, 
  FileChartColumn
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

export const Reports: React.FC = () => {
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);
  const treatments = useMemo<Treatment[]>(() => treatmentService.getAll(), []);
  const medications = useMemo<Medication[]>(() => medicationService.getAll(), []);

  // Filter States
  const [selectedPatientId, setSelectedPatientId] = useState(() => patients[0]?.id || '');
  const [reportType, setReportType] = useState<'ADHERENCE_SUMMARY' | 'DOSE_LOGS' | 'TREATMENT_PLAN'>('ADHERENCE_SUMMARY');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // default last 30 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const patient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  const patientTreatments = useMemo(() => {
    return treatments.filter(t => t.patientId === selectedPatientId);
  }, [treatments, selectedPatientId]);

  const patientMedications = useMemo(() => {
    return medications.filter(m => {
      const treatment = patientTreatments.find(t => t.id === m.treatmentId);
      return !!treatment;
    });
  }, [medications, patientTreatments]);

  const filteredDoses = useMemo(() => {
    const doses = doseService.getByPatientId(selectedPatientId);
    return doses.filter(d => d.scheduledDate >= startDate && d.scheduledDate <= endDate);
  }, [selectedPatientId, startDate, endDate]);

  // Analytics for patient
  const stats = useMemo(() => {
    const totalDoses = filteredDoses.length;
    const taken = filteredDoses.filter(d => d.status === 'TAKEN').length;
    const missed = filteredDoses.filter(d => d.status === 'MISSED').length;
    const skipped = filteredDoses.filter(d => d.status === 'SKIPPED').length;
    const rate = analyticsService.calculateAdherence(filteredDoses);
    const classification = analyticsService.classifyAdherence(rate);

    return {
      totalDoses,
      taken,
      missed,
      skipped,
      rate,
      classification
    };
  }, [filteredDoses]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Controls - HIDE ON PRINT */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileChartColumn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Clinical Report Compiler
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Compile print-ready administrative reports and medication charts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Select Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-950 dark:text-white text-sm focus:outline-none cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Report Category
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-950 dark:text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="ADHERENCE_SUMMARY">Treatment Adherence Summary</option>
              <option value="DOSE_LOGS">Daily Dose History Log</option>
              <option value="TREATMENT_PLAN">Structured Treatment Plan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-950 dark:text-white text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-950 dark:text-white text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl cursor-pointer text-sm shadow-md shadow-blue-500/10"
          >
            <Printer className="w-4.5 h-4.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Report Template Container */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-200 print:border-none print:shadow-none print:p-0 print:rounded-none max-w-4xl mx-auto font-sans leading-normal">
        
        {/* Clinical Document Header */}
        <div className="border-b-4 border-gray-900 pb-5 mb-6 flex justify-between items-end">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">Clinical Record Document</span>
            <h2 className="text-2xl font-black text-gray-950">Medication & Treatment Adherence Management System</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Demo Clinical Administration Registry</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Printed: {new Date().toISOString().split('T')[0]}</p>
            <p className="text-gray-500">Report Category: {reportType.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Patient Profile Box */}
        {patient && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs mb-6">
            <div>
              <p className="font-bold text-gray-500">PATIENT DEMOGRAPHIC PROFILE</p>
              <h3 className="text-base font-extrabold text-gray-900 mt-1">{patient.name}</h3>
              <p className="mt-0.5">ID: {patient.id} | Gender: {patient.gender} | Age: {patient.age}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-bold text-gray-500">CONTACT & HEALTH CARE AGENCY</p>
              <p className="mt-1">Phone: {patient.contactInfo.phone}</p>
              <p className="mt-0.5">Email: {patient.contactInfo.email}</p>
              <p className="mt-0.5">Address: {patient.contactInfo.address}</p>
            </div>
          </div>
        )}

        {/* Dynamic Report Content based on selection */}
        {reportType === 'ADHERENCE_SUMMARY' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm uppercase font-extrabold text-gray-800 tracking-wider mb-3">I. Adherence Analytics Metrics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 border rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Target Range</span>
                  <p className="text-xs font-semibold mt-1">{startDate} to {endDate}</p>
                </div>
                <div className="p-3 bg-gray-50 border rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Doses Tracked</span>
                  <p className="text-lg font-black mt-0.5">{stats.totalDoses}</p>
                </div>
                <div className="p-3 bg-gray-50 border rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Adherence Percentage</span>
                  <p className="text-lg font-black text-blue-700 mt-0.5">{stats.rate}%</p>
                </div>
                <div className="p-3 bg-gray-50 border rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Indicator Classification</span>
                  <p className="text-xs font-extrabold uppercase mt-1">{stats.classification}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm uppercase font-extrabold text-gray-800 tracking-wider mb-3">II. Logged Dose Categorization Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50/50 border border-green-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-green-700">Taken</span>
                  <p className="text-xl font-black text-green-800">{stats.taken}</p>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Skipped</span>
                  <p className="text-xl font-black text-amber-800">{stats.skipped}</p>
                </div>
                <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-red-700">Missed</span>
                  <p className="text-xl font-black text-red-800">{stats.missed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'DOSE_LOGS' && (
          <div className="space-y-4">
            <h4 className="text-sm uppercase font-extrabold text-gray-800 tracking-wider">I. Historical Logged Dose Activity List</h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-150 border-b border-gray-300 font-bold uppercase text-gray-700">
                    <th className="p-3">Scheduled DateTime</th>
                    <th className="p-3">Medication</th>
                    <th className="p-3">Logged Status</th>
                    <th className="p-3">Compliance Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDoses.length > 0 ? (
                    [...filteredDoses].sort((a,b) => b.scheduledDate.localeCompare(a.scheduledDate) || b.scheduledTime.localeCompare(a.scheduledTime)).map((dose) => {
                      const med = medications.find(m => m.id === dose.medicationId);
                      return (
                        <tr key={dose.id}>
                          <td className="p-3 font-mono">{dose.scheduledDate} at {dose.scheduledTime}</td>
                          <td className="p-3 font-bold">{med ? med.name : 'Unknown Medication'} ({med ? med.dosage : ''})</td>
                          <td className="p-3 font-extrabold uppercase">{dose.status}</td>
                          <td className="p-3 text-gray-600">
                            {dose.reasonForMissed ? `Reason: ${dose.reasonForMissed}. ` : ''}
                            {dose.reasonNote || '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-400">No logs found for this date range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'TREATMENT_PLAN' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm uppercase font-extrabold text-gray-800 tracking-wider mb-3">I. Prescribed Treatment Plans</h4>
              <div className="space-y-4 text-xs">
                {patientTreatments.length > 0 ? (
                  patientTreatments.map((t) => (
                    <div key={t.id} className="p-4 border border-gray-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-sm text-gray-900">{t.name}</span>
                        <span className="font-bold border border-gray-300 px-2 py-0.5 rounded uppercase">{t.status}</span>
                      </div>
                      <p>Timeline: {t.startDate} to {t.endDate}</p>
                      {t.notes && <p className="text-gray-500 italic">Notes: "{t.notes}"</p>}
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 border rounded-xl text-center text-gray-400">No treatments registered.</div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm uppercase font-extrabold text-gray-800 tracking-wider mb-3">II. Medication Courses catalog</h4>
              <div className="space-y-3 text-xs">
                {patientMedications.length > 0 ? (
                  patientMedications.map((m) => (
                    <div key={m.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-gray-900">{m.name}</span>
                        <span className="text-gray-500 ml-2">({m.dosage})</span>
                        <p className="mt-0.5 text-gray-500">{m.instructions}</p>
                      </div>
                      <span className="font-mono text-gray-400">{m.startDate} to {m.endDate}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 border rounded-xl text-center text-gray-400 font-sans">No medications catalogued.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Safety Disclaimer and Legal Footer */}
        <div className="mt-12 pt-6 border-t-2 border-dashed border-gray-300 text-[10px] text-gray-450 leading-relaxed text-center">
          <p className="font-bold uppercase mb-1">⚠️ Educational Demonstration Disclaimer</p>
          <p>
            This report was generated by the <strong>Medication & Treatment Adherence Management System (MTAMS)</strong> demo application. 
            This document is strictly for administrative review and training purposes. It does <strong>NOT</strong> constitute professional medical advice, 
            clinical diagnosis, or prescription recommendations. Any dosage adjustments or medication modifications must be performed by a qualified 
            healthcare provider.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Reports;
