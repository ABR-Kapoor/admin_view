import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const doctors = await sql.unsafe(`
            SELECT 
                d.*,
                (SELECT row_to_json(u.*) FROM users u WHERE u.uid = d.uid) as user
            FROM doctors d
            ORDER BY d.created_at DESC
        `);

        return NextResponse.json({ success: true, data: doctors || [] });
    } catch (error: any) {
        console.error('Error in doctors API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
