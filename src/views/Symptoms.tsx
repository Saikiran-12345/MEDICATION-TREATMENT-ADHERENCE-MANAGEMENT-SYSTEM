import type React from 'react';
import { useState, useEffect } from 'react';
import { symptomService } from '../services/symptomService';
import { patientService } from '../services/patientService';
import { medicationService } from '../services/medicationService';
import { useForm } from '../hooks/useForm';
import { Button, Input, Select, Badge, StatCard } from '../components/ui';
import type { Symptom, Patient, Medication } from '../types';
import { formatDate } from '../utils/dateUtils';
import { getSeverityColor } from '../utils/colorUtils';
import { BODY_AREAS } from '../utils/constants';

export const Symptoms: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [filterArea, setFilterArea] = useState<string>('ALL');

  useEffect(() => {
    const list = patientService.getAll();
    setPatients(list);
    if (list.length > 0) {
      setSelectedPatientId(list[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const records = symptomService.getByPatient(selectedPatientId);
      setSymptoms(records);
      const patientMeds = medicationService.getByPatientId(selectedPatientId);
      setMedications(patientMeds);
    }
  }, [selectedPatientId]);

  const { values, handleChange, resetForm, handleSubmit, errors } = useForm({
    initialValues: {
      name: '',
      severity: 5,
      bodyArea: 'GENERAL',
      linkedMedicationId: '',
      notes: ''
    },
    validate: (vals) => {
      const errs: Record<string, string[]> = {};
      if (!vals.name) {
        errs.name = ['Symptom name is required.'];
      }
      return errs;
    },
    onSubmit: (vals) => {
      symptomService.add({
        patientId: selectedPatientId,
        name: vals.name,
        severity: Number(vals.severity),
        bodyArea: vals.bodyArea,
        linkedMedicationId: vals.linkedMedicationId || undefined,
        notes: vals.notes || undefined,
        status: 'ACTIVE'
      });

      // Refresh list
      setSymptoms(symptomService.getByPatient(selectedPatientId));
      setShowAddForm(false);
      resetForm();
    }
  });

  const handleResolve = (id: string) => {
    const confirm = window.confirm('Are you sure this symptom is fully resolved?');
    if (confirm) {
      symptomService.resolve(id, 'Resolved spontaneously or after therapy.');
      setSymptoms(symptomService.getByPatient(selectedPatientId));
    }
  };

  const filteredSymptoms = symptoms.filter(s => filterArea === 'ALL' || s.bodyArea === filterArea);
  const activeSymptoms = symptoms.filter(s => s.status === 'ACTIVE' || s.status === 'MONITORING');

  const getStatusBadge = (symptom: Symptom) => {
    const variants = {
      ACTIVE: 'danger' as const,
      MONITORING: 'warning' as const,
      RESOLVED: 'success' as const
    };
    return <Badge variant={variants[symptom.status]}>{symptom.status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Symptom Log Tracking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Record and track patient physiological symptoms and adverse effects.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel Logging' : 'Log New Symptom'}
        </Button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
          Select Patient
        </label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="w-full max-w-md px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Logged Symptoms"
          value={symptoms.length}
          description="Cumulative recorded episodes"
        />
        <StatCard
          title="Active Symptoms"
          value={activeSymptoms.length}
          description="Currently active or monitored"
          className="border-l-4 border-l-rose-500"
        />
        <StatCard
          title="Resolved Symptoms"
          value={symptoms.filter(s => s.status === 'RESOLVED').length}
          description="Symptoms flagged as cleared"
          className="border-l-4 border-l-emerald-500"
        />
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Log New Symptom</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Symptom Name"
              name="name"
              type="text"
              placeholder="e.g. Headache, Dry Cough"
              value={values.name}
              onChange={handleChange}
              error={errors.name?.[0]}
            />
            <Select
              label="Body Area"
              name="bodyArea"
              value={values.bodyArea}
              onChange={handleChange}
              options={BODY_AREAS.map(area => ({ value: area, label: area }))}
            />
            <Select
              label="Linked Medication (Optional)"
              name="linkedMedicationId"
              value={values.linkedMedicationId}
              onChange={handleChange}
              options={[
                { value: '', label: 'No Linked Medication' },
                ...medications.map(m => ({ value: m.id, label: m.name }))
              ]}
            />
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Severity Score: {values.severity}
              </label>
              <input
                type="range"
                name="severity"
                min="1"
                max="10"
                value={values.severity}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 (Mild)</span>
                <span>5 (Moderate)</span>
                <span>10 (Severe)</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Notes & Observations"
                name="notes"
                type="text"
                placeholder="Describe symptom context..."
                value={values.notes}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => { setShowAddForm(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              Log Symptom
            </Button>
          </div>
        </form>
      )}

      {/* Symptoms List Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Symptom History Logs</h2>
          <div className="flex space-x-2">
            <Badge 
              className={`cursor-pointer ${filterArea === 'ALL' ? 'bg-blue-600 text-white' : ''}`}
              onClick={() => setFilterArea('ALL')}
            >
              ALL
            </Badge>
            {BODY_AREAS.slice(0, 6).map(area => (
              <Badge 
                key={area}
                className={`cursor-pointer ${filterArea === area ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => setFilterArea(area)}
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Onset Date</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Symptom</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Severity</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Body Area</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Status</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Linked Drug</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Resolved Date</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
            {filteredSymptoms.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td className="p-4 whitespace-nowrap">{formatDate(s.onsetDate, 'MM/DD/YYYY')}</td>
                <td className="p-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                <td className="p-4 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(s.severity)}`}>
                    Score: {s.severity}/10
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">{s.bodyArea}</td>
                <td className="p-4 whitespace-nowrap">{getStatusBadge(s)}</td>
                <td className="p-4 whitespace-nowrap">
                  {s.linkedMedicationId ? medications.find(m => m.id === s.linkedMedicationId)?.name || 'Medication' : '--'}
                </td>
                <td className="p-4 whitespace-nowrap">{s.resolvedDate ? formatDate(s.resolvedDate, 'MM/DD/YYYY') : '--'}</td>
                <td className="p-4 whitespace-nowrap">
                  {s.status !== 'RESOLVED' && (
                    <Button variant="outline" size="sm" onClick={() => handleResolve(s.id)}>
                      Mark Resolved
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filteredSymptoms.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No symptom logs found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
