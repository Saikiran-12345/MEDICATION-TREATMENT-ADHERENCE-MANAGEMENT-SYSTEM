import type React from 'react';
import { useState, useEffect } from 'react';
import { sideEffectService } from '../services/sideEffectService';
import { patientService } from '../services/patientService';
import { medicationService } from '../services/medicationService';
import { useForm } from '../hooks/useForm';
import { Button, Input, Select, Badge, StatCard } from '../components/ui';
import type { SideEffect, Patient, Medication } from '../types';
import { formatDate } from '../utils/dateUtils';


export const SideEffects: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    const list = patientService.getAll();
    setPatients(list);
    if (list.length > 0) {
      setSelectedPatientId(list[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const records = sideEffectService.getByPatient(selectedPatientId);
      setSideEffects(records);
      const patientMeds = medicationService.getByPatientId(selectedPatientId);
      setMedications(patientMeds);
    }
  }, [selectedPatientId]);

  const { values, handleChange, resetForm, handleSubmit, errors } = useForm({
    initialValues: {
      medicationId: '',
      name: '',
      severity: 'MILD' as SideEffect['severity'],
      notes: ''
    },
    validate: (vals) => {
      const errs: Record<string, string[]> = {};
      if (!vals.medicationId) {
        errs.medicationId = ['Please select the medication.'];
      }
      if (!vals.name) {
        errs.name = ['Side effect description name is required.'];
      }
      return errs;
    },
    onSubmit: (vals) => {
      sideEffectService.add({
        patientId: selectedPatientId,
        medicationId: vals.medicationId,
        name: vals.name,
        severity: vals.severity,
        status: 'ACTIVE',
        notes: vals.notes || undefined
      });

      // Refresh list
      setSideEffects(sideEffectService.getByPatient(selectedPatientId));
      setShowAddForm(false);
      resetForm();
    }
  });

  const handleResolve = (id: string) => {
    const confirm = window.confirm('Flag this adverse reaction side effect as fully resolved?');
    if (confirm) {
      sideEffectService.resolve(id, 'Resolved spontaneously or after drug adjustment.');
      setSideEffects(sideEffectService.getByPatient(selectedPatientId));
    }
  };

  const filteredSideEffects = sideEffects.filter(
    se => filterSeverity === 'ALL' || se.severity === filterSeverity
  );
  
  const activeSideEffects = sideEffects.filter(s => s.status === 'ACTIVE' || s.status === 'MONITORING');

  const getSeverityBadge = (se: SideEffect) => {
    const variants = {
      MILD: 'success' as const,
      MODERATE: 'warning' as const,
      SEVERE: 'danger' as const
    };
    return <Badge variant={variants[se.severity]}>{se.severity}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Adverse Side Effects Monitoring</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Log, track, and monitor patient side effects and drug reactions.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel Logging' : 'Log Side Effect'}
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
          title="Total Logged Side Effects"
          value={sideEffects.length}
          description="Cumulative recorded episodes"
        />
        <StatCard
          title="Active Adverse Events"
          value={activeSideEffects.length}
          description="Currently active or monitored"
          className="border-l-4 border-l-rose-500"
        />
        <StatCard
          title="Resolved Adverse Events"
          value={sideEffects.filter(s => s.status === 'RESOLVED').length}
          description="Side effects resolved"
          className="border-l-4 border-l-emerald-500"
        />
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Log Side Effect</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Associated Medication"
              name="medicationId"
              value={values.medicationId}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Medication' },
                ...medications.map(m => ({ value: m.id, label: m.name }))
              ]}
              error={errors.medicationId?.[0]}
            />
            <Input
              label="Side Effect Name"
              name="name"
              type="text"
              placeholder="e.g. Dizziness, Nausea"
              value={values.name}
              onChange={handleChange}
              error={errors.name?.[0]}
            />
            <Select
              label="Severity"
              name="severity"
              value={values.severity}
              onChange={handleChange}
              options={[
                { value: 'MILD', label: 'MILD' },
                { value: 'MODERATE', label: 'MODERATE' },
                { value: 'SEVERE', label: 'SEVERE' }
              ]}
            />
            <div className="md:col-span-3">
              <Input
                label="Notes / Context Details"
                name="notes"
                type="text"
                placeholder="Describe onset, duration, and comments..."
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
              Log Side Effect
            </Button>
          </div>
        </form>
      )}

      {/* Side Effects List Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Adverse Incident History</h2>
          <div className="flex space-x-2">
            <Badge 
              className={`cursor-pointer ${filterSeverity === 'ALL' ? 'bg-blue-600 text-white' : ''}`}
              onClick={() => setFilterSeverity('ALL')}
            >
              ALL
            </Badge>
            {['MILD', 'MODERATE', 'SEVERE'].map(sev => (
              <Badge 
                key={sev}
                className={`cursor-pointer ${filterSeverity === sev ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => setFilterSeverity(sev)}
              >
                {sev}
              </Badge>
            ))}
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Onset Date</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Associated Drug</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Adverse Symptom</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Severity</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Status</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Resolved Date</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Notes</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
            {filteredSideEffects.map(se => (
              <tr key={se.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td className="p-4 whitespace-nowrap">{formatDate(se.onsetDate, 'MM/DD/YYYY')}</td>
                <td className="p-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                  {medications.find(m => m.id === se.medicationId)?.name || 'Medication'}
                </td>
                <td className="p-4 whitespace-nowrap">{se.name}</td>
                <td className="p-4 whitespace-nowrap">{getSeverityBadge(se)}</td>
                <td className="p-4 whitespace-nowrap">
                  <Badge variant={se.status === 'RESOLVED' ? 'success' : 'danger'}>
                    {se.status}
                  </Badge>
                </td>
                <td className="p-4 whitespace-nowrap">{se.resolvedDate ? formatDate(se.resolvedDate, 'MM/DD/YYYY') : '--'}</td>
                <td className="p-4 max-w-xs truncate">{se.notes || '--'}</td>
                <td className="p-4 whitespace-nowrap">
                  {se.status !== 'RESOLVED' && (
                    <Button variant="outline" size="sm" onClick={() => handleResolve(se.id)}>
                      Mark Resolved
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filteredSideEffects.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No adverse events recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
