'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Package, Truck, UserPlus } from 'lucide-react';
import { Order, DeliveryAgent } from '@/lib/types';
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
  
  // Assignment
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState<Order | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    fetchOrders();
    fetchAgents();
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

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/admin/delivery-agents');
      const result = await response.json();
      if (result.data) {
        setAgents(result.data.filter((a: DeliveryAgent) => a.is_active));
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedOrderForAssignment || !selectedAgentId) return;

    try {
      const response = await fetch('/api/admin/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForAssignment.id,
          deliveryAgentId: selectedAgentId
        })
      });

      if (response.ok) {
        // Refresh orders
        fetchOrders();
        setAssignModalOpen(false);
        setSelectedOrderForAssignment(null);
        setSelectedAgentId('');
      } else {
        alert('Failed to assign order');
      }
    } catch (error) {
      console.error('Error assigning order:', error);
      alert('Error assigning order');
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
    },
    {
      key: 'delivery_agent',
      label: 'Delivery Agent',
      render: (order) => (
        <div className="flex items-center gap-2">
          {order.delivery_agent ? (
             <div className="flex items-center gap-2">
                <ProfileImage imageUrl={order.delivery_agent.profile_image_url} name={order.delivery_agent.name} size="sm" />
                <span className="text-sm font-medium">{order.delivery_agent.name}</span>
             </div>
          ) : (
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderForAssignment(order);
                    setAssignModalOpen(true);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
             >
                <UserPlus className="w-3 h-3" />
                Assign
             </button>
          )}
        </div>
      ),
      sortable: false
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
      {/* Assignment Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Delivery Agent</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select a delivery agent for Order #{selectedOrderForAssignment?.id.substring(0, 8)}
            </p>
            
            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
              {agents.map((agent) => (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedAgentId === agent.id 
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ProfileImage imageUrl={agent.profile_image_url} name={agent.name} size="sm" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.email}</p>
                    </div>
                  </div>
                  {selectedAgentId === agent.id && <div className="w-4 h-4 rounded-full bg-blue-500" />}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedOrderForAssignment(null);
                  setSelectedAgentId('');
                }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssign}
                disabled={!selectedAgentId}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
