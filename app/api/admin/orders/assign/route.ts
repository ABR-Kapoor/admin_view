import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, agentId } = body;

        if (!orderId || !agentId) {
            return NextResponse.json({ error: 'Order ID and Agent ID are required' }, { status: 400 });
        }

        const [order] = await sql`
            UPDATE orders SET 
                assigned_to_delivery_boy_id = ${agentId},
                status = 'ASSIGNED',
                assigned_at = ${new Date().toISOString()},
                updated_at = ${new Date().toISOString()}
            WHERE id = ${orderId}
            RETURNING *
        `;

        if (!order) {
            return NextResponse.json({ error: 'Failed to assign order' }, { status: 500 });
        }

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error('Internal server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
