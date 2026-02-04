'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCog, 
  User, 
  Building2, 
  Calendar, 
  Activity, 
  FileText, 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  Clock, 
  TrendingUp, 
  Truck,
  Box,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const json = await res.json();
        if (json.success) {
           setStats(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, colorClass, iconBgClass }: any) => (
    <div className="bg-white p-6 rounded-xl card-shadow hover:shadow-md transition-shadow flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${iconBgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
  );

  const ChartContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
      <div className="bg-white p-6 rounded-xl card-shadow">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
          <div className="h-[250px] w-full">
              {children}
          </div>
      </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-emerald-600">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to AuraSutra Admin Panel</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers || 0} 
          icon={Users} 
          colorClass="text-blue-600" 
          iconBgClass="bg-blue-50" 
        />
        <StatCard 
          title="Total Doctors" 
          value={stats.totalDoctors || 0} 
          icon={UserCog} 
          colorClass="text-emerald-600" 
          iconBgClass="bg-emerald-50" 
        />
        <StatCard 
          title="Total Patients" 
          value={stats.totalPatients || 0} 
          icon={User} 
          colorClass="text-purple-600" 
          iconBgClass="bg-purple-50" 
        />
        <StatCard 
          title="Total Clinics" 
          value={stats.totalClinics || 0} 
          icon={Building2} 
          colorClass="text-orange-600" 
          iconBgClass="bg-orange-50" 
        />
      </div>

      {/* User Growth Chart */}
      {stats.userGrowth && (
        <ChartContainer title="User Growth (Last 6 Months)">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.userGrowth}>
                    <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ stroke: '#3B82F6', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="users" stroke="#3B82F6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                </AreaChart>
             </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Appointments & Medical */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Appointments & Medical</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard 
            title="Total Appointments" 
            value={stats.totalAppointments || 0} 
            icon={Calendar} 
            colorClass="text-blue-600" 
            iconBgClass="bg-blue-50" 
          />
          <StatCard 
            title="Today's Appointments" 
            value={stats.todayAppointments || 0} 
            icon={Activity} 
            colorClass="text-green-600" 
            iconBgClass="bg-green-50" 
          />
          <StatCard 
            title="Total Prescriptions" 
            value={stats.totalPrescriptions || 0} 
            icon={FileText} 
            colorClass="text-indigo-600" 
            iconBgClass="bg-indigo-50" 
          />
        </div>
        
        {/* Appointments Chart */}
        {stats.appointmentTrends && (
            <ChartContainer title="Appointments Trend (Last 7 Days)">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.appointmentTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                        <Tooltip 
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        )}
      </section>

      {/* E-commerce & Marketplace */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">E-commerce & Marketplace</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="Total Medicines" 
            value={stats.totalMedicines || 0} 
            icon={Package} 
            colorClass="text-teal-600" 
            iconBgClass="bg-teal-50" 
          />
          <StatCard 
            title="Low Stock Items" 
            value={stats.lowStockMedicines || 0} 
            icon={Box} 
            colorClass="text-orange-600" 
            iconBgClass="bg-orange-50" 
          />
          <StatCard 
            title="Total Orders" 
            value={stats.totalOrders || 0} 
            icon={ShoppingCart} 
            colorClass="text-blue-600" 
            iconBgClass="bg-blue-50" 
          />
          <StatCard 
            title="Pending Orders" 
            value={stats.pendingOrders || 0} 
            icon={Clock} 
            colorClass="text-yellow-600" 
            iconBgClass="bg-yellow-50" 
          />
        </div>

        {/* Orders Chart */}
        {stats.orderTrends && (
            <ChartContainer title="Orders Trend (Last 7 Days)">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.orderTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                        <Tooltip 
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        )}
      </section>

      {/* Finance & Delivery */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Finance & Delivery</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard 
            title="Total Revenue" 
            value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} 
            icon={TrendingUp} 
            colorClass="text-emerald-600" 
            iconBgClass="bg-emerald-50" 
          />
          <StatCard 
            title="Delivery Agents" 
            value={stats.totalDeliveryAgents || 0} 
            icon={Truck} 
            colorClass="text-purple-600" 
            iconBgClass="bg-purple-50" 
          />
          <StatCard 
            title="Active Agents" 
            value={stats.activeAgents || 0} 
            icon={Truck} 
            colorClass="text-green-600" 
            iconBgClass="bg-green-50" 
          />
        </div>

        {/* Revenue Chart */}
        {stats.dailyRevenue && (
            <ChartContainer title="Revenue Trend (Last 7 Days)">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                         <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#6B7280', fontSize: 12}} 
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            cursor={{ stroke: '#10B981', strokeWidth: 1 }}
                            formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                        />
                        <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <button 
            onClick={() => router.push('/dashboard/appointments')}
            className="bg-white p-4 rounded-xl card-shadow hover:shadow-md transition-all flex items-center gap-4 group text-left"
          >
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="font-semibold text-gray-700">View Appointments</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/orders')}
            className="bg-white p-4 rounded-xl card-shadow hover:shadow-md transition-all flex items-center gap-4 group text-left"
          >
            <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="font-semibold text-gray-700">Manage Orders</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/marketplace')}
            className="bg-white p-4 rounded-xl card-shadow hover:shadow-md transition-all flex items-center gap-4 group text-left"
          >
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <span className="font-semibold text-gray-700">Manage Inventory</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/payments')}
            className="bg-white p-4 rounded-xl card-shadow hover:shadow-md transition-all flex items-center gap-4 group text-left"
          >
            <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="font-semibold text-gray-700">Finance & Payments</span>
          </button>
        </div>
      </section>
    </div>
  );
}
