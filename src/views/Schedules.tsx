import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { scheduleService } from '../services/scheduleService';
import { medicationService } from '../services/medicationService';
import { treatmentService } from '../services/treatmentService';
import { patientService } from '../services/patientService';
import type { MedicationSchedule, Medication, Treatment, Patient } from '../types';
import { 
  PlusCircle, 
  Search, 
  Trash2, 
  X, 
  CalendarDays, 
  Clock, 
  AlertCircle,
  Link as LinkIcon 
} from 'lucide-react';

export const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<MedicationSchedule[]>(() => scheduleService.getAll());
  const medications = useMemo<Medication[]>(() => medicationService.getAll(), []);
  const treatments = useMemo<Treatment[]>(() => treatmentService.getAll(), []);
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    treatmentId: '',
    medicationId: '',
    startDate: '',
    endDate: '',
    time: '',
    frequency: 'ONCE_DAILY' as MedicationSchedule['frequency'],
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [formError, setFormError] = useState('');

  const getPatientName = (patientId: string) => {
    const pat = patients.find(p => p.id === patientId);
    return pat ? pat.name : 'Unknown';
  };

  const getMedicationName = (medId: string) => {
    const med = medications.find(m => m.id === medId);
    return med ? med.name : 'Medication';
  };

  const getTreatmentName = (treatmentId: string) => {
    const treat = treatments.find(t => t.id === treatmentId);
    return treat ? treat.name : 'Treatment Plan';
  };

  const handleAddClick = () => {
    const defaultPat = patients[0]?.id || '';
    // Filter treatments for default patient
    const patTreatments = treatments.filter(t => t.patientId === defaultPat);
    const defaultTreat = patTreatments[0]?.id || treatments[0]?.id || '';
    // Filter medications for default treatment
    const treatMeds = medications.filter(m => m.treatmentId === defaultTreat);
    const defaultMed = treatMeds[0]?.id || medications[0]?.id || '';

    setFormData({
      patientId: defaultPat,
      treatmentId: defaultTreat,
      medicationId: defaultMed,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '08:00',
      frequency: 'ONCE_DAILY',
      status: 'ACTIVE'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Adjust treatment and medication selections in form on patient change
  const handleFormPatientChange = (patId: string) => {
    const patTreatments = treatments.filter(t => t.patientId === patId);
    const treatId = patTreatments[0]?.id || '';
    const treatMeds = medications.filter(m => m.treatmentId === treatId);
    const medId = treatMeds[0]?.id || '';

    setFormData(prev => ({
      ...prev,
      patientId: patId,
      treatmentId: treatId,
      medicationId: medId
    }));
  };

  const handleFormTreatmentChange = (treatId: string) => {
    const treatMeds = medications.filter(m => m.treatmentId === treatId);
    const medId = treatMeds[0]?.id || '';

    setFormData(prev => ({
      ...prev,
      treatmentId: treatId,
      medicationId: medId
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'patientId') {
      handleFormPatientChange(value);
    } else if (name === 'treatmentId') {
      handleFormTreatmentChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Delete this medication schedule? All upcoming scheduled doses will be cancelled.')) {
      scheduleService.delete(id);
      setSchedules(scheduleService.getAll());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.patientId) {
      setFormError('Patient association is required');
      return;
    }
    if (!formData.treatmentId) {
      setFormError('Treatment course association is required');
      return;
    }
    if (!formData.medicationId) {
      setFormError('Medication is required');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date cannot precede start date');
      return;
    }
    if (!formData.time.trim()) {
      setFormError('Time (e.g. 08:00) is required');
      return;
    }

    try {
      scheduleService.create({
        patientId: formData.patientId,
        treatmentId: formData.treatmentId,
        medicationId: formData.medicationId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        time: formData.time,
        frequency: formData.frequency,
        status: formData.status
      });

      setSchedules(scheduleService.getAll());
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const patName = getPatientName(s.patientId);
      const medName = getMedicationName(s.medicationId);
      return patName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             medName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [schedules, searchQuery]);

  // Form options helper
  const formTreatments = useMemo(() => {
    return treatments.filter(t => t.patientId === formData.patientId);
  }, [treatments, formData.patientId]);

  const formMedications = useMemo(() => {
    return medications.filter(m => m.treatmentId === formData.treatmentId);
  }, [medications, formData.treatmentId]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medication Schedules</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Configure active treatment frequencies, timings, and generate dose records.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 cursor-pointer text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Create Schedule
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by patient name or medication..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Patient</th>
                <th className="py-4 px-6">Medication & Treatment</th>
                <th className="py-4 px-6">Schedule Timings</th>
                <th className="py-4 px-6">Frequency</th>
                <th className="py-4 px-6">Validity</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm text-gray-700 dark:text-gray-300">
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((sched) => (
                  <tr key={sched.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {getPatientName(sched.patientId)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {getMedicationName(sched.medicationId)}
                      </div>
                      <Link 
                        to={`/treatments/${sched.treatmentId}`}
                        className="text-xs text-gray-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline flex items-center gap-0.5 mt-0.5"
                      >
                        <LinkIcon className="w-2.5 h-2.5" />
                        {getTreatmentName(sched.treatmentId)}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {sched.time}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold">
                      <span className="bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded text-gray-800 dark:text-gray-300">
                        {sched.frequency}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400">
                      <div>From: {sched.startDate}</div>
                      <div>To: {sched.endDate}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteClick(sched.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    No medication schedules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Create Timing Schedule
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Select Patient *
                  </label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Select Treatment Course *
                  </label>
                  <select
                    name="treatmentId"
                    value={formData.treatmentId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 cursor-pointer"
                  >
                    <option value="">-- Choose Course --</option>
                    {formTreatments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Select Medication *
                </label>
                <select
                  name="medicationId"
                  value={formData.medicationId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 cursor-pointer"
                  disabled={!formData.treatmentId}
                >
                  <option value="">-- Choose Medication --</option>
                  {formMedications.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.dosage})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Dosage Frequency
                  </label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="ONCE_DAILY">Once Daily</option>
                    <option value="TWICE_DAILY">Twice Daily</option>
                    <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                    <option value="CUSTOM">Custom Schedule</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Timings (comma-separated HH:MM) *
                  </label>
                  <input
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm font-mono focus:outline-none"
                    placeholder="08:00, 20:00"
                  />
                </div>
              </div>

              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl leading-normal">
                💡 <span className="font-semibold">Notice:</span> Creating this schedule will pre-populate the daily tracker with scheduled dose events for the course duration (up to 30 days).
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-semibold cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-blue-500/10 text-sm"
                >
                  Schedule Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Schedules;
