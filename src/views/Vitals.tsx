import type React from 'react';
import { useState, useEffect } from 'react';
import { vitalsService } from '../services/vitalsService';
import { patientService } from '../services/patientService';
import { useForm } from '../hooks/useForm';
import { Button, Input, Select, Badge, StatCard } from '../components/ui';
import type { Vital, Patient, VitalType } from '../types';
import { formatDate } from '../utils/dateUtils';
import { formatNumber } from '../utils/formatUtils';
import { VITAL_TYPES } from '../utils/constants';

export const Vitals: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    const list = patientService.getAll();
    setPatients(list);
    if (list.length > 0) {
      setSelectedPatientId(list[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const records = vitalsService.getByPatient(selectedPatientId);
      setVitals(records);
    }
  }, [selectedPatientId]);

  const { values, handleChange, resetForm, handleSubmit, errors } = useForm({
    initialValues: {
      type: 'BLOOD_PRESSURE' as VitalType,
      value: '',
      secondaryValue: '',
      unit: 'mmHg',
      notes: ''
    },
    validate: (vals) => {
      const errs: Record<string, string[]> = {};
      if (!vals.value) {
        errs.value = ['Value is required.'];
      } else if (isNaN(Number(vals.value))) {
        errs.value = ['Must be a valid number.'];
      }
      
      if (vals.type === 'BLOOD_PRESSURE' && !vals.secondaryValue) {
        errs.secondaryValue = ['Diastolic value is required for Blood Pressure.'];
      }

      return errs;
    },
    onSubmit: (vals) => {
      vitalsService.add({
        patientId: selectedPatientId,
        type: vals.type,
        value: Number(vals.value),
        secondaryValue: vals.secondaryValue ? Number(vals.secondaryValue) : undefined,
        unit: vals.unit,
        recordedBy: 'staff-1',
        notes: vals.notes || undefined
      });
      
      // Refresh list
      setVitals(vitalsService.getByPatient(selectedPatientId));
      setShowAddForm(false);
      resetForm();
    }
  });

  // Automatically update unit when type changes
  useEffect(() => {
    const typeDef = VITAL_TYPES.find(t => t.key === values.type);
    if (typeDef) {
      values.unit = typeDef.unit;
    }
  }, [values.type]);

  const filteredVitals = vitals.filter(v => filterType === 'ALL' || v.type === filterType);
  const latestVitals = vitalsService.getLatestByPatient(selectedPatientId);

  const getStatusBadge = (vital: Vital) => {
    const status = vitalsService.getVitalStatus(vital);
    const variants = {
      normal: 'success' as const,
      warning: 'warning' as const,
      critical: 'danger' as const
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Patient Vitals Tracking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Log and monitor patient health indicators and metrics.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel Logging' : 'Log New Vitals'}
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

      {/* Latest Vitals Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {VITAL_TYPES.map(typeDef => {
          const reading = latestVitals[typeDef.key as VitalType];
          const displayVal = reading 
            ? reading.secondaryValue 
              ? `${reading.value}/${reading.secondaryValue}` 
              : `${reading.value}`
            : '--';
          return (
            <StatCard
              key={typeDef.key}
              title={typeDef.label}
              value={displayVal}
              description={reading ? `${typeDef.unit} - ${formatDate(reading.recordedAt, 'MMM DD')}` : 'No records logged'}
              className="border-t-4 border-t-blue-500"
            />
          );
        })}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Log New Vital Reading</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Vital Type"
              name="type"
              value={values.type}
              onChange={handleChange}
              options={VITAL_TYPES.map(t => ({ value: t.key, label: t.label }))}
            />
            <Input
              label={values.type === 'BLOOD_PRESSURE' ? 'Systolic Value' : 'Reading Value'}
              name="value"
              type="text"
              placeholder="e.g. 120"
              value={values.value}
              onChange={handleChange}
              error={errors.value?.[0]}
            />
            {values.type === 'BLOOD_PRESSURE' && (
              <Input
                label="Diastolic Value"
                name="secondaryValue"
                type="text"
                placeholder="e.g. 80"
                value={values.secondaryValue}
                onChange={handleChange}
                error={errors.secondaryValue?.[0]}
              />
            )}
            <Input
              label="Unit"
              name="unit"
              type="text"
              value={values.unit}
              onChange={handleChange}
              disabled
            />
            <div className="md:col-span-2">
              <Input
                label="Notes / Comments"
                name="notes"
                type="text"
                placeholder="Add vital checking context..."
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
              Save Vitals Log
            </Button>
          </div>
        </form>
      )}

      {/* Vitals History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Historical Readings</h2>
          <div className="flex space-x-2">
            <Badge 
              className={`cursor-pointer ${filterType === 'ALL' ? 'bg-blue-600 text-white' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              ALL
            </Badge>
            {VITAL_TYPES.map(t => (
              <Badge 
                key={t.key}
                className={`cursor-pointer ${filterType === t.key ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => setFilterType(t.key)}
              >
                {t.label}
              </Badge>
            ))}
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Date/Time</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Vital Type</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Reading</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Unit</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Evaluation</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Logged By</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
            {filteredVitals.map(v => (
              <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td className="p-4 whitespace-nowrap">{formatDate(v.recordedAt, 'MM/DD/YYYY HH:MM')}</td>
                <td className="p-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                  {VITAL_TYPES.find(t => t.key === v.type)?.label || v.type}
                </td>
                <td className="p-4 whitespace-nowrap">
                  {v.secondaryValue ? `${formatNumber(v.value, 0)}/${formatNumber(v.secondaryValue, 0)}` : formatNumber(v.value, 1)}
                </td>
                <td className="p-4 whitespace-nowrap">{v.unit}</td>
                <td className="p-4 whitespace-nowrap">{getStatusBadge(v)}</td>
                <td className="p-4 whitespace-nowrap">{v.recordedBy}</td>
                <td className="p-4 max-w-xs truncate">{v.notes || '--'}</td>
              </tr>
            ))}
            {filteredVitals.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No vital readings found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
