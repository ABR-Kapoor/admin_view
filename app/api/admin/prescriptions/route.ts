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
        // Fetch prescriptions
        const { data: prescriptionsData, error: prescriptionsError } = await supabaseAdmin
            .from('prescriptions')
            .select('*')
            .order('created_at', { ascending: false });

        if (prescriptionsError) {
            console.error('Error fetching prescriptions:', prescriptionsError);
            return NextResponse.json({ error: prescriptionsError.message }, { status: 500 });
        }

        // If we have prescriptions, fetch related data
        if (prescriptionsData && prescriptionsData.length > 0) {
            const patientIds = [...new Set(prescriptionsData.map(p => p.pid))];
            const doctorIds = [...new Set(prescriptionsData.map(p => p.did))];

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

            // Fetch users
            const userIds = [
                ...(patientsData?.map(p => p.uid) || []),
                ...(doctorsData?.map(d => d.uid) || [])
            ];

            const { data: usersData } = await supabaseAdmin
                .from('users')
                .select('uid, name, email')
                .in('uid', userIds);

            // Create lookup maps
            const usersMap = new Map(usersData?.map(u => [u.uid, u]) || []);
            const patientsMap = new Map(patientsData?.map(p => [p.pid, { ...p, user: usersMap.get(p.uid) }]) || []);
            const doctorsMap = new Map(doctorsData?.map(d => [d.did, { ...d, user: usersMap.get(d.uid) }]) || []);

            // Combine data
            const enrichedPrescriptions = prescriptionsData.map(prescription => ({
                ...prescription,
                patient: patientsMap.get(prescription.pid),
                doctor: doctorsMap.get(prescription.did)
            }));

            return NextResponse.json({ success: true, data: enrichedPrescriptions });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error: any) {
        console.error('Error in prescriptions API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
