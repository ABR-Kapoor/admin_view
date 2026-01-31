import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET() {
    try {
        // Fetch all counts in parallel
        const [
            usersResult,
            doctorsResult,
            patientsResult,
            clinicsResult,
            appointmentsResult,
            prescriptionsResult,
            medicinesResult,
            ordersResult,
            transactionsResult,
            agentsResult
        ] = await Promise.all([
            supabaseAdmin.from('users').select('uid', { count: 'exact', head: true }),
            supabaseAdmin.from('doctors').select('did', { count: 'exact', head: true }),
            supabaseAdmin.from('patients').select('pid', { count: 'exact', head: true }),
            supabaseAdmin.from('clinics').select('clinic_id', { count: 'exact', head: true }),
            supabaseAdmin.from('appointments').select('*'),
            supabaseAdmin.from('prescriptions').select('prescription_id', { count: 'exact', head: true }),
            supabaseAdmin.from('medicines').select('*'),
            supabaseAdmin.from('orders').select('*'),
            supabaseAdmin.from('finance_transactions').select('*'),
            supabaseAdmin.from('delivery_agents').select('*')
        ]);

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
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        // Calculate active agents
        const active = agentsResult.data?.filter(a => a.is_active).length || 0;

        const stats = {
            totalUsers: usersResult.count || 0,
            totalDoctors: doctorsResult.count || 0,
            totalPatients: patientsResult.count || 0,
            totalClinics: clinicsResult.count || 0,
            totalAppointments: appointmentsResult.data?.length || 0,
            todayAppointments: todayAppts,
            totalPrescriptions: prescriptionsResult.count || 0,
            totalMedicines: medicinesResult.data?.length || 0,
            lowStockMedicines: lowStock,
            totalOrders: ordersResult.data?.length || 0,
            pendingOrders: pending,
            totalRevenue: revenue,
            totalDeliveryAgents: agentsResult.data?.length || 0,
            activeAgents: active
        };

        console.log('Dashboard stats:', stats);
        return NextResponse.json({ success: true, data: stats });
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
