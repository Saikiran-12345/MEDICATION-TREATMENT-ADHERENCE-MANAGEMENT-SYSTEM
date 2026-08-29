import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { treatmentService } from '../services/treatmentService';
import { patientService } from '../services/patientService';
import type { Treatment, Patient } from '../types';
import { 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Calendar, 
  Play, 
  Pause, 
  XCircle, 
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

export const Treatments: React.FC = () => {
  const [treatments, setTreatments] = useState<Treatment[]>(() => treatmentService.getAll());
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Treatment['status']>('ALL');

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED' as Treatment['status'],
    notes: '',
    assignedStaffId: 'staff-1'
  });
  const [formError, setFormError] = useState('');

  const getPatientName = (patientId: string) => {
    const pat = patients.find(p => p.id === patientId);
    return pat ? pat.name : 'Unknown Patient';
  };

  const handleAddClick = () => {
    setEditingTreatment(null);
    setFormData({
      patientId: patients[0]?.id || '',
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
      status: 'PLANNED',
      notes: '',
      assignedStaffId: 'staff-1'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setFormData({
      patientId: treatment.patientId,
      name: treatment.name,
      startDate: treatment.startDate,
      endDate: treatment.endDate,
      status: treatment.status,
      notes: treatment.notes || '',
      assignedStaffId: treatment.assignedStaffId
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Delete this treatment course? Associated schedules and doses will remain in history.')) {
      treatmentService.delete(id);
      setTreatments(treatmentService.getAll());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Treatment course name is required');
      return;
    }
    if (!formData.patientId) {
      setFormError('Patient association is required');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date cannot precede start date');
      return;
    }

    try {
      if (editingTreatment) {
        treatmentService.update(editingTreatment.id, {
          patientId: formData.patientId,
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          notes: formData.notes
        });
      } else {
        treatmentService.create({
          patientId: formData.patientId,
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          notes: formData.notes,
          assignedStaffId: formData.assignedStaffId
        });
      }
      setTreatments(treatmentService.getAll());
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const getStatusBadge = (status: Treatment['status']) => {
    let classes = '';
    let icon = null;

    switch (status) {
      case 'ACTIVE':
        classes = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30';
        icon = <Play className="w-3 h-3" />;
        break;
      case 'PLANNED':
        classes = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
        icon = <Calendar className="w-3 h-3" />;
        break;
      case 'PAUSED':
        classes = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
        icon = <Pause className="w-3 h-3" />;
        break;
      case 'COMPLETED':
        classes = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
        icon = <CheckCircle className="w-3 h-3" />;
        break;
      case 'CANCELLED':
        classes = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
        icon = <XCircle className="w-3 h-3" />;
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
        {icon}
        {status}
      </span>
    );
  };

  const filteredTreatments = useMemo(() => {
    return treatments.filter((t) => {
      const patientName = getPatientName(t.patientId);
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            patientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [treatments, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treatment Courses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Define patient therapeutic durations, timelines, and check progress metrics.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 cursor-pointer text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Add Treatment Plan
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by treatment or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
          />
        </div>

        {/* Status Select */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Treatments Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTreatments.length > 0 ? (
          filteredTreatments.map((treatment) => (
            <div 
              key={treatment.id} 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Top Details */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono text-gray-400 font-semibold">{treatment.id}</span>
                  {getStatusBadge(treatment.status)}
                </div>

                <Link 
                  to={`/treatments/${treatment.id}`}
                  className="block font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                >
                  {treatment.name}
                </Link>

                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1">
                  Patient: <span className="text-blue-600 dark:text-blue-400">{getPatientName(treatment.patientId)}</span>
                </div>

                {treatment.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 line-clamp-2">
                    {treatment.notes}
                  </p>
                )}
              </div>

              {/* Date Progression details */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Starts: {treatment.startDate}</span>
                  <span>Ends: {treatment.endDate}</span>
                </div>

                {/* Card Controls */}
                <div className="flex justify-between items-center mt-4 pt-2">
                  <Link 
                    to={`/treatments/${treatment.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View Details &rarr;
                  </Link>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(treatment)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      title="Edit Course"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(treatment.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 py-12 text-center text-gray-400">
            <Activity className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No treatment courses found.
          </div>
        )}
      </div>

      {/* Add/Edit Treatment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingTreatment ? 'Edit Treatment Plan' : 'Define New Treatment Plan'}
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

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Associate Patient *
                </label>
                <select
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Treatment Course Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Hypertension Control Plan"
                />
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
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Assigned Medical Staff
                  </label>
                  <select
                    name="assignedStaffId"
                    value={formData.assignedStaffId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="staff-1">Dr. Sarah Jenkins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Clinical Notes / Target Outcomes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2"
                  placeholder="Target BP < 130/80..."
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
                  {editingTreatment ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Treatments;
