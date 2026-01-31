'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Appointment } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';
import ProfileImage from '@/components/ProfileImage';
import ImageModal from '@/components/ImageModal';
import Link from 'next/link';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const supabase = createClient();

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, statusFilter, modeFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/appointments');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching appointments:', result.error);
        throw new Error(result.error || 'Failed to fetch appointments');
      }

      console.log('Fetched appointments:', result.data);
      setAppointments(result.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(apt => {
        const patientName = apt.patient?.user?.name?.toLowerCase() || '';
        const doctorName = apt.doctor?.user?.name?.toLowerCase() || '';
        const complaint = apt.chief_complaint?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return patientName.includes(query) || 
               doctorName.includes(query) || 
               complaint.includes(query);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Mode filter
    if (modeFilter !== 'all') {
      filtered = filtered.filter(apt => apt.mode === modeFilter);
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleExport = () => {
    const exportData = filteredAppointments.map(apt => ({
      'Appointment ID': apt.aid,
      'Patient Name': apt.patient?.user?.name || 'N/A',
      'Doctor Name': apt.doctor?.user?.name || 'N/A',
      'Date': apt.scheduled_date,
      'Time': apt.scheduled_time,
      'Mode': apt.mode,
      'Status': apt.status,
      'Chief Complaint': apt.chief_complaint,
      'Payment Status': apt.payment_status || 'N/A',
      'Created At': formatDateTimeForCSV(apt.created_at)
    }));

    exportToCSV(exportData, 'appointments');
  };

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  const columns: Column<Appointment>[] = [
    {
      key: 'patient',
      label: 'Patient',
      render: (apt) => (
        <div className="flex items-center gap-3">
          <ProfileImage
            imageUrl={apt.patient?.user?.profile_image_url}
            name={apt.patient?.user?.name || 'Patient'}
            size="sm"
            onClick={() => {
              if (apt.patient?.user?.profile_image_url) {
                setSelectedImage({
                  url: apt.patient.user.profile_image_url,
                  name: apt.patient.user.name || 'Patient'
                });
              }
            }}
          />
          <div>
            <p className="font-semibold text-gray-900">{apt.patient?.user?.name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{apt.patient?.user?.email || ''}</p>
          </div>
        </div>
      ),
      sortable: false
    },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (apt) => (
        <div className="flex items-center gap-3">
          <ProfileImage
            imageUrl={apt.doctor?.user?.profile_image_url}
            name={apt.doctor?.user?.name || 'Doctor'}
            size="sm"
            onClick={() => {
              if (apt.doctor?.user?.profile_image_url) {
                setSelectedImage({
                  url: apt.doctor.user.profile_image_url,
                  name: apt.doctor.user.name || 'Doctor'
                });
              }
            }}
          />
          <div>
            <p className="font-semibold text-gray-900">{apt.doctor?.user?.name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{apt.doctor?.user?.email || ''}</p>
          </div>
        </div>
      ),
      sortable: false
    },
    {
      key: 'scheduled_date',
      label: 'Date & Time',
      render: (apt) => (
        <div>
          <p className="font-semibold text-gray-900">{new Date(apt.scheduled_date).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">{apt.scheduled_time}</p>
        </div>
      ),
      sortable: true
    },
    {
      key: 'mode',
      label: 'Mode',
      render: (apt) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          apt.mode === 'online' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          {apt.mode.toUpperCase()}
        </span>
      ),
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (apt) => <StatusBadge status={apt.status} type="appointment" />,
      sortable: true
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (apt) => <StatusBadge status={apt.payment_status || 'pending'} type="payment" />,
      sortable: true
    },
    {
      key: 'chief_complaint',
      label: 'Chief Complaint',
      render: (apt) => (
        <p className="text-sm text-gray-600 max-w-xs truncate" title={apt.chief_complaint}>
          {apt.chief_complaint}
        </p>
      ),
      sortable: false
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage all appointments across the platform</p>
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
          <p className="text-sm text-gray-600">Total Appointments</p>
          <p className="text-2xl font-bold text-emerald-600">{appointments.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Scheduled</p>
          <p className="text-2xl font-bold text-yellow-600">
            {appointments.filter(a => a.status === 'scheduled').length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-blue-600">
            {appointments.filter(a => a.status === 'completed').length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">
            {appointments.filter(a => a.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            placeholder="Search by patient, doctor, or complaint..."
            onSearch={setSearchQuery}
            className="md:col-span-1"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Modes</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedAppointments}
        columns={columns}
        loading={loading}
        emptyMessage="No appointments found"
        onView={(apt) => window.location.href = `/dashboard/appointments/${apt.aid}`}
        actions={true}
      />

      {/* Pagination */}
      {filteredAppointments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAppointments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
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
