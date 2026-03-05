import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const agents = await sql`
            SELECT * FROM delivery_agents 
            WHERE is_active = true AND is_available = true 
            ORDER BY name ASC
        `;

        return NextResponse.json({ data: agents || [] });
    } catch (error) {
        console.error('Internal server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
