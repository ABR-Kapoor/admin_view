'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend,
  ComposedChart
} from 'recharts';
import { 
  Calendar, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp, 
  Activity 
} from 'lucide-react';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const json = await res.json();
        if (json.success) {
           setStats(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data', error);
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

  const ChartContainer = ({ title, icon: Icon, children }: { title: string, icon?: any, children: React.ReactNode }) => (
      <div className="bg-white p-6 rounded-xl card-shadow h-[400px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            {Icon && <div className="p-2 bg-emerald-50 rounded-lg"><Icon className="w-5 h-5 text-emerald-600" /></div>}
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          </div>
          <div className="flex-1 w-full min-h-0">
              {children}
          </div>
      </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-emerald-600">Statistics & Analytics</h1>
        <p className="text-gray-500 mt-1">Comprehensive overview of platform performance (Last 6 Months)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Overall Appointment Timeline */}
        <div className="lg:col-span-2">
            <ChartContainer title="Overall Appointments" icon={Calendar}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.appointmentGrowth}>
                        <defs>
                            <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            cursor={{ stroke: '#10B981', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="value" name="Appointments" stroke="#10B981" fillOpacity={1} fill="url(#colorAppts)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>

        {/* Market Purchase Timeline */}
        <ChartContainer title="Market Purchases" icon={ShoppingCart}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.orderGrowth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ fill: '#F3F4F6' }}
                    />
                    <Bar dataKey="value" name="Orders" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>

        {/* Transaction Timeline */}
        <ChartContainer title="Transactions" icon={CreditCard}>
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.transactionGrowth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} unit="₹" />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Transactions" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={30} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#F59E0B" strokeWidth={3} dot={{r: 4}} />
                </ComposedChart>
            </ResponsiveContainer>
        </ChartContainer>

      </div>
    </div>
  );
}
