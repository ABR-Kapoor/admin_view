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
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            return NextResponse.json({ error: ordersError.message }, { status: 500 });
        }

        // If we have orders, fetch related user data
        if (ordersData && ordersData.length > 0) {
            const userIds = ordersData.map(o => o.user_id).filter(Boolean);

            const { data: usersData } = await supabaseAdmin
                .from('users')
                .select('uid, name, email, profile_image_url')
                .in('uid', userIds);

            // Create user lookup map
            const usersMap = new Map(usersData?.map(u => [u.uid, u]) || []);

            // Combine data
            const enrichedOrders = ordersData.map(order => ({
                ...order,
                user: usersMap.get(order.user_id)
            }));

            return NextResponse.json({ success: true, data: enrichedOrders });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error: any) {
        console.error('Error in orders API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
