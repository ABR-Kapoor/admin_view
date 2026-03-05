import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const patients = await sql.unsafe(`
            SELECT 
                p.*,
                (SELECT row_to_json(u.*) FROM users u WHERE u.uid = p.uid) as user
            FROM patients p
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json({ success: true, data: patients || [] });
    } catch (error: any) {
        console.error('Error in patients API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
