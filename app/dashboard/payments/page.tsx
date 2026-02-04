'use client';

import { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  CreditCard, 
  Filter, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { FinanceTransaction } from '@/lib/types';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

      if (result.success) {
        setTransactions(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(txn => {
        const patientName = txn.patient?.user?.name?.toLowerCase() || '';
        const doctorName = txn.doctor?.user?.name?.toLowerCase() || '';
        const txnId = txn.transaction_id.toLowerCase();
        
        return patientName.includes(query) || 
               doctorName.includes(query) || 
               txnId.includes(query);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(txn => txn.status === statusFilter);
    }

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
      'Method': txn.payment_method || 'N/A',
      'Date': formatDateTimeForCSV(txn.created_at)
    }));
    exportToCSV(exportData, 'finance_transactions');
  };

  // Stats Logic
  const totalRevenue = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalRefunds = transactions
    .filter(t => t.status === 'refunded')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedData = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700';
      case 'refunded': return 'bg-orange-100 text-orange-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Finance & Payments</h1>
          <p className="text-gray-500 mt-1">Manage and track all financial activity</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/20"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl card-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <div className="p-2 bg-emerald-50 rounded-lg">
               <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl card-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Total Transactions</p>
            <div className="p-2 bg-blue-50 rounded-lg">
               <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl card-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Refunds Processed</p>
            <div className="p-2 bg-orange-50 rounded-lg">
               <RefreshCw className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalRefunds.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl card-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Pending Payments</p>
            <div className="p-2 bg-yellow-50 rounded-lg">
               <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
           <Search className="w-5 h-5 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2" />
           <input
             type="text"
             placeholder="Search by User, Doctor, or Transaction ID..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-12 pr-4 py-3 rounded-xl border border-emerald-100 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 text-gray-700"
           />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-6 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-700 min-w-[180px]"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-6 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-700 min-w-[180px]"
        >
          <option value="all">All Types</option>
          <option value="consultation">Consultation</option>
          <option value="refund">Refund</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-100 text-left">
                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">User / Doctor</th>
                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((txn) => (
                  <tr key={txn.transaction_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-500">#{txn.transaction_id.substring(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{txn.patient?.user?.name || 'Unknown User'}</span>
                        <span className="text-xs text-gray-400">Dr. {txn.doctor?.user?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-sm text-gray-700">{txn.transaction_type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">₹{Number(txn.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(txn.status)}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Pagination Controls */}
       {totalPages > 1 && (
        <div className="flex justify-between items-center px-4">
           <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
           <div className="flex gap-2">
             <button
               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
               disabled={currentPage === 1}
               className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>
             <button
               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
               disabled={currentPage === totalPages}
               className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
             >
               <ArrowRight className="w-5 h-5" />
             </button>
           </div>
        </div>
       )}
    </div>
  );
}
