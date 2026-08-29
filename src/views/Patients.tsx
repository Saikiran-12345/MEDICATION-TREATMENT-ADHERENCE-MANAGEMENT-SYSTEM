import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patientService';
import type { Patient } from '../types';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  X, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(() => patientService.getAll());
  
  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'registrationDate'>('registrationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    assignedStaffId: 'staff-1'
  });
  const [formError, setFormError] = useState('');

  // Handle Form Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open Modal for Add
  const handleAddClick = () => {
    setEditingPatient(null);
    setFormData({
      name: '',
      age: '',
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      status: 'ACTIVE',
      assignedStaffId: 'staff-1'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age.toString(),
      gender: patient.gender,
      phone: patient.contactInfo.phone,
      email: patient.contactInfo.email,
      address: patient.contactInfo.address,
      status: patient.status,
      assignedStaffId: patient.assignedStaffId
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Delete Patient
  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient profile? This action will remove all historical records.')) {
      patientService.delete(id);
      setPatients(patientService.getAll());
    }
  };

  // Submit Patient Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formData.name.trim()) {
      setFormError('Patient name is required');
      return;
    }
    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      setFormError('Please enter a valid age (0 - 120)');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Contact phone number is required');
      return;
    }

    try {
      const contactInfo = {
        phone: formData.phone,
        email: formData.email,
        address: formData.address
      };

      if (editingPatient) {
        // Edit Operation
        patientService.update(editingPatient.id, {
          name: formData.name,
          age: ageNum,
          gender: formData.gender,
          contactInfo,
          status: formData.status,
          assignedStaffId: formData.assignedStaffId
        });
      } else {
        // Add Operation
        patientService.create({
          name: formData.name,
          age: ageNum,
          gender: formData.gender,
          contactInfo,
          status: formData.status,
          assignedStaffId: formData.assignedStaffId
        });
      }

      setPatients(patientService.getAll());
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  // Toggle Sorting
  const requestSort = (key: 'name' | 'age' | 'registrationDate') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortBy === key && sortOrder === 'asc') {
      direction = 'desc';
    }
    setSortBy(key);
    setSortOrder(direction);
  };

  // Memoized Filtered and Sorted Patients
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.contactInfo.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let aValue: any = a[sortBy];
        let bValue: any = b[sortBy];

        if (sortBy === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [patients, searchQuery, statusFilter, sortBy, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredPatients, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Registry</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage profiles, registration files, and assign staff check-ups.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 cursor-pointer text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Register Patient
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
            placeholder="Search by name, ID or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            className="block w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
          />
        </div>

        {/* Filter Status */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider select-none">
                <th className="py-4 px-6">Patient ID</th>
                <th className="py-4 px-6 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-1.5">
                    Name <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => requestSort('age')}>
                  <div className="flex items-center gap-1.5">
                    Age <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Contact Info</th>
                <th className="py-4 px-6 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => requestSort('registrationDate')}>
                  <div className="flex items-center gap-1.5">
                    Registered <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm text-gray-700 dark:text-gray-300">
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-gray-500">
                      {patient.id}
                    </td>
                    <td className="py-4 px-6">
                      <Link to={`/patients/${patient.id}`} className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
                        {patient.name}
                      </Link>
                      <div className="text-xs text-gray-400 mt-0.5">{patient.gender}</div>
                    </td>
                    <td className="py-4 px-6">{patient.age} yrs</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-xs">{patient.contactInfo.phone}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{patient.contactInfo.email}</div>
                    </td>
                    <td className="py-4 px-6 text-xs">{patient.registrationDate}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        patient.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                          : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                      }`}>
                        {patient.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {patient.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(patient)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        title="Edit Patient Profile"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(patient.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        title="Delete Patient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <User className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    No patient records found matching selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing Page <span className="font-semibold text-gray-700 dark:text-gray-300">{currentPage}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{totalPages}</span> ({filteredPatients.length} total patients)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Register/Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingPatient ? 'Modify Patient Details' : 'Register New Patient'}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 45"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Home Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Street, City, State..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Registry Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Assigned Staff (Doctor)
                  </label>
                  <select
                    name="assignedStaffId"
                    value={formData.assignedStaffId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="staff-1">Dr. Sarah Jenkins</option>
                  </select>
                </div>
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
                  {editingPatient ? 'Save Changes' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Patients;
