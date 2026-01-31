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
        // Fetch patients
        const { data: patientsData, error: patientsError } = await supabaseAdmin
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });

        if (patientsError) {
            console.error('Error fetching patients:', patientsError);
            return NextResponse.json({ error: patientsError.message }, { status: 500 });
        }

        // If we have patients, fetch related user data
        if (patientsData && patientsData.length > 0) {
            const userIds = patientsData.map(p => p.uid).filter(Boolean);

            const { data: usersData } = await supabaseAdmin
                .from('users')
                .select('uid, name, email, phone, profile_image_url')
                .in('uid', userIds);

            // Create user lookup map
            const usersMap = new Map(usersData?.map(u => [u.uid, u]) || []);

            // Combine data
            const enrichedPatients = patientsData.map(patient => ({
                ...patient,
                user: usersMap.get(patient.uid)
            }));

            return NextResponse.json({ success: true, data: enrichedPatients });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error: any) {
        console.error('Error in patients API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
