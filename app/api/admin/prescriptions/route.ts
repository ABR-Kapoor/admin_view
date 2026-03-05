import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const enrichedPrescriptions = await sql.unsafe(`
            SELECT 
                p.*,
                (
                    SELECT json_build_object(
                        'pid', pt.pid,
                        'user', (SELECT row_to_json(u.*) FROM users u WHERE u.uid = pt.uid)
                    )
                    FROM patients pt WHERE pt.pid = p.pid
                ) as patient,
                (
                    SELECT json_build_object(
                        'did', d.did,
                        'user', (SELECT row_to_json(u.*) FROM users u WHERE u.uid = d.uid)
                    )
                    FROM doctors d WHERE d.did = p.did
                ) as doctor
            FROM prescriptions p
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json({ success: true, data: enrichedPrescriptions || [] });
    } catch (error: any) {
        console.error('Error in prescriptions API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
