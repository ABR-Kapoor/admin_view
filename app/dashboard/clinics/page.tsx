'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Building2 } from 'lucide-react';
import { Clinic } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import ConfirmDialog from '@/components/ConfirmDialog';
import ProfileImage from '@/components/ProfileImage';
import ImageModal from '@/components/ImageModal';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';
import { useRouter } from 'next/navigation';

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const router = useRouter();

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    filterClinics();
  }, [clinics, searchQuery, verifiedFilter]);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/clinics');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching clinics:', result.error);
        throw new Error(result.error || 'Failed to fetch clinics');
      }

      console.log('Fetched clinics:', result.data);
      setClinics(result.data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  const filterClinics = () => {
    let filtered = clinics;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(clinic => {
        const name = clinic.clinic_name?.toLowerCase() || '';
        const city = clinic.city?.toLowerCase() || '';
        const state = clinic.state?.toLowerCase() || '';
        const ownerName = clinic.user?.name?.toLowerCase() || '';
        const ownerEmail = clinic.user?.email?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || 
               city.includes(query) || 
               state.includes(query) ||
               ownerName.includes(query) ||
               ownerEmail.includes(query);
      });
    }

    // Verified filter
    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(clinic => 
        verifiedFilter === 'verified' ? clinic.is_verified : !clinic.is_verified
      );
    }

    setFilteredClinics(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedClinic) return;

    try {
      const response = await fetch(`/api/admin/clinics/${selectedClinic.clinic_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete clinic');
      }

      setClinics(clinics.filter(c => c.clinic_id !== selectedClinic.clinic_id));
      setDeleteDialogOpen(false);
      setSelectedClinic(null);
    } catch (error) {
      console.error('Error deleting clinic:', error);
      alert('Failed to delete clinic');
    }
  };

  const handleToggleVerification = async (clinicId: string, currentStatus: boolean) => {
    if (!clinicId) return;

    // Optimistic update
    const previousClinics = [...clinics];
    const newStatus = !currentStatus;
    
    // Update local state immediately
    setClinics(currentClinics => currentClinics.map(c => 
      c.clinic_id === clinicId ? { ...c, is_verified: newStatus } : c
    ));

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      // Revert on error
      setClinics(previousClinics);
      alert('Failed to update verification status');
    }
  };

  const handleExport = () => {
    const exportData = filteredClinics.map(clinic => ({
      'Clinic ID': clinic.clinic_id,
      'Clinic Name': clinic.clinic_name,
      'Owner Name': clinic.user?.name || 'N/A',
      'Owner Email': clinic.user?.email || 'N/A',
      'Owner Phone': clinic.user?.phone || 'N/A',
      'Registration Number': clinic.registration_number || 'N/A',
      'Address Line 1': clinic.address_line1 || 'N/A',
      'Address Line 2': clinic.address_line2 || 'N/A',
      'City': clinic.city || 'N/A',
      'State': clinic.state || 'N/A',
      'Postal Code': clinic.postal_code || 'N/A',
      'Phone': clinic.phone || 'N/A',
      'Email': clinic.email || 'N/A',
      'Website': clinic.website || 'N/A',
      'Verified': clinic.is_verified ? 'Yes' : 'No',
      'Created At': formatDateTimeForCSV(clinic.created_at)
    }));

    exportToCSV(exportData, 'clinics');
  };

  // Pagination
  const totalPages = Math.ceil(filteredClinics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClinics = filteredClinics.slice(startIndex, endIndex);

  const columns: Column<Clinic>[] = [
    {
      key: 'clinic_name',
      label: 'Clinic Name',
      render: (clinic) => (
        <div>
          <p className="font-semibold text-gray-900">{clinic.clinic_name}</p>
          <p className="text-xs text-gray-500">{clinic.registration_number || 'No Reg. Number'}</p>
        </div>
      ),
      sortable: true
    },
    {
      key: 'user',
      label: 'Owner',
      render: (clinic) => (
        <div className="flex items-center gap-3">
          <ProfileImage
            imageUrl={clinic.user?.profile_image_url}
            name={clinic.user?.name || 'Owner'}
            size="md"
            onClick={() => {
              if (clinic.user?.profile_image_url) {
                setSelectedImage({
                  url: clinic.user.profile_image_url,
                  name: clinic.user.name || 'Owner'
                });
              }
            }}
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">{clinic.user?.name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{clinic.user?.email || ''}</p>
          </div>
        </div>
      ),
      sortable: false
    },
    {
      key: 'city',
      label: 'Location',
      render: (clinic) => (
        <div>
          <p className="text-sm text-gray-900">{clinic.city || 'N/A'}</p>
          <p className="text-xs text-gray-500">{clinic.state || ''}</p>
        </div>
      ),
      sortable: true
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (clinic) => (
        <div>
          <p className="text-sm text-gray-900">{clinic.phone || 'N/A'}</p>
          <p className="text-xs text-gray-500">{clinic.email || ''}</p>
        </div>
      ),
      sortable: false
    },
    {
      key: 'is_verified',
      label: 'Status',
      render: (clinic) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleToggleVerification(clinic.clinic_id, !!clinic.is_verified)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              clinic.is_verified ? 'bg-emerald-500' : 'bg-gray-200'
            }`}
          >
            <span className="sr-only">Toggle verification</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                clinic.is_verified ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            clinic.is_verified 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {clinic.is_verified ? 'Verified' : 'Pending'}
          </span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'created_at',
      label: 'Registered',
      render: (clinic) => (
        <p className="text-sm text-gray-600">
          {new Date(clinic.created_at).toLocaleDateString()}
        </p>
      ),
      sortable: true
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Clinics</h1>
          <p className="text-gray-600 mt-1">Manage all registered clinics and their owners</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Clinics</p>
          <p className="text-2xl font-bold text-emerald-600">{clinics.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            {clinics.filter(c => c.is_verified).length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending Verification</p>
          <p className="text-2xl font-bold text-yellow-600">
            {clinics.filter(c => !c.is_verified).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            placeholder="Search by clinic name, owner, city, or state..."
            onSearch={setSearchQuery}
            className="md:col-span-1"
          />
          
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Clinics</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Verification</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredClinics.length} of {clinics.length} clinics
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedClinics}
        columns={columns}
        loading={loading}
        emptyMessage="No clinics found"
        onView={(clinic) => {
          console.log('Viewing clinic:', clinic);
          if (clinic.clinic_id) {
            router.push(`/dashboard/clinics/${clinic.clinic_id}`);
          } else {
            console.error('Clinic has no clinic_id:', clinic);
          }
        }}
        onEdit={(clinic) => {
          console.log('Editing clinic:', clinic);
          if (clinic.clinic_id) {
            router.push(`/dashboard/clinics/${clinic.clinic_id}/edit`);
          } else {
            console.error('Clinic has no clinic_id:', clinic);
          }
        }}
        onDelete={(clinic) => {
          setSelectedClinic(clinic);
          setDeleteDialogOpen(true);
        }}
        actions={true}
      />

      {/* Pagination */}
      {filteredClinics.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClinics.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Clinic"
        message={`Are you sure you want to delete "${selectedClinic?.clinic_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedClinic(null);
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
