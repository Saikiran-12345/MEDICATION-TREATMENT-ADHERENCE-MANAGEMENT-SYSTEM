import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { noteService } from '../services/noteService';
import { patientService } from '../services/patientService';
import type { Note, Patient } from '../types';
import { 
  FileText, 
  Search, 
  Trash2, 
  PlusCircle, 
  X, 
  AlertCircle,
  Tag
} from 'lucide-react';

export const Notes: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>(() => noteService.getAll());
  const patients = useMemo<Patient[]>(() => patientService.getAll(), []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | Note['category']>('ALL');
  const [selectedPatientId, setSelectedPatientId] = useState<'ALL' | string>('ALL');

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    category: 'GENERAL' as Note['category'],
    content: ''
  });
  const [formError, setFormError] = useState('');

  const getPatientName = (patientId: string) => {
    const pat = patients.find(p => p.id === patientId);
    return pat ? pat.name : 'Unknown Patient';
  };

  const handleAddClick = () => {
    setFormData({
      patientId: patients[0]?.id || '',
      category: 'GENERAL',
      content: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Delete this clinical note? This action is tracked in the audit logs.')) {
      noteService.delete(id);
      setNotes(noteService.getAll());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.content.trim()) {
      setFormError('Note content cannot be blank');
      return;
    }
    if (!formData.patientId) {
      setFormError('Patient association is required');
      return;
    }

    try {
      noteService.create({
        patientId: formData.patientId,
        authorId: user?.id || 'staff-1',
        authorName: user?.name || 'Medical Staff',
        content: formData.content,
        category: formData.category
      });
      
      setNotes(noteService.getAll());
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const getCategoryBadge = (category: Note['category']) => {
    let classes = '';
    switch (category) {
      case 'ADHERENCE':
        classes = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400';
        break;
      case 'FOLLOW_UP':
        classes = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400';
        break;
      case 'ADMINISTRATIVE':
        classes = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400';
        break;
      default:
        classes = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${classes}`}>
        <Tag className="w-3 h-3" />
        {category}
      </span>
    );
  };

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const patientName = getPatientName(n.patientId);
        const matchesSearch = n.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              n.authorName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || n.category === categoryFilter;
        const matchesPatient = selectedPatientId === 'ALL' || n.patientId === selectedPatientId;
        return matchesSearch && matchesCategory && matchesPatient;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, searchQuery, categoryFilter, selectedPatientId]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Healthcare Notes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Record administrative details, check-in updates, and adherence notes.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 cursor-pointer text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Add Log Note
        </button>
      </div>

      {/* Searching / Filtering Controls */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by keywords or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
          />
        </div>

        {/* Filter Patient */}
        <div>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-sm"
          >
            <option value="ALL">All Patients</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Category */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-sm"
          >
            <option value="ALL">All Categories</option>
            <option value="GENERAL">General Clinical</option>
            <option value="FOLLOW_UP">Follow-up check-ins</option>
            <option value="ADHERENCE">Adherence alerts</option>
            <option value="ADMINISTRATIVE">Administrative notes</option>
          </select>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div 
              key={note.id} 
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition duration-200"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 dark:text-white">{getPatientName(note.patientId)}</span>
                  {getCategoryBadge(note.category)}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
                  <span>Author: {note.authorName}</span>
                  <span>|</span>
                  <span>{new Date(note.date).toLocaleString()}</span>
                </div>
              </div>

              {/* Note Content */}
              <div className="py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </div>

              {/* Action */}
              <div className="flex justify-end pt-3 border-t border-gray-50 dark:border-gray-700/30">
                <button
                  onClick={() => handleDeleteClick(note.id)}
                  className="p-1 text-gray-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer transition"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 py-12 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No healthcare notes found matching criteria.
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white font-sans">
                Log Healthcare Note
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Select Patient *
                  </label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer animate-fade-in"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Note Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="GENERAL">General Clinical</option>
                    <option value="FOLLOW_UP">Follow-up check-in</option>
                    <option value="ADHERENCE">Adherence alert</option>
                    <option value="ADMINISTRATIVE">Administrative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Note Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none"
                  placeholder="Record note details here..."
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
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Notes;
