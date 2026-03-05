import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let queryParams: any[] = [];
        let whereClause = '';

        if (status) {
            whereClause = 'WHERE o.status = $1';
            queryParams.push(status);
        }

        const orders = await sql.unsafe(`
            SELECT 
                o.*,
                (SELECT row_to_json(u.*) FROM users u WHERE u.uid = o.user_id) as user,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', oi.id,
                                'quantity', oi.quantity,
                                'price_at_purchase', oi.price_at_purchase,
                                'medicine', (
                                    SELECT row_to_json(m.*) FROM medicines m WHERE m.id = oi.medicine_id
                                )
                            )
                        )
                        FROM order_items oi WHERE oi.order_id = o.id
                    ),
                    '[]'::json
                ) as order_items
            FROM orders o
            ${whereClause}
            ORDER BY o.created_at DESC
        `, queryParams);

        if (!orders || orders.length === 0) {
            return NextResponse.json([]);
        }

        const transformedOrders = orders.map((order: any) => {
            const user = order.user || {};

            let shippingAddress = order.shipping_address;
            if (typeof shippingAddress === 'string') {
                try {
                    shippingAddress = JSON.parse(shippingAddress);
                } catch (e) {
                }
            }

            return {
                ...order,
                shipping_address: shippingAddress,
                customer_name: user.name || order.customer_name || 'Guest',
                customer_phone: user.phone || order.customer_phone || shippingAddress?.phone || 'N/A'
            };
        });

        return NextResponse.json(transformedOrders);

    } catch (error) {
        console.error('Internal server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
