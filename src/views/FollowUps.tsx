import React, { useState, useMemo } from 'react';
import { followUpService } from '../services/followUpService';
import { patientService } from '../services/patientService';
import type { FollowUp, Patient } from '../types';
import { 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Calendar, 
  Clock, 
  AlertCircle,
  Clock3
} from 'lucide-react';

export const FollowUps: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => followUpService.getAll());
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FollowUp['status']>('ALL');

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    purpose: '',
    status: 'SCHEDULED' as FollowUp['status'],
    notes: '',
    staffId: 'staff-1'
  });
  const [formError, setFormError] = useState('');

  const getPatientName = (patientId: string) => {
    const pat = patients.find(p => p.id === patientId);
    return pat ? pat.name : 'Unknown Patient';
  };

  const handleAddClick = () => {
    setEditingFollowUp(null);
    setFormData({
      patientId: patients[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      purpose: '',
      status: 'SCHEDULED',
      notes: '',
      staffId: 'staff-1'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (fup: FollowUp) => {
    setEditingFollowUp(fup);
    setFormData({
      patientId: fup.patientId,
      date: fup.date,
      time: fup.time,
      purpose: fup.purpose,
      status: fup.status,
      notes: fup.notes || '',
      staffId: fup.staffId
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this scheduled check-in?')) {
      followUpService.delete(id);
      setFollowUps(followUpService.getAll());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.patientId) {
      setFormError('Patient association is required');
      return;
    }
    if (!formData.date) {
      setFormError('Consultation date is required');
      return;
    }
    if (!formData.time.trim()) {
      setFormError('Timing is required');
      return;
    }
    if (!formData.purpose.trim()) {
      setFormError('Clinical purpose/topic is required');
      return;
    }

    try {
      if (editingFollowUp) {
        followUpService.update(editingFollowUp.id, {
          patientId: formData.patientId,
          date: formData.date,
          time: formData.time,
          purpose: formData.purpose,
          status: formData.status,
          notes: formData.notes
        });
      } else {
        followUpService.create({
          patientId: formData.patientId,
          date: formData.date,
          time: formData.time,
          purpose: formData.purpose,
          status: formData.status,
          notes: formData.notes,
          staffId: formData.staffId
        });
      }
      setFollowUps(followUpService.getAll());
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const getStatusBadge = (status: FollowUp['status']) => {
    let classes = '';
    switch (status) {
      case 'SCHEDULED':
        classes = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400';
        break;
      case 'COMPLETED':
        classes = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400';
        break;
      case 'MISSED':
        classes = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400';
        break;
      case 'CANCELLED':
        classes = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
        break;
    }
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
        {status}
      </span>
    );
  };

  const filteredFollowUps = useMemo(() => {
    return followUps.filter(f => {
      const patName = getPatientName(f.patientId);
      const matchesSearch = patName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            f.purpose.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [followUps, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-up Consultations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Schedule check-ins, record progress check logs, and monitor scheduled check-ins.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 cursor-pointer text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Schedule Visit
        </button>
      </div>

      {/* Searching / Filtering Controls */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by patient name or visit purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
          />
        </div>

        {/* Filter Status */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* FollowUps Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Patient</th>
                <th className="py-4 px-6">Consultation Purpose</th>
                <th className="py-4 px-6">Schedule timing</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm text-gray-700 dark:text-gray-300">
              {filteredFollowUps.length > 0 ? (
                filteredFollowUps.map((fup) => (
                  <tr key={fup.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {getPatientName(fup.patientId)}
                      <div className="text-[10px] text-gray-400 font-mono font-normal mt-0.5">{fup.patientId}</div>
                    </td>
                    <td className="py-4 px-6 max-w-sm">
                      <span className="font-bold text-gray-800 dark:text-gray-200">{fup.purpose}</span>
                      {fup.notes && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-normal italic">
                          "{fup.notes}"
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {fup.date}
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs text-gray-400 mt-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {fup.time}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(fup.status)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(fup)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        title="Update Status / Notes"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(fup.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        title="Cancel Appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Clock3 className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    No scheduled follow-up visits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Follow-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingFollowUp ? 'Update Consultation Appointment' : 'Schedule Follow-up Consultation'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-650 cursor-pointer"
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

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Associate Patient *
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Visit Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Visit Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Appointment Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="MISSED">Missed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Assigned Medical Staff
                  </label>
                  <select
                    name="staffId"
                    value={formData.staffId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="staff-1">Dr. Sarah Jenkins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Purpose of Visit *
                </label>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none"
                  placeholder="e.g. Check blood sugar charts..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none"
                  placeholder="Watch out for initial signs of fatigue..."
                />
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
                  {editingFollowUp ? 'Save Changes' : 'Confirm Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FollowUps;
