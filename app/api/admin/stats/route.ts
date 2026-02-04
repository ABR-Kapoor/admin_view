import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Use service role key for admin access (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// ... (keep imports)

export async function GET() {
    try {
        // Parallel fetch for independent data
        const [
            usersResult,
            doctorsResult,
            patientsResult,
            clinicsResult,
            appointmentsResult,
            prescriptionsResult,
            medicinesResult,
            ordersResult,
            agentsResult,
            transactionsResult
        ] = await Promise.all([
            supabaseAdmin.from('users').select('created_at'),
            supabaseAdmin.from('doctors').select('did', { count: 'exact', head: true }),
            supabaseAdmin.from('patients').select('pid', { count: 'exact', head: true }),
            supabaseAdmin.from('clinics').select('clinic_id', { count: 'exact', head: true }),
            supabaseAdmin.from('appointments').select('scheduled_date, created_at'),
            supabaseAdmin.from('prescriptions').select('prescription_id', { count: 'exact', head: true }),
            supabaseAdmin.from('medicines').select('id, stock_quantity'),
            supabaseAdmin.from('orders').select('created_at, status'),
            supabaseAdmin.from('delivery_agents').select('is_active'),
            // Simplified select to avoid join errors if FKs are missing
            supabaseAdmin.from('finance_transactions')
                .select('transaction_id, amount, status, created_at, paid_at, transaction_type, pid')
                .order('created_at', { ascending: false })
        ]);

        // Basic Counts
        const totalUsers = usersResult.data?.length || 0;
        const totalAppointments = appointmentsResult.data?.length || 0;
        const totalOrders = ordersResult.data?.length || 0;

        // Calculate today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = appointmentsResult.data?.filter(
            a => a.scheduled_date === today
        ).length || 0;

        // Calculate low stock medicines
        const lowStock = medicinesResult.data?.filter(m => m.stock_quantity < 10).length || 0;

        // Calculate pending orders
        const pending = ordersResult.data?.filter(
            o => o.status === 'pending' || o.status === 'PENDING_DELIVERY'
        ).length || 0;

        // Calculate total revenue
        const revenue = transactionsResult.data
            ?.filter(t => t.status === 'paid')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

        console.log(`Total transactions: ${transactionsResult.data?.length}, Revenue: ${revenue}`);

        // Calculate active agents
        const active = agentsResult.data?.filter(a => a.is_active).length || 0;

        // --- CHART DATA GENERATION ---

        // Helper to get last 7 days labels
        const getLast7Days = () => {
             const days = [];
             for (let i = 6; i >= 0; i--) {
                 const d = new Date();
                 d.setDate(d.getDate() - i);
                 days.push({ 
                     date: d.toISOString().split('T')[0],
                     name: d.toLocaleString('default', { weekday: 'short' })
                 });
             }
             return days;
        };
        const last7Days = getLast7Days();

        // 1. User Growth (Last 6 Months)
        const userGrowth = [];
        const appointmentGrowth = [];
        const orderGrowth = [];
        const transactionGrowth = [];

        for(let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = d.toLocaleString('default', { month: 'short' });
            
            // User Growth
            const userCount = usersResult.data?.filter(u => {
                const uDate = new Date(u.created_at);
                return uDate.getMonth() === d.getMonth() && uDate.getFullYear() === d.getFullYear();
            }).length || 0;
            userGrowth.push({ name: monthKey, users: userCount });

            // Appointment Growth
            const apptCount = appointmentsResult.data?.filter(a => {
                const aDate = new Date(a.created_at);
                return aDate.getMonth() === d.getMonth() && aDate.getFullYear() === d.getFullYear();
            }).length || 0;
            appointmentGrowth.push({ name: monthKey, value: apptCount });

            // Order Growth (Market Purchase)
            const orderCount = ordersResult.data?.filter(o => {
                const oDate = new Date(o.created_at);
                return oDate.getMonth() === d.getMonth() && oDate.getFullYear() === d.getFullYear();
            }).length || 0;
            orderGrowth.push({ name: monthKey, value: orderCount });

            // Transaction Growth
            const transCount = transactionsResult.data?.filter(t => {
                const tDate = new Date(t.created_at);
                return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
            }).length || 0;
            const transRevenue = transactionsResult.data?.filter(t => {
                const tDate = new Date(t.created_at);
                return t.status === 'paid' && tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
            }).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
            
            transactionGrowth.push({ name: monthKey, count: transCount, revenue: transRevenue });
        }

        // 2. Appointment Trends (Last 7 Days)
        const appointmentTrends = last7Days.map(day => ({
             name: day.name,
             value: appointmentsResult.data?.filter(a => a.scheduled_date === day.date).length || 0
        }));

        // 3. Order Trends (Last 7 Days)
        const orderTrends = last7Days.map(day => ({
            name: day.name,
            value: ordersResult.data?.filter(o => o.created_at.startsWith(day.date)).length || 0
        }));

        // 4. Daily Revenue (Last 7 Days)
        const dailyRevenue = last7Days.map(day => {
            const dailyTotal = transactionsResult.data
                ?.filter(t => {
                    if (t.status !== 'paid') return false;
                    const dateStr = t.paid_at || t.created_at;
                    if (!dateStr) return false;
                    return dateStr.split('T')[0] === day.date;
                })
                .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
             return { name: day.name, value: dailyTotal };
        });

        // 5. Recent Transactions Process (Manual Join)
        let recentTransactions: any[] = [];
        if (transactionsResult.data && transactionsResult.data.length > 0) {
            const recent = transactionsResult.data.slice(0, 10);
            
            // Collect PIDs
            const pids = [...new Set(recent.map((t: any) => t.pid).filter(Boolean))];
            
            // Fetch Patients
            const { data: patients } = await supabaseAdmin
                .from('patients')
                .select('pid, uid')
                .in('pid', pids);
                
            // Collect UIDs
            const uids = [...new Set(patients?.map((p: any) => p.uid).filter(Boolean))];
            
            // Fetch Users
            const { data: users } = await supabaseAdmin
                .from('users')
                .select('uid, name, profile_image_url')
                .in('uid', uids);

            // Create Maps for O(1) Access
            const patientMap = new Map(patients?.map((p: any) => [p.pid, p]));
            const userMap = new Map(users?.map((u: any) => [u.uid, u]));

            recentTransactions = recent.map((t: any) => {
                const patient = patientMap.get(t.pid);
                const user = patient ? userMap.get(patient.uid) : null;
                
                return {
                    id: t.transaction_id,
                    name: user?.name || 'Unknown User',
                    avatar: user?.profile_image_url || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`,
                    type: t.transaction_type,
                    status: t.status,
                    date: new Date(t.created_at).toLocaleDateString(),
                    amount: Number(t.amount)
                };
            });
        }

        const stats = {
            totalUsers,
            totalDoctors: doctorsResult.count || 0,
            totalPatients: patientsResult.count || 0,
            totalClinics: clinicsResult.count || 0,
            
            totalAppointments,
            todayAppointments: todayAppts,
            totalPrescriptions: prescriptionsResult.count || 0,
            
            totalMedicines: medicinesResult.data?.length || 0,
            lowStockMedicines: lowStock,
            totalOrders,
            pendingOrders: pending,
            
            totalRevenue: revenue,
            totalDeliveryAgents: agentsResult.data?.length || 0,
            activeAgents: active,
            
            recentTransactions,
            dailyRevenue,
            userGrowth,
            appointmentTrends,
            orderTrends,
            appointmentGrowth,
            orderGrowth,
            transactionGrowth
        };

        return NextResponse.json({ success: true, data: stats });
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
