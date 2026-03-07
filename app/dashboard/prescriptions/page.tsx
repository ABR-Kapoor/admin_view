'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, FileText } from 'lucide-react';
import { Prescription } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sentFilter, setSentFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);


  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchQuery, activeFilter, sentFilter]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/prescriptions');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching prescriptions:', result.error);
        throw new Error(result.error || 'Failed to fetch prescriptions');
      }

      console.log('Fetched prescriptions:', result.data);
      setPrescriptions(result.data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(rx => {
        const patientName = rx.patient?.user?.name?.toLowerCase() || '';
        const doctorName = rx.doctor?.user?.name?.toLowerCase() || '';
        const diagnosis = rx.diagnosis?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return patientName.includes(query) || 
               doctorName.includes(query) || 
               diagnosis.includes(query);
      });
    }

    // Active filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(rx => 
        activeFilter === 'active' ? rx.is_active : !rx.is_active
      );
    }

    // Sent filter
    if (sentFilter !== 'all') {
      filtered = filtered.filter(rx => 
        sentFilter === 'sent' ? rx.sent_to_patient : !rx.sent_to_patient
      );
    }

    setFilteredPrescriptions(filtered);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const exportData = filteredPrescriptions.map(rx => ({
      'Prescription ID': rx.prescription_id,
      'Patient Name': rx.patient?.user?.name || 'N/A',
      'Doctor Name': rx.doctor?.user?.name || 'N/A',
      'Diagnosis': rx.diagnosis,
      'Medicines Count': Array.isArray(rx.medicines) ? rx.medicines.length : 0,
      'Active': rx.is_active ? 'Yes' : 'No',
      'Sent to Patient': rx.sent_to_patient ? 'Yes' : 'No',
      'AI Generated': rx.ai_generated ? 'Yes' : 'No',
      'Follow-up Date': rx.follow_up_date || 'N/A',
      'Created At': formatDateTimeForCSV(rx.created_at)
    }));

    exportToCSV(exportData, 'prescriptions');
  };

  // Pagination
  const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPrescriptions = filteredPrescriptions.slice(startIndex, endIndex);

  const columns: Column<Prescription>[] = [
    {
      key: 'patient',
      label: 'Patient',
      render: (rx) => (
        <div>
          <p className="font-semibold text-gray-900">{rx.patient?.user?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{rx.patient?.user?.email || ''}</p>
        </div>
      ),
      sortable: false
    },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (rx) => (
        <div>
          <p className="font-semibold text-gray-900">{rx.doctor?.user?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{rx.doctor?.user?.email || ''}</p>
        </div>
      ),
      sortable: false
    },
    {
      key: 'diagnosis',
      label: 'Diagnosis',
      render: (rx) => (
        <p className="text-sm text-gray-900 max-w-xs truncate" title={rx.diagnosis}>
          {rx.diagnosis}
        </p>
      ),
      sortable: true
    },
    {
      key: 'medicines',
      label: 'Medicines',
      render: (rx) => {
        const medicineCount = Array.isArray(rx.medicines) ? rx.medicines.length : 0;
        return (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-emerald-600">{medicineCount}</span>
          </div>
        );
      },
      sortable: false
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (rx) => (
        <StatusBadge status={rx.is_active ? 'active' : 'inactive'} />
      ),
      sortable: true
    },
    {
      key: 'sent_to_patient',
      label: 'Sent',
      render: (rx) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          rx.sent_to_patient 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {rx.sent_to_patient ? 'SENT' : 'NOT SENT'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'ai_generated',
      label: 'AI',
      render: (rx) => (
        rx.ai_generated ? (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
            AI
          </span>
        ) : null
      ),
      sortable: false
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (rx) => (
        <p className="text-sm text-gray-600">
          {new Date(rx.created_at).toLocaleDateString()}
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
          <h1 className="text-3xl font-bold gradient-text">Prescriptions</h1>
          <p className="text-gray-600 mt-1">Manage all prescriptions across the platform</p>
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
          <p className="text-sm text-gray-600">Total Prescriptions</p>
          <p className="text-2xl font-bold text-emerald-600">{prescriptions.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {prescriptions.filter(rx => rx.is_active).length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Sent to Patients</p>
          <p className="text-2xl font-bold text-blue-600">
            {prescriptions.filter(rx => rx.sent_to_patient).length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">AI Generated</p>
          <p className="text-2xl font-bold text-purple-600">
            {prescriptions.filter(rx => rx.ai_generated).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            placeholder="Search by patient, doctor, or diagnosis..."
            onSearch={setSearchQuery}
            className="md:col-span-1"
          />
          
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={sentFilter}
            onChange={(e) => setSentFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Prescriptions</option>
            <option value="sent">Sent to Patient</option>
            <option value="not_sent">Not Sent</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedPrescriptions}
        columns={columns}
        loading={loading}
        emptyMessage="No prescriptions found"
        onView={(rx) => window.location.href = `/dashboard/prescriptions/${rx.prescription_id}`}
        actions={true}
      />

      {/* Pagination */}
      {filteredPrescriptions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPrescriptions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
    </div>
  );
}
