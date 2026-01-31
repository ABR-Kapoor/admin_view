'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FinanceTransaction } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';
import ProfileImage from '@/components/ProfileImage';
import ImageModal from '@/components/ImageModal';

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const supabase = createClient();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, statusFilter, typeFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/transactions');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching transactions:', result.error);
        throw new Error(result.error || 'Failed to fetch transactions');
      }

      console.log('Fetched transactions:', result.data);
      setTransactions(result.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(txn => {
        const patientName = txn.patient?.user?.name?.toLowerCase() || '';
        const doctorName = txn.doctor?.user?.name?.toLowerCase() || '';
        const razorpayId = txn.razorpay_payment_id?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return patientName.includes(query) || 
               doctorName.includes(query) || 
               razorpayId.includes(query);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(txn => txn.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(txn => txn.transaction_type === typeFilter);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(txn => ({
      'Transaction ID': txn.transaction_id,
      'Patient': txn.patient?.user?.name || 'N/A',
      'Doctor': txn.doctor?.user?.name || 'N/A',
      'Type': txn.transaction_type,
      'Amount': txn.amount,
      'Currency': txn.currency,
      'Status': txn.status,
      'Payment Method': txn.payment_method || 'N/A',
      'Razorpay Payment ID': txn.razorpay_payment_id || 'N/A',
      'Created At': formatDateTimeForCSV(txn.created_at)
    }));

    exportToCSV(exportData, 'finance_transactions');
  };

  // Calculate totals
  const totalRevenue = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalRefunds = transactions
    .filter(t => t.status === 'refunded')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const columns: Column<FinanceTransaction>[] = [
    {
      key: 'transaction_id',
      label: 'Transaction ID',
      render: (txn) => (
        <p className="font-mono text-xs text-gray-600">{txn.transaction_id.substring(0, 8)}...</p>
      ),
      sortable: false
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (txn) => (
        <div className="flex items-center gap-3">
          <ProfileImage
            imageUrl={txn.patient?.user?.profile_image_url}
            name={txn.patient?.user?.name || 'Patient'}
            size="sm"
            onClick={() => {
              if (txn.patient?.user?.profile_image_url) {
                setSelectedImage({
                  url: txn.patient.user.profile_image_url,
                  name: txn.patient.user.name || 'Patient'
                });
              }
            }}
          />
          <div>
            <p className="font-semibold text-gray-900">{txn.patient?.user?.name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{txn.patient?.user?.email || ''}</p>
          </div>
        </div>
      ),
      sortable: false
    },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (txn) => (
        <div className="flex items-center gap-3">
          <ProfileImage
            imageUrl={txn.doctor?.user?.profile_image_url}
            name={txn.doctor?.user?.name || 'Doctor'}
            size="sm"
            onClick={() => {
              if (txn.doctor?.user?.profile_image_url) {
                setSelectedImage({
                  url: txn.doctor.user.profile_image_url,
                  name: txn.doctor.user.name || 'Doctor'
                });
              }
            }}
          />
          <div>
            <p className="font-semibold text-gray-900">{txn.doctor?.user?.name || 'N/A'}</p>
          </div>
        </div>
      ),
      sortable: false
    },
    {
      key: 'transaction_type',
      label: 'Type',
      render: (txn) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          txn.transaction_type === 'consultation' ? 'bg-blue-100 text-blue-800' :
          txn.transaction_type === 'refund' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {txn.transaction_type.toUpperCase()}
        </span>
      ),
      sortable: true
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (txn) => (
        <p className="font-semibold text-emerald-600">
          {txn.currency} {Number(txn.amount).toFixed(2)}
        </p>
      ),
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (txn) => <StatusBadge status={txn.status} type="payment" />,
      sortable: true
    },
    {
      key: 'payment_method',
      label: 'Method',
      render: (txn) => (
        <p className="text-sm text-gray-600">{txn.payment_method || 'N/A'}</p>
      ),
      sortable: false
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (txn) => (
        <p className="text-sm text-gray-600">
          {new Date(txn.created_at).toLocaleDateString()}
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
          <h1 className="text-3xl font-bold gradient-text">Finance & Payments</h1>
          <p className="text-gray-600 mt-1">Track all financial transactions</p>
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
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-2xl font-bold text-emerald-600">{transactions.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Refunds</p>
          <p className="text-2xl font-bold text-orange-600">₹{totalRefunds.toFixed(2)}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {transactions.filter(t => t.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            placeholder="Search by patient, doctor, or Razorpay ID..."
            onSearch={setSearchQuery}
            className="md:col-span-1"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="consultation">Consultation</option>
            <option value="refund">Refund</option>
            <option value="cancellation_charge">Cancellation Charge</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedTransactions}
        columns={columns}
        loading={loading}
        emptyMessage="No transactions found"
        actions={false}
      />

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTransactions.length}
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
