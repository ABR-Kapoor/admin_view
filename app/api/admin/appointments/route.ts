import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const appointments = await sql.unsafe(`
            SELECT 
                a.*,
                (
                    SELECT json_build_object(
                        'pid', pt.pid,
                        'user', (SELECT row_to_json(u.*) FROM users u WHERE u.uid = pt.uid)
                    )
                    FROM patients pt WHERE pt.pid = a.pid
                ) as patient,
                (
                    SELECT json_build_object(
                        'did', d.did,
                        'user', (SELECT row_to_json(u.*) FROM users u WHERE u.uid = d.uid)
                    )
                    FROM doctors d WHERE d.did = a.did
                ) as doctor
            FROM appointments a
            ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
        `);

        return NextResponse.json({ success: true, data: appointments || [] });
    } catch (error: any) {
        console.error('Error in appointments API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
