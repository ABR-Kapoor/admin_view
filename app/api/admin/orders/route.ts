import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const orders = await sql.unsafe(`
            SELECT 
                o.*,
                (SELECT row_to_json(u.*) FROM users u WHERE u.uid = o.user_id) as user,
                (SELECT row_to_json(da.*) FROM delivery_agents da WHERE da.id = o.assigned_to_delivery_boy_id) as delivery_agent
            FROM orders o
            ORDER BY o.created_at DESC
        `);

        return NextResponse.json({ success: true, data: orders || [] });
    } catch (error: any) {
        console.error('Error in orders API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
