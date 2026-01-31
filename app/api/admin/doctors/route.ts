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
        // Fetch doctors
        const { data: doctorsData, error: doctorsError } = await supabaseAdmin
            .from('doctors')
            .select('*')
            .order('created_at', { ascending: false });

        if (doctorsError) {
            console.error('Error fetching doctors:', doctorsError);
            return NextResponse.json({ error: doctorsError.message }, { status: 500 });
        }

        // If we have doctors, fetch related user data
        if (doctorsData && doctorsData.length > 0) {
            const userIds = doctorsData.map(d => d.uid).filter(Boolean);

            const { data: usersData } = await supabaseAdmin
                .from('users')
                .select('uid, name, email, phone, profile_image_url')
                .in('uid', userIds);

            // Create user lookup map
            const usersMap = new Map(usersData?.map(u => [u.uid, u]) || []);

            // Combine data
            const enrichedDoctors = doctorsData.map(doctor => ({
                ...doctor,
                user: usersMap.get(doctor.uid)
            }));

            return NextResponse.json({ success: true, data: enrichedDoctors });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error: any) {
        console.error('Error in doctors API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
