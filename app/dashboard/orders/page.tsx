'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Package } from 'lucide-react';
import { Order } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { exportToCSV, formatDateTimeForCSV } from '@/lib/exportCSV';
import { useRouter } from 'next/navigation';
import ProfileImage from '@/components/ProfileImage';
import ImageModal from '@/components/ImageModal';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching orders:', result.error);
        throw new Error(result.error || 'Failed to fetch orders');
      }

      console.log('Fetched orders:', result.data);
      setOrders(result.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order => {
        const userName = order.user?.name?.toLowerCase() || '';
        const userEmail = order.user?.email?.toLowerCase() || '';
        const orderId = order.id?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return userName.includes(query) || 
               userEmail.includes(query) || 
               orderId.includes(query);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const exportData = filteredOrders.map(order => ({
      'Order ID': order.id,
      'User Name': order.user?.name || 'N/A',
      'User Email': order.user?.email || 'N/A',
      'Status': order.status,
      'Total Amount': order.total_amount,
      'Shipping Address': JSON.stringify(order.shipping_address || {}),
      'Created At': formatDateTimeForCSV(order.created_at)
    }));

    exportToCSV(exportData, 'orders');
  };

  // Calculate revenue
  const totalRevenue = orders
    .filter(o => o.status === 'paid' || o.status === 'DELIVERED')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const columns: Column<Order>[] = [
    {
      key: 'id',
      label: 'Order ID',
      render: (order) => (
        <p className="font-mono text-xs text-gray-600">{order.id.substring(0, 8)}...</p>
      ),
      sortable: false
    },
    {
      key: 'user',
      label: 'Customer',
      render: (order) => (
        <div className="flex items-center gap-3">
          <ProfileImage
            imageUrl={order.user?.profile_image_url}
            name={order.user?.name || 'Customer'}
            size="sm"
            onClick={() => {
              if (order.user?.profile_image_url) {
                setSelectedImage({
                  url: order.user.profile_image_url,
                  name: order.user.name || 'Customer'
                });
              }
            }}
          />
          <div>
            <p className="font-semibold text-gray-900">{order.user?.name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{order.user?.email || ''}</p>
          </div>
        </div>
      ),
      sortable: false
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (order) => (
        <p className="font-semibold text-emerald-600">₹{Number(order.total_amount).toFixed(2)}</p>
      ),
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => <StatusBadge status={order.status} type="order" />,
      sortable: true
    },
    {
      key: 'shipping_address',
      label: 'Shipping',
      render: (order) => {
        const address = order.shipping_address as any;
        return address ? (
          <div className="text-xs text-gray-600">
            <p>{address.city || 'N/A'}</p>
            <p>{address.state || ''}</p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No address</p>
        );
      },
      sortable: false
    },
    {
      key: 'created_at',
      label: 'Order Date',
      render: (order) => (
        <p className="text-sm text-gray-600">
          {new Date(order.created_at).toLocaleDateString()}
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
          <h1 className="text-3xl font-bold gradient-text">Orders</h1>
          <p className="text-gray-600 mt-1">Manage all customer orders</p>
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
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-emerald-600">{orders.length}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'pending' || o.status === 'PENDING_DELIVERY').length}
          </p>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'DELIVERED').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            placeholder="Search by customer name, email, or order ID..."
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
            <option value="PENDING_DELIVERY">Pending Delivery</option>
            <option value="ACCEPTED_FOR_DELIVERY">Accepted for Delivery</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={paginatedOrders}
        columns={columns}
        loading={loading}
        emptyMessage="No orders found"
        onView={(order) => router.push(`/dashboard/orders/${order.id}`)}
        actions={true}
      />

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
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
