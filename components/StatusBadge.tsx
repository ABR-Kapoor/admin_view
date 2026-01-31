'use client';

interface StatusBadgeProps {
  status: string;
  type?: 'appointment' | 'order' | 'payment' | 'default';
}

export default function StatusBadge({ status, type = 'default' }: StatusBadgeProps) {
  const getStatusColor = () => {
    const normalizedStatus = status.toLowerCase();
    
    // Appointment statuses
    if (type === 'appointment') {
      switch (normalizedStatus) {
        case 'confirmed':
          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'scheduled':
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'cancelled':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'completed':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'in_progress':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
    
    // Order statuses
    if (type === 'order') {
      switch (normalizedStatus) {
        case 'paid':
        case 'delivered':
          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'pending':
        case 'pending_delivery':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'cancelled':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'accepted_for_delivery':
        case 'out_for_delivery':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
    
    // Payment statuses
    if (type === 'payment') {
      switch (normalizedStatus) {
        case 'paid':
        case 'success':
          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'failed':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'refunded':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
    
    // Default color mapping
    switch (normalizedStatus) {
      case 'active':
      case 'verified':
      case 'success':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inactive':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor()}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}
