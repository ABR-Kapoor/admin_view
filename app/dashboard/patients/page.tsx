'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Patient } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import Pagination from '@/components/Pagination';
import ConfirmDialog from '@/components/ConfirmDialog';
import ProfileImage from '@/components/ProfileImage';
import ImageModal from '@/components/ImageModal';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';
import { useRouter } from 'next/navigation';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery, genderFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/patients');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching patients:', result.error);
        throw new Error(result.error || 'Failed to fetch patients');
      }

      console.log('Fetched patients:', result.data);
      setPatients(result.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(patient => {
        const name = patient.user?.name?.toLowerCase() || '';
        const email = patient.user?.email?.toLowerCase() || '';
        const phone = patient.user?.phone?.toLowerCase() || '';
        const bloodGroup = patient.blood_group?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || 
               email.includes(query) || 
               phone.includes(query) ||
               bloodGroup.includes(query);
      });
    }

    // Gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(patient => patient.gender === genderFilter);
    }

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedPatient) return;

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('pid', selectedPatient.pid);

      if (error) throw error;

      setPatients(patients.filter(p => p.pid !== selectedPatient.pid));
      setDeleteDialogOpen(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Failed to delete patient');
    }
  };

  const handleExport = () => {
    const exportData = filteredPatients.map(patient => ({
      'Patient ID': patient.pid,
      'Name': patient.user?.name || 'N/A',
      'Email': patient.user?.email || 'N/A',
      'Phone': patient.user?.phone || 'N/A',
      'Gender': patient.gender || 'N/A',
      'Date of Birth': patient.date_of_birth || 'N/A',
      'Blood Group': patient.blood_group || 'N/A',
      'City': patient.city || 'N/A',
      'State': patient.state || 'N/A',
      'Emergency Contact': patient.emergency_contact_name || 'N/A',
      'Emergency Phone': patient.emergency_contact_phone || 'N/A',
      'Created At': formatDateTimeForCSV(patient.created_at)
    }));

    exportToCSV(exportData, 'patients');
  };

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  const columns: Column<Patient>[] = [
    {
      key: 'user',
      label: 'Patient',
      render: (patient) => (
        <div className="flex items-center gap-3">
          <ProfileImage
            imageUrl={patient.user?.profile_image_url}
            name={patient.user?.name || 'Patient'}
            size="md"
            onClick={() => {
              if (patient.user?.profile_image_url) {
                setSelectedImage({
                  url: patient.user.profile_image_url,
                  name: patient.user.name || 'Patient'
                });
              }
            }}
          />
          <div>
            <p className="font-semibold text-gray-900">{patient.user?.name || 'Unknown'}</p>
            <p className="text-xs text-gray-500">{patient.user?.email || ''}</p>
          </div>
        </div>
      ),
      sortable: false
    },
    {
      key: 'date_of_birth',
      label: 'Age / DOB',
      render: (patient) => {
        const age = patient.date_of_birth 
          ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
          : null;
        return (
          <div>
            {age && <p className="text-sm font-semibold text-gray-900">{age} years</p>}
            <p className="text-xs text-gray-500">{patient.date_of_birth || 'N/A'}</p>
          </div>
        );
      },
      sortable: true
    },
    {
      key: 'gender',
      label: 'Gender',
      render: (patient) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          patient.gender === 'male' ? 'bg-blue-100 text-blue-800' :
          patient.gender === 'female' ? 'bg-pink-100 text-pink-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {patient.gender?.toUpperCase() || 'N/A'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'blood_group',
      label: 'Blood Group',
      render: (patient) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          {patient.blood_group || 'N/A'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'city',
      label: 'Location',
      render: (patient) => (
        <div>
          <p className="text-sm text-gray-900">{patient.city || 'N/A'}</p>
          <p className="text-xs text-gray-500">{patient.state || ''}</p>
        </div>
      ),
      sortable: false
    },
    {
      key: 'user.phone',
      label: 'Contact',
      render: (patient) => (
        <p className="text-sm text-gray-600">{patient.user?.phone || 'N/A'}</p>
      ),
      sortable: false
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Patients</h1>
          <p className="text-gray-600 mt-1">Manage patient records</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Download className="h-5 w-5" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Patients</p>
          <p className="text-2xl font-bold text-blue-600">{patients.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Male</p>
          <p className="text-2xl font-bold text-blue-600">
            {patients.filter(p => p.gender === 'male').length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Female</p>
          <p className="text-2xl font-bold text-pink-600">
            {patients.filter(p => p.gender === 'female').length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Other</p>
          <p className="text-2xl font-bold text-purple-600">
            {patients.filter(p => p.gender === 'other' || p.gender === 'prefer_not_to_say').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            placeholder="Search by name, email, phone, or blood group..."
            onSearch={setSearchQuery}
            className="md:col-span-1"
          />
          
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer Not to Say</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredPatients.length} of {patients.length} patients
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedPatients}
        columns={columns}
        loading={loading}
        emptyMessage="No patients found"
        onView={(patient) => router.push(`/dashboard/patients/${patient.pid}`)}
        onEdit={(patient) => router.push(`/dashboard/patients/${patient.pid}/edit`)}
        onDelete={(patient) => {
          setSelectedPatient(patient);
          setDeleteDialogOpen(true);
        }}
        actions={true}
      />

      {/* Pagination */}
      {filteredPatients.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPatients.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Patient"
        message={`Are you sure you want to delete "${selectedPatient?.user?.name}"? This action cannot be undone and will remove all associated records.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedPatient(null);
        }}
      />

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          name={selectedImage.name}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
