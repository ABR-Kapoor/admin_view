'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, 
  UserCog, 
  Calendar, 
  FileText, 
  Package, 
  ShoppingCart, 
  Truck, 
  CreditCard,
  Building2,
  TrendingUp,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalClinics: number;
  totalAppointments: number;
  todayAppointments: number;
  totalPrescriptions: number;
  totalMedicines: number;
  lowStockMedicines: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalDeliveryAgents: number;
  activeAgents: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalClinics: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    totalPrescriptions: 0,
    totalMedicines: 0,
    lowStockMedicines: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalDeliveryAgents: 0,
    activeAgents: 0
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/stats');
      const result = await response.json();

      if (!response.ok) {
        console.error('Error fetching stats:', result.error);
        throw new Error(result.error || 'Failed to fetch stats');
      }

      console.log('Dashboard stats:', result.data);
      setStats(result.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    link 
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    color: string; 
    link?: string;
  }) => (
    <Link 
      href={link || '#'}
      className={`glass-card p-6 rounded-xl hover:shadow-lg transition-all ${link ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>
            {loading ? '...' : value}
          </p>
        </div>
        <div className={`p-4 rounded-full bg-gradient-to-br ${color.replace('text-', 'from-')}-100 ${color.replace('text-', 'to-')}-200`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to AuraSutra Admin Panel</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={UserCog}
          color="text-emerald-600"
          link="/dashboard/doctors"
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="text-purple-600"
          link="/dashboard/patients"
        />
        <StatCard
          title="Total Clinics"
          value={stats.totalClinics}
          icon={Building2}
          color="text-orange-600"
          link="/dashboard/clinics"
        />
      </div>

      {/* Appointments & Medical */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Appointments & Medical</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Appointments"
            value={stats.totalAppointments}
            icon={Calendar}
            color="text-blue-600"
            link="/dashboard/appointments"
          />
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={Activity}
            color="text-green-600"
            link="/dashboard/appointments"
          />
          <StatCard
            title="Total Prescriptions"
            value={stats.totalPrescriptions}
            icon={FileText}
            color="text-indigo-600"
            link="/dashboard/prescriptions"
          />
        </div>
      </div>

      {/* E-commerce */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">E-commerce & Marketplace</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Medicines"
            value={stats.totalMedicines}
            icon={Package}
            color="text-teal-600"
            link="/dashboard/marketplace"
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockMedicines}
            icon={Package}
            color="text-amber-600"
            link="/dashboard/marketplace"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingCart}
            color="text-blue-600"
            link="/dashboard/orders"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={ShoppingCart}
            color="text-yellow-600"
            link="/dashboard/orders"
          />
        </div>
      </div>

      {/* Finance & Delivery */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Finance & Delivery</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toFixed(2)}`}
            icon={TrendingUp}
            color="text-green-600"
            link="/dashboard/payments"
          />
          <StatCard
            title="Delivery Agents"
            value={stats.totalDeliveryAgents}
            icon={Truck}
            color="text-purple-600"
            link="/dashboard/delivery-boys"
          />
          <StatCard
            title="Active Agents"
            value={stats.activeAgents}
            icon={Truck}
            color="text-emerald-600"
            link="/dashboard/delivery-boys"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/appointments"
            className="glass-card p-4 rounded-lg hover:shadow-lg transition-all flex items-center gap-3"
          >
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-700">View Appointments</span>
          </Link>
          <Link
            href="/dashboard/orders"
            className="glass-card p-4 rounded-lg hover:shadow-lg transition-all flex items-center gap-3"
          >
            <ShoppingCart className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold text-gray-700">Manage Orders</span>
          </Link>
          <Link
            href="/dashboard/marketplace"
            className="glass-card p-4 rounded-lg hover:shadow-lg transition-all flex items-center gap-3"
          >
            <Package className="h-6 w-6 text-purple-600" />
            <span className="font-semibold text-gray-700">Manage Inventory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
