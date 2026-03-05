import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const clinics = await sql.unsafe(`
            SELECT 
                c.*,
                (SELECT row_to_json(u.*) FROM users u WHERE u.uid = c.uid) as user
            FROM clinics c
            ORDER BY c.clinic_name ASC
        `);

        return NextResponse.json({ success: true, data: clinics || [] });
    } catch (error: any) {
        console.error('Error in clinics API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
