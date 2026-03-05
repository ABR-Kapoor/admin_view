import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [{ count: totalUsers }] = await sql`SELECT count(*) FROM users`;
        const [{ count: totalDoctors }] = await sql`SELECT count(*) FROM doctors`;
        const [{ count: totalPatients }] = await sql`SELECT count(*) FROM patients`;
        const [{ count: totalClinics }] = await sql`SELECT count(*) FROM clinics`;

        const appointments = await sql`SELECT scheduled_date, created_at FROM appointments`;
        const totalAppointments = appointments.length;

        const [{ count: totalPrescriptions }] = await sql`SELECT count(*) FROM prescriptions`;

        const medicines = await sql`SELECT id, stock_quantity FROM medicines`;
        const orders = await sql`SELECT created_at, status FROM orders`;
        const totalOrders = orders.length;

        const agents = await sql`SELECT is_active FROM delivery_agents`;

        const transactions = await sql`
            SELECT transaction_id, amount, status, created_at, paid_at, transaction_type, pid
            FROM finance_transactions
            ORDER BY created_at DESC
        `;

        const today = new Date().toISOString().split('T')[0];
        const todayAppts = appointments.filter(a => a.scheduled_date === today).length;

        const lowStock = medicines.filter(m => m.stock_quantity < 10).length;

        const pending = orders.filter(
            o => o.status === 'pending' || o.status === 'PENDING_DELIVERY'
        ).length;

        const revenue = transactions
            .filter(t => t.status === 'paid')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const active = agents.filter(a => a.is_active).length;

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

        // user growth logic
        const users = await sql`SELECT created_at FROM users`;

        const userGrowth = [];
        const appointmentGrowth = [];
        const orderGrowth = [];
        const transactionGrowth = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = d.toLocaleString('default', { month: 'short' });

            const userCount = users.filter((u: any) => {
                const uDate = new Date(u.created_at);
                return uDate.getMonth() === d.getMonth() && uDate.getFullYear() === d.getFullYear();
            }).length;
            userGrowth.push({ name: monthKey, users: userCount });

            const apptCount = appointments.filter((a: any) => {
                const aDate = new Date(a.created_at);
                return aDate.getMonth() === d.getMonth() && aDate.getFullYear() === d.getFullYear();
            }).length;
            appointmentGrowth.push({ name: monthKey, value: apptCount });

            const orderCount = orders.filter((o: any) => {
                const oDate = new Date(o.created_at);
                return oDate.getMonth() === d.getMonth() && oDate.getFullYear() === d.getFullYear();
            }).length;
            orderGrowth.push({ name: monthKey, value: orderCount });

            const transCount = transactions.filter((t: any) => {
                const tDate = new Date(t.created_at);
                return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
            }).length;
            const transRevenue = transactions.filter((t: any) => {
                const tDate = new Date(t.created_at);
                return t.status === 'paid' && tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
            }).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

            transactionGrowth.push({ name: monthKey, count: transCount, revenue: transRevenue });
        }

        const appointmentTrends = last7Days.map(day => ({
            name: day.name,
            value: appointments.filter((a: any) => a.scheduled_date === day.date).length
        }));

        const orderTrends = last7Days.map(day => ({
            name: day.name,
            value: orders.filter((o: any) => o.created_at.startsWith(day.date)).length
        }));

        const dailyRevenue = last7Days.map(day => {
            const dailyTotal = transactions
                .filter((t: any) => {
                    if (t.status !== 'paid') return false;
                    const dateStr = t.paid_at || t.created_at;
                    if (!dateStr) return false;
                    return dateStr.split('T')[0] === day.date;
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);
            return { name: day.name, value: dailyTotal };
        });

        const recentTransactionsRaw = await sql.unsafe(`
            SELECT 
                ft.transaction_id as id,
                ft.transaction_type as type,
                ft.status,
                ft.created_at as date,
                ft.amount,
                u.name,
                u.profile_image_url as avatar
            FROM finance_transactions ft
            LEFT JOIN patients p ON p.pid = ft.pid
            LEFT JOIN users u ON u.uid = p.uid
            ORDER BY ft.created_at DESC
            LIMIT 10
        `);

        const recentTransactions = recentTransactionsRaw.map(t => ({
            ...t,
            amount: Number(t.amount),
            date: new Date(t.date).toLocaleDateString(),
            name: t.name || 'Unknown User',
            avatar: t.avatar || `https://ui-avatars.com/api/?name=${t.name || 'User'}&background=random`
        }));

        const stats = {
            totalUsers: Number(totalUsers),
            totalDoctors: Number(totalDoctors),
            totalPatients: Number(totalPatients),
            totalClinics: Number(totalClinics),
            totalAppointments,
            todayAppointments: todayAppts,
            totalPrescriptions: Number(totalPrescriptions),
            totalMedicines: medicines.length,
            lowStockMedicines: lowStock,
            totalOrders,
            pendingOrders: pending,
            totalRevenue: revenue,
            totalDeliveryAgents: agents.length,
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
