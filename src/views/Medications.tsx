import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { medicationService } from '../services/medicationService';
import { treatmentService } from '../services/treatmentService';
import { patientService } from '../services/patientService';
import type { Medication, Treatment } from '../types';
import { 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Pill, 
  AlertCircle,
  Link as LinkIcon 
} from 'lucide-react';

export const Medications: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>(() => medicationService.getAll());
  const treatments = useMemo<Treatment[]>(() => treatmentService.getAll(), []);
  const patients = useMemo(() => patientService.getAll(), []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [treatmentFilter, setTreatmentFilter] = useState<'ALL' | string>('ALL');

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    treatmentId: '',
    dosage: '',
    instructions: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    notes: ''
  });
  const [formError, setFormError] = useState('');

  const getTreatmentName = (treatmentId: string) => {
    const treat = treatments.find(t => t.id === treatmentId);
    if (!treat) return 'Unknown Plan';
    const pat = patients.find(p => p.id === treat.patientId);
    return `${treat.name} (${pat ? pat.name : 'Unknown'})`;
  };

  const handleAddClick = () => {
    setEditingMedication(null);
    setFormData({
      name: '',
      treatmentId: treatments[0]?.id || '',
      dosage: '',
      instructions: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
      status: 'ACTIVE',
      notes: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (med: Medication) => {
    setEditingMedication(med);
    setFormData({
      name: med.name,
      treatmentId: med.treatmentId,
      dosage: med.dosage,
      instructions: med.instructions,
      startDate: med.startDate,
      endDate: med.endDate,
      status: med.status,
      notes: med.notes || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Delete this medication record? Associated scheduled timings will be removed.')) {
      medicationService.delete(id);
      setMedications(medicationService.getAll());
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
      setFormError('Medication name is required');
      return;
    }
    if (!formData.treatmentId) {
      setFormError('Treatment course association is required');
      return;
    }
    if (!formData.dosage.trim()) {
      setFormError('Clinical dosage (e.g. 500mg) is required for demo purposes');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date cannot precede start date');
      return;
    }

    try {
      if (editingMedication) {
        medicationService.update(editingMedication.id, {
          name: formData.name,
          treatmentId: formData.treatmentId,
          dosage: formData.dosage,
          instructions: formData.instructions,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          notes: formData.notes
        });
      } else {
        medicationService.create({
          name: formData.name,
          treatmentId: formData.treatmentId,
          dosage: formData.dosage,
          instructions: formData.instructions,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          notes: formData.notes
        });
      }
      setMedications(medicationService.getAll());
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const filteredMedications = useMemo(() => {
    return medications.filter((m) => {
      const treatmentName = getTreatmentName(m.treatmentId);
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            treatmentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTreatment = treatmentFilter === 'ALL' || m.treatmentId === treatmentFilter;
      return matchesSearch && matchesTreatment;
    });
  }, [medications, searchQuery, treatmentFilter]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medication Course Records</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage medications, target dosages, and active prescription periods.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 cursor-pointer text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Catalogue Medication
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
            placeholder="Search by medication name, ID or treatment course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
          />
        </div>

        {/* Filter Treatment */}
        <div className="w-full md:w-64">
          <select
            value={treatmentFilter}
            onChange={(e) => setTreatmentFilter(e.target.value)}
            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all cursor-pointer"
          >
            <option value="ALL">All Treatment Courses</option>
            {treatments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Medications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Medication</th>
                <th className="py-4 px-6">Associated Treatment</th>
                <th className="py-4 px-6">Dosage & Instructions</th>
                <th className="py-4 px-6">Active Period</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm text-gray-700 dark:text-gray-300">
              {filteredMedications.length > 0 ? (
                filteredMedications.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block">{med.name}</span>
                          <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">{med.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Link 
                        to={`/treatments/${med.treatmentId}`}
                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="w-3 h-3" />
                        {getTreatmentName(med.treatmentId)}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-xs leading-normal">
                      <div className="font-bold bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded w-max mb-1 text-gray-800 dark:text-gray-300">
                        {med.dosage}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-semibold">{med.instructions}</p>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400">
                      <div>From: {med.startDate}</div>
                      <div>To: {med.endDate}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${
                        med.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400'
                          : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-500'
                      }`}>
                        {med.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(med)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        title="Edit Medication"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(med.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        title="Delete Medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Pill className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    No medication courses found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Medication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingMedication ? 'Edit Medication Details' : 'Add Medication Course'}
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
                  Associate Treatment Course *
                </label>
                <select
                  name="treatmentId"
                  value={formData.treatmentId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  {treatments.map(t => (
                    <option key={t.id} value={t.id}>{getTreatmentName(t.id)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2"
                  placeholder="e.g. Metformin"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Demo Target Dosage *
                  </label>
                  <input
                    type="text"
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2"
                    placeholder="e.g. 500mg or 2 tablets"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Medication Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Usage Instructions *
                </label>
                <input
                  type="text"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2"
                  placeholder="e.g. Take twice daily after meals"
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
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2"
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
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Prescription Notes (Demo Only)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2"
                  placeholder="Watch out for initial nausea..."
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
                  {editingMedication ? 'Save Changes' : 'Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Medications;
