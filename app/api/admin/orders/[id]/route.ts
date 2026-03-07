
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch order with user details
        const [orderData] = await sql`
            SELECT 
                o.*,
                (SELECT row_to_json(u.*) FROM users u WHERE u.uid = o.user_id) as user
            FROM orders o
            WHERE o.id = ${id}
        `;

        if (!orderData) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Fetch order items with medicine details
        const itemsData = await sql`
            SELECT 
                oi.*,
                (SELECT row_to_json(m.*) FROM medicines m WHERE m.mid = oi.medicine_id) as medicines
            FROM order_items oi
            WHERE oi.order_id = ${id}
        `;

        return NextResponse.json({
            success: true,
            data: {
                ...orderData,
                items: itemsData
            }
        });

    } catch (error: any) {
        console.error('Error fetching order details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status } = await request.json();

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const [data] = await sql`
            UPDATE orders 
            SET status = ${status} 
            WHERE id = ${id} 
            RETURNING *
        `;

        if (!data) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
