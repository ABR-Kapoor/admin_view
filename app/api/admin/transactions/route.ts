import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const transactions = await sql.unsafe(`
            SELECT 
                ft.*,
                (
                    SELECT json_build_object(
                        'pid', p.pid,
                        'user', (SELECT row_to_json(u.*) FROM users u WHERE u.uid = p.uid)
                    )
                    FROM patients p WHERE p.pid = ft.pid
                ) as patient,
                (
                    SELECT json_build_object(
                        'did', d.did,
                        'user', (SELECT row_to_json(u.*) FROM users u WHERE u.uid = d.uid)
                    )
                    FROM doctors d WHERE d.did = ft.did
                ) as doctor
            FROM finance_transactions ft
            ORDER BY ft.created_at DESC
        `);

        return NextResponse.json({ success: true, data: transactions || [] });
    } catch (error: any) {
        console.error('Error in transactions API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
