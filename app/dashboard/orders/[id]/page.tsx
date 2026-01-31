
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Package, User, MapPin, CreditCard, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Order, OrderItem } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import Image from 'next/image';

interface OrderDetails extends Order {
  items: (OrderItem & { medicines: { name: string; image_url: string } })[];
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch order with user details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(name, email, phone, profile_image_url)
        `)
        .eq('id', params.id)
        .single();
        
      if (orderError) throw orderError;

      // Fetch order items with medicine details
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          medicines(name, image_url)
        `)
        .eq('order_id', params.id);
        
      if (itemsError) throw itemsError;

      const fullOrder = { ...orderData, items: itemsData } as OrderDetails;
      setOrder(fullOrder);
      setStatus(fullOrder.status);

    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', params.id);

      if (error) throw error;
      
      setStatus(newStatus);
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Order not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  const shippingAddress = order.shipping_address as any;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
              <StatusBadge status={status} type="order" />
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <span className="text-sm font-medium text-gray-700 pl-2">Update Status:</span>
          <select
            value={status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            disabled={updating}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="PENDING_DELIVERY">Pending Delivery</option>
            <option value="ACCEPTED_FOR_DELIVERY">Accepted for Delivery</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {updating && <div className="animate-spin h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                    {item.medicines?.image_url ? (
                      <Image
                        src={item.medicines.image_url}
                        alt={item.medicines.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.medicines?.name || 'Unknown Item'}</h3>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity} × ₹{item.price_at_purchase}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{(item.quantity * item.price_at_purchase).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-emerald-600">₹{order.total_amount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Customer & Shipping Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-500" />
              Customer Details
            </h2>
            <div className="flex items-center gap-4 mb-4">
               {order.user?.profile_image_url ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                   <Image 
                     src={order.user.profile_image_url} 
                     alt={order.user.name || 'User'} 
                     fill 
                     className="object-cover"
                   />
                </div>
               ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                  {order.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
               )}
               <div>
                 <p className="font-medium text-gray-900">{order.user?.name || 'Guest User'}</p>
                 <p className="text-sm text-gray-500">{order.user?.email}</p>
                 {order.user?.phone && <p className="text-sm text-gray-500">{order.user.phone}</p>}
               </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-500" />
              Shipping Address
            </h2>
            {shippingAddress ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p>{shippingAddress.address_line1}</p>
                {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state}
                </p>
                <p>{shippingAddress.postal_code}</p>
                <p>{shippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No shipping address provided</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
