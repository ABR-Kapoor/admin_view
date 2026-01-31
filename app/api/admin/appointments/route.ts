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
        // Fetch appointments
        const { data: appointmentsData, error: appointmentsError } = await supabaseAdmin
            .from('appointments')
            .select('*')
            .order('scheduled_date', { ascending: false })
            .order('scheduled_time', { ascending: false });

        if (appointmentsError) {
            console.error('Error fetching appointments:', appointmentsError);
            return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
        }

        // If we have appointments, fetch related data
        if (appointmentsData && appointmentsData.length > 0) {
            const patientIds = [...new Set(appointmentsData.map(a => a.pid))];
            const doctorIds = [...new Set(appointmentsData.map(a => a.did))];

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
                .select('uid, name, email, profile_image_url')
                .in('uid', userIds);

            // Create lookup maps
            const usersMap = new Map(usersData?.map(u => [u.uid, u]) || []);
            const patientsMap = new Map(patientsData?.map(p => [p.pid, { ...p, user: usersMap.get(p.uid) }]) || []);
            const doctorsMap = new Map(doctorsData?.map(d => [d.did, { ...d, user: usersMap.get(d.uid) }]) || []);

            // Combine data
            const enrichedAppointments = appointmentsData.map(apt => ({
                ...apt,
                patient: patientsMap.get(apt.pid),
                doctor: doctorsMap.get(apt.did)
            }));

            return NextResponse.json({ success: true, data: enrichedAppointments });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error: any) {
        console.error('Error in appointments API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
