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
        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabaseAdmin
            .from('finance_transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (transactionsError) {
            console.error('Error fetching transactions:', transactionsError);
            return NextResponse.json({ error: transactionsError.message }, { status: 500 });
        }

        if (transactionsData && transactionsData.length > 0) {
            // Collect IDs
            const patientIds = [...new Set(transactionsData.map(t => t.pid).filter(Boolean))];
            const doctorIds = [...new Set(transactionsData.map(t => t.did).filter(Boolean))];

            // Fetch patients
            const { data: patientsData } = await supabaseAdmin
                .from('patients')
                .select('pid, uid')
                .in('pid', patientIds);

            // Fetch doctors
            const { data: doctorsData } = await supabaseAdmin
                .from('doctors')
                .select('did, uid')
                .in('did', doctorIds);

            // Collect user IDs from patients and doctors
            const patientUserIds = patientsData?.map(p => p.uid).filter(Boolean) || [];
            const doctorUserIds = doctorsData?.map(d => d.uid).filter(Boolean) || [];
            const allUserIds = [...new Set([...patientUserIds, ...doctorUserIds])];

            // Fetch users
            const { data: usersData } = await supabaseAdmin
                .from('users')
                .select('uid, name, email, profile_image_url')
                .in('uid', allUserIds);

            // Create lookup maps
            const usersMap = new Map(usersData?.map(u => [u.uid, u]) || []);
            const patientsMap = new Map();
            patientsData?.forEach(p => {
                patientsMap.set(p.pid, {
                    ...p,
                    user: usersMap.get(p.uid)
                });
            });
            const doctorsMap = new Map();
            doctorsData?.forEach(d => {
                doctorsMap.set(d.did, {
                    ...d,
                    user: usersMap.get(d.uid)
                });
            });

            // Enrich transactions
            const enrichedTransactions = transactionsData.map(txn => ({
                ...txn,
                patient: txn.pid ? patientsMap.get(txn.pid) : null,
                doctor: txn.did ? doctorsMap.get(txn.did) : null
            }));

            return NextResponse.json({ success: true, data: enrichedTransactions });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error: any) {
        console.error('Error in transactions API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
