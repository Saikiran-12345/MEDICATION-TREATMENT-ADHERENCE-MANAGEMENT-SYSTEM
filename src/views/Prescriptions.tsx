import type React from 'react';
import { useState, useEffect } from 'react';
import { prescriptionService } from '../services/prescriptionService';
import { patientService } from '../services/patientService';
import { medicationService } from '../services/medicationService';
import { useForm } from '../hooks/useForm';
import { Button, Input, Select, Badge, StatCard } from '../components/ui';
import type { Prescription, Patient, Medication } from '../types';
import { formatDate } from '../utils/dateUtils';


export const Prescriptions: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    const list = patientService.getAll();
    setPatients(list);
    if (list.length > 0) {
      setSelectedPatientId(list[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const records = prescriptionService.getByPatient(selectedPatientId);
      setPrescriptions(records);
      const patientMeds = medicationService.getByPatientId(selectedPatientId);
      setMedications(patientMeds);
    }
  }, [selectedPatientId]);

  const { values, handleChange, resetForm, handleSubmit, errors } = useForm({
    initialValues: {
      medicationId: '',
      dosage: '',
      instructions: '',
      quantity: 30,
      refillsAllowed: 3,
      expiryDate: '',
      notes: ''
    },
    validate: (vals) => {
      const errs: Record<string, string[]> = {};
      if (!vals.medicationId) {
        errs.medicationId = ['Please select a medication.'];
      }
      if (!vals.dosage) {
        errs.dosage = ['Dosage description is required.'];
      }
      if (!vals.expiryDate) {
        errs.expiryDate = ['Expiry date is required.'];
      }
      return errs;
    },
    onSubmit: (vals) => {
      prescriptionService.add({
        patientId: selectedPatientId,
        medicationId: vals.medicationId,
        dosage: vals.dosage,
        instructions: vals.instructions,
        quantity: Number(vals.quantity),
        refillsAllowed: Number(vals.refillsAllowed),
        prescribedBy: 'staff-1',
        expiryDate: vals.expiryDate,
        notes: vals.notes || undefined
      });

      // Refresh list
      setPrescriptions(prescriptionService.getByPatient(selectedPatientId));
      setShowAddForm(false);
      resetForm();
    }
  });

  const handleRefill = (id: string) => {
    const confirm = window.confirm('Deduct and record one refill for this prescription?');
    if (confirm) {
      const success = prescriptionService.useRefill(id);
      if (success) {
        setPrescriptions(prescriptionService.getByPatient(selectedPatientId));
      } else {
        alert('Refill request failed. Either refills are exhausted or prescription is completed/cancelled.');
      }
    }
  };

  const handleCancel = (id: string) => {
    const confirm = window.confirm('Are you sure you want to cancel this active prescription?');
    if (confirm) {
      prescriptionService.cancelPrescription(id, 'Cancelled by clinical decision.');
      setPrescriptions(prescriptionService.getByPatient(selectedPatientId));
    }
  };

  const filteredRx = prescriptions.filter(rx => filterStatus === 'ALL' || rx.status === filterStatus);

  const getStatusBadge = (rx: Prescription) => {
    const variants = {
      ACTIVE: 'success' as const,
      COMPLETED: 'info' as const,
      EXPIRED: 'warning' as const,
      CANCELLED: 'danger' as const
    };
    return <Badge variant={variants[rx.status]}>{rx.status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prescription Manager</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View, log, and process patient medical prescriptions and refills.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel Logging' : 'Log New Prescription'}
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Prescriptions"
          value={prescriptions.length}
          description="Logged historical catalog"
        />
        <StatCard
          title="Active Prescriptions"
          value={prescriptions.filter(p => p.status === 'ACTIVE').length}
          description="Currently active"
          className="border-l-4 border-l-emerald-500"
        />
        <StatCard
          title="Completed Prescriptions"
          value={prescriptions.filter(p => p.status === 'COMPLETED').length}
          description="Refills finished"
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Cancelled Prescriptions"
          value={prescriptions.filter(p => p.status === 'CANCELLED').length}
          description="Discontinued scripts"
          className="border-l-4 border-l-rose-500"
        />
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Log New Prescription</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Select Medication"
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
              label="Dosage"
              name="dosage"
              type="text"
              placeholder="e.g. 500mg twice daily"
              value={values.dosage}
              onChange={handleChange}
              error={errors.dosage?.[0]}
            />
            <Input
              label="Instructions"
              name="instructions"
              type="text"
              placeholder="e.g. Take with food"
              value={values.instructions}
              onChange={handleChange}
            />
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              value={values.quantity}
              onChange={handleChange}
            />
            <Input
              label="Refills Allowed"
              name="refillsAllowed"
              type="number"
              value={values.refillsAllowed}
              onChange={handleChange}
            />
            <Input
              label="Expiry Date"
              name="expiryDate"
              type="date"
              value={values.expiryDate}
              onChange={handleChange}
              error={errors.expiryDate?.[0]}
            />
            <div className="md:col-span-3">
              <Input
                label="Notes / Comments"
                name="notes"
                type="text"
                placeholder="Prescribing clinical notes..."
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
              Log Prescription
            </Button>
          </div>
        </form>
      )}

      {/* Prescription history list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Prescription Records</h2>
          <div className="flex space-x-2">
            <Badge 
              className={`cursor-pointer ${filterStatus === 'ALL' ? 'bg-blue-600 text-white' : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              ALL
            </Badge>
            {['ACTIVE', 'COMPLETED', 'CANCELLED'].map(stat => (
              <Badge 
                key={stat}
                className={`cursor-pointer ${filterStatus === stat ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => setFilterStatus(stat)}
              >
                {stat}
              </Badge>
            ))}
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Prescribed Date</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Medication</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Dosage</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Instructions</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Refills Status</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Expiry Date</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Status</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
            {filteredRx.map(rx => (
              <tr key={rx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td className="p-4 whitespace-nowrap">{formatDate(rx.prescribedDate, 'MM/DD/YYYY')}</td>
                <td className="p-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                  {medications.find(m => m.id === rx.medicationId)?.name || 'Medication'}
                </td>
                <td className="p-4 whitespace-nowrap">{rx.dosage}</td>
                <td className="p-4 whitespace-nowrap">{rx.instructions || '--'}</td>
                <td className="p-4 whitespace-nowrap font-semibold">
                  {rx.refillsAllowed - rx.refillsUsed} refills left (of {rx.refillsAllowed})
                </td>
                <td className="p-4 whitespace-nowrap">{formatDate(rx.expiryDate, 'MM/DD/YYYY')}</td>
                <td className="p-4 whitespace-nowrap">{getStatusBadge(rx)}</td>
                <td className="p-4 whitespace-nowrap space-x-2">
                  {rx.status === 'ACTIVE' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleRefill(rx.id)}>
                        Use Refill
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleCancel(rx.id)}>
                        Cancel
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filteredRx.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No prescriptions logged for this patient.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
