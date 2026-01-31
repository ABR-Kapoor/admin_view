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
        // Fetch delivery agents
        const { data: agentsData, error: agentsError } = await supabaseAdmin
            .from('delivery_agents')
            .select('*')
            .order('name', { ascending: true });

        if (agentsError) {
            console.error('Error fetching delivery agents:', agentsError);
            return NextResponse.json({ error: agentsError.message }, { status: 500 });
        }

        // Connect with users table via email to get profile images
        if (agentsData && agentsData.length > 0) {
            const emails = agentsData.map(a => a.email).filter(Boolean);

            const { data: usersData } = await supabaseAdmin
                .from('users')
                .select('email, profile_image_url')
                .in('email', emails);

            // Create user lookup map by email
            const usersMap = new Map(usersData?.map(u => [u.email, u]) || []);

            // Combine data
            const enrichedAgents = agentsData.map(agent => ({
                ...agent,
                profile_image_url: usersMap.get(agent.email)?.profile_image_url
            }));

            return NextResponse.json({ success: true, data: enrichedAgents });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error: any) {
        console.error('Error in delivery agents API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
