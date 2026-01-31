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
        // Fetch clinics
        const { data: clinicsData, error: clinicsError } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .order('clinic_name', { ascending: true });

        if (clinicsError) {
            console.error('Error fetching clinics:', clinicsError);
            return NextResponse.json({ error: clinicsError.message }, { status: 500 });
        }

        // If we have clinics, fetch related user data
        if (clinicsData && clinicsData.length > 0) {
            const userIds = clinicsData.map(c => c.uid).filter(Boolean);

            const { data: usersData } = await supabaseAdmin
                .from('users')
                .select('uid, name, email, phone, profile_image_url')
                .in('uid', userIds);

            // Create user lookup map
            const usersMap = new Map(usersData?.map(u => [u.uid, u]) || []);

            // Combine data
            const enrichedClinics = clinicsData.map(clinic => ({
                ...clinic,
                user: usersMap.get(clinic.uid)
            }));

            return NextResponse.json({ success: true, data: enrichedClinics });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error: any) {
        console.error('Error in clinics API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
