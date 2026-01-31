'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, UserCog } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Doctor } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import ConfirmDialog from '@/components/ConfirmDialog';
import ProfileImage from '@/components/ProfileImage';
import ImageModal from '@/components/ImageModal';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';
import { useRouter } from 'next/navigation';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, verifiedFilter]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/doctors');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching doctors:', result.error);
        throw new Error(result.error || 'Failed to fetch doctors');
      }

      console.log('Fetched doctors:', result.data);
      setDoctors(result.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(doctor => {
        const name = doctor.user?.name?.toLowerCase() || '';
        const email = doctor.user?.email?.toLowerCase() || '';
        const specialization = doctor.specialization?.toLowerCase() || '';
        const licenseNumber = doctor.license_number?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || 
               email.includes(query) || 
               specialization.includes(query) ||
               licenseNumber.includes(query);
      });
    }

    // Verified filter
    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(doctor => 
        verifiedFilter === 'verified' ? doctor.is_verified : !doctor.is_verified
      );
    }

    setFilteredDoctors(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedDoctor) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('did', selectedDoctor.did);

      if (error) throw error;

      setDoctors(doctors.filter(d => d.did !== selectedDoctor.did));
      setDeleteDialogOpen(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
    }
  };

  const handleExport = () => {
    const exportData = filteredDoctors.map(doctor => ({
      'Doctor ID': doctor.did,
      'Name': doctor.user?.name || 'N/A',
      'Email': doctor.user?.email || 'N/A',
      'Phone': doctor.user?.phone || 'N/A',
      'Specialization': doctor.specialization || 'N/A',
      'License Number': doctor.license_number || 'N/A',
      'Years of Experience': doctor.years_of_experience || 'N/A',
      'Consultation Fee': doctor.consultation_fee || 'N/A',
      'Verified': doctor.is_verified ? 'Yes' : 'No',
      'Created At': formatDateTimeForCSV(doctor.created_at)
    }));

    exportToCSV(exportData, 'doctors');
  };

  // Pagination
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDoctors = filteredDoctors.slice(startIndex, endIndex);

  const columns: Column<Doctor>[] = [
    {
      key: 'user',
      label: 'Doctor',
      render: (doctor) => (
        <div className="flex items-center gap-3">
          <ProfileImage
            imageUrl={doctor.user?.profile_image_url}
            name={doctor.user?.name || 'Doctor'}
            size="md"
            onClick={() => {
              if (doctor.user?.profile_image_url) {
                setSelectedImage({
                  url: doctor.user.profile_image_url,
                  name: doctor.user.name || 'Doctor'
                });
              }
            }}
          />
          <div>
            <p className="font-semibold text-gray-900">{doctor.user?.name || 'Unknown'}</p>
            <p className="text-xs text-gray-500">{doctor.user?.email || ''}</p>
          </div>
        </div>
      ),
      sortable: false
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (doctor) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{doctor.specialization || 'N/A'}</p>
          <p className="text-xs text-gray-500">{doctor.years_of_experience || 0} years exp.</p>
        </div>
      ),
      sortable: true
    },
    {
      key: 'license_number',
      label: 'License',
      render: (doctor) => (
        <p className="text-sm text-gray-600 font-mono">{doctor.license_number || 'N/A'}</p>
      ),
      sortable: false
    },
    {
      key: 'consultation_fee',
      label: 'Fee',
      render: (doctor) => (
        <p className="text-sm font-semibold text-emerald-600">
          ₹{doctor.consultation_fee || 0}
        </p>
      ),
      sortable: true
    },
    {
      key: 'is_verified',
      label: 'Status',
      render: (doctor) => (
        <StatusBadge status={doctor.is_verified ? 'verified' : 'pending'} />
      ),
      sortable: true
    },
    {
      key: 'user.phone',
      label: 'Contact',
      render: (doctor) => (
        <p className="text-sm text-gray-600">{doctor.user?.phone || 'N/A'}</p>
      ),
      sortable: false
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Doctors</h1>
          <p className="text-gray-600 mt-1">Manage all registered doctors</p>
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
          <p className="text-sm text-gray-600">Total Doctors</p>
          <p className="text-2xl font-bold text-emerald-600">{doctors.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            {doctors.filter(d => d.is_verified).length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending Verification</p>
          <p className="text-2xl font-bold text-yellow-600">
            {doctors.filter(d => !d.is_verified).length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Avg. Consultation Fee</p>
          <p className="text-2xl font-bold text-blue-600">
            ₹{doctors.length > 0 
              ? Math.round(doctors.reduce((sum, d) => sum + (d.consultation_fee || 0), 0) / doctors.length)
              : 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            placeholder="Search by name, email, specialization, or license..."
            onSearch={setSearchQuery}
            className="md:col-span-1"
          />
          
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Doctors</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Verification</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedDoctors}
        columns={columns}
        loading={loading}
        emptyMessage="No doctors found"
        onView={(doctor) => router.push(`/dashboard/doctors/${doctor.did}`)}
        onEdit={(doctor) => router.push(`/dashboard/doctors/${doctor.did}/edit`)}
        onDelete={(doctor) => {
          setSelectedDoctor(doctor);
          setDeleteDialogOpen(true);
        }}
        actions={true}
      />

      {/* Pagination */}
      {filteredDoctors.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDoctors.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Doctor"
        message={`Are you sure you want to delete "${selectedDoctor?.user?.name}"? This action cannot be undone and will remove all associated records.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedDoctor(null);
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
