'use client';

import { useState, useEffect } from 'react';
import { Filter, Truck, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: any;
  assigned_to_delivery_boy_id?: string;
  order_items: {
    quantity: number;
    medicine: {
      name: string;
    };
  }[];
}

interface Agent {
  id: string; // delivery_agent id
  name: string;
  is_active: boolean;
  is_available: boolean;
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, agentsRes] = await Promise.all([
        fetch('/api/admin/marketplace/orders'),
        fetch('/api/admin/delivery-agents')
      ]);
      
      const ordersData = await ordersRes.json();
      const agentsData = await agentsRes.json();

      if (Array.isArray(ordersData)) setOrders(ordersData);
      
      // Handle { data: [...] } format or direct array
      if (agentsData.data && Array.isArray(agentsData.data)) {
        setAgents(agentsData.data);
      } else if (Array.isArray(agentsData)) {
        setAgents(agentsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending_delivery') return order.status === 'PENDING_DELIVERY'; // Case sensitive check from DB
    // Add other filters as needed
    return order.status === statusFilter;
  });

  const handleAssign = (order: Order) => {
    setSelectedOrder(order);
    setSelectedAgent('');
    setIsAssignModalOpen(true);
  };

  const submitAssignment = async () => {
    if (!selectedOrder || !selectedAgent) return;

    setAssigning(true);
    try {
      const res = await fetch('/api/admin/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          agentId: selectedAgent
        })
      });

      if (res.ok) {
        // Update local state
        setOrders(orders.map(o => 
          o.id === selectedOrder.id 
            ? { ...o, status: 'ASSIGNED', assigned_to_delivery_boy_id: selectedAgent } 
            : o
        ));
        setIsAssignModalOpen(false);
      } else {
        alert('Failed to assign order');
      }
    } catch (error) {
      console.error('Error assigning order:', error);
      alert('Error assigning order');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Order Management</h2>
        <div className="flex gap-4">
           <select 
             value={statusFilter} 
             onChange={(e) => setStatusFilter(e.target.value)}
             className="px-4 py-2 border rounded-lg"
           >
             <option value="all">All Orders</option>
             <option value="PENDING_DELIVERY">Pending Delivery</option>
             <option value="ASSIGNED">Assigned</option>
             <option value="DELIVERED">Delivered</option>
           </select>
           <button onClick={fetchData} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
             Refresh
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No orders found
                    </td>
                </tr>
            ) : (
                filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-sm text-gray-600">
                    {order.order_number || order.id.slice(0, 8)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{order.customer_name || 'Guest'}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]" title={typeof order.shipping_address === 'object' && order.shipping_address ? `${order.shipping_address.address_line1 || ''}, ${order.shipping_address.city || ''}` : (typeof order.shipping_address === 'string' ? order.shipping_address : '')}>
                    {order.shipping_address && typeof order.shipping_address === 'object' ? (
                        <>
                            {order.shipping_address.address_line1 || ''}
                            {order.shipping_address.city ? `, ${order.shipping_address.city}` : ''}
                        </>
                    ) : (
                        order.shipping_address && typeof order.shipping_address === 'string' 
                            ? (order.shipping_address.startsWith('{') ? 'Address Details' : order.shipping_address) 
                            : 'N/A'
                    )}
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">
                      {order.customer_phone}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    {order.order_items?.[0]?.medicine?.name || 'Unknown Item'}
                    {order.order_items?.length > 1 && ` +${order.order_items.length - 1} more`}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total: ₹{order.total_amount}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={order.status.toLowerCase()} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(order.created_at), 'MMM d, h:mm a')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {order.status === 'PENDING_DELIVERY' && (
                    <button 
                      onClick={() => handleAssign(order)}
                      className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1 rounded-full font-semibold transition-colors"
                    >
                      Assign Agent
                    </button>
                  )}
                  {order.status === 'ASSIGNED' && (
                    <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-semibold">
                       Assigned to {agents.find(a => a.id === order.assigned_to_delivery_boy_id)?.name || 'Agent'}
                    </span>
                  )}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {isAssignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Assign Delivery Agent</h3>
              <p className="text-sm text-gray-500 mt-1">Order #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select an agent --</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.is_available ? '(Available)' : '(Busy)'}
                    </option>
                  ))}
                </select>
              </div>

               <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700">
                  <p className="font-semibold mb-1">Items to Deliver:</p>
                  <ul className="list-disc ml-4 space-y-1">
                      {selectedOrder.order_items?.map((item, idx) => (
                          <li key={idx}>{item.quantity}x {item.medicine?.name || 'Unknown Item'}</li>
                      ))}
                  </ul>
               </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitAssignment}
                disabled={!selectedAgent || assigning}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {assigning ? 'Assigning...' : (
                    <>
                        <Truck className="w-4 h-4" />
                        Confirm Assignment
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
