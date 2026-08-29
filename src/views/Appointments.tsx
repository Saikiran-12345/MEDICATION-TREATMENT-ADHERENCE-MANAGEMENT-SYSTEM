import type React from 'react';
import { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { patientService } from '../services/patientService';
import { useForm } from '../hooks/useForm';
import { Button, Input, Select, Badge, StatCard } from '../components/ui';
import type { Appointment, Patient, AppointmentType } from '../types';
import { formatDate, formatTime } from '../utils/dateUtils';
import { APPOINTMENT_TYPES } from '../utils/constants';

export const Appointments: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
      const records = appointmentService.getByPatient(selectedPatientId);
      setAppointments(records);
    }
  }, [selectedPatientId]);

  const { values, handleChange, resetForm, handleSubmit, errors } = useForm({
    initialValues: {
      date: '',
      startTime: '',
      endTime: '',
      type: 'CONSULTATION' as AppointmentType,
      location: '',
      notes: ''
    },
    validate: (vals) => {
      const errs: Record<string, string[]> = {};
      if (!vals.date) {
        errs.date = ['Date is required.'];
      }
      if (!vals.startTime) {
        errs.startTime = ['Start time is required.'];
      }
      if (!vals.location) {
        errs.location = ['Location is required.'];
      }
      return errs;
    },
    onSubmit: (vals) => {
      appointmentService.add({
        patientId: selectedPatientId,
        staffId: 'staff-1',
        date: vals.date,
        startTime: vals.startTime,
        endTime: vals.endTime || vals.startTime,
        type: vals.type,
        location: vals.location,
        isRecurring: false,
        notes: vals.notes || undefined
      });

      // Refresh list
      setAppointments(appointmentService.getByPatient(selectedPatientId));
      setShowAddForm(false);
      resetForm();
    }
  });

  const handleUpdateStatus = (id: string, status: Appointment['status']) => {
    const success = appointmentService.setStatus(id, status);
    if (success) {
      setAppointments(appointmentService.getByPatient(selectedPatientId));
    }
  };

  const filteredAppts = appointments.filter(a => filterType === 'ALL' || a.type === filterType);
  const upcomingAppts = appointmentService.getUpcomingByPatient(selectedPatientId);

  const getStatusBadge = (appt: Appointment) => {
    const variants = {
      SCHEDULED: 'warning' as const,
      CONFIRMED: 'success' as const,
      IN_PROGRESS: 'info' as const,
      COMPLETED: 'success' as const,
      CANCELLED: 'danger' as const,
      NO_SHOW: 'danger' as const
    };
    return <Badge variant={variants[appt.status]}>{appt.status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clinic Appointment Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Schedule, log, and update patient clinic consultations and appointments.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel Scheduling' : 'Schedule Appointment'}
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
          title="Total Scheduled Appointments"
          value={appointments.length}
          description="Cumulative clinic checks"
        />
        <StatCard
          title="Upcoming Appointments"
          value={upcomingAppts.length}
          description="Pending patient slots"
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Cancelled/No Show"
          value={appointments.filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length}
          description="Missed appointment slots"
          className="border-l-4 border-l-rose-500"
        />
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Schedule Appointment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Date"
              name="date"
              type="date"
              value={values.date}
              onChange={handleChange}
              error={errors.date?.[0]}
            />
            <Input
              label="Start Time"
              name="startTime"
              type="time"
              value={values.startTime}
              onChange={handleChange}
              error={errors.startTime?.[0]}
            />
            <Input
              label="End Time"
              name="endTime"
              type="time"
              value={values.endTime}
              onChange={handleChange}
            />
            <Select
              label="Appointment Type"
              name="type"
              value={values.type}
              onChange={handleChange}
              options={APPOINTMENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
            />
            <Input
              label="Location / Room"
              name="location"
              type="text"
              placeholder="e.g. Consult Room B"
              value={values.location}
              onChange={handleChange}
              error={errors.location?.[0]}
            />
            <Input
              label="Clinical Notes"
              name="notes"
              type="text"
              placeholder="Add appointment context..."
              value={values.notes}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => { setShowAddForm(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Slot
            </Button>
          </div>
        </form>
      )}

      {/* Appointment History List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Appointment Listings</h2>
          <div className="flex space-x-2">
            <Badge 
              className={`cursor-pointer ${filterType === 'ALL' ? 'bg-blue-600 text-white' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              ALL
            </Badge>
            {APPOINTMENT_TYPES.slice(0, 4).map(type => (
              <Badge 
                key={type.value}
                className={`cursor-pointer ${filterType === type.value ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => setFilterType(type.value)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Scheduled Date</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Time Window</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Consultation Type</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Clinic Location</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Status</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Clinical Notes</th>
              <th className="p-4 border-b border-gray-200 dark:border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
            {filteredAppts.map(a => (
              <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td className="p-4 whitespace-nowrap">{formatDate(a.date, 'MM/DD/YYYY')}</td>
                <td className="p-4 whitespace-nowrap font-medium text-gray-950 dark:text-gray-100">
                  {formatTime(a.startTime)} - {formatTime(a.endTime)}
                </td>
                <td className="p-4 whitespace-nowrap">{a.type}</td>
                <td className="p-4 whitespace-nowrap">{a.location}</td>
                <td className="p-4 whitespace-nowrap">{getStatusBadge(a)}</td>
                <td className="p-4 max-w-xs truncate">{a.notes || '--'}</td>
                <td className="p-4 whitespace-nowrap space-x-2">
                  {a.status === 'SCHEDULED' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(a.id, 'CONFIRMED')}>
                        Confirm
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleUpdateStatus(a.id, 'CANCELLED')}>
                        Cancel
                      </Button>
                    </>
                  )}
                  {a.status === 'CONFIRMED' && (
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(a.id, 'COMPLETED')}>
                      Complete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filteredAppts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No appointments scheduled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
