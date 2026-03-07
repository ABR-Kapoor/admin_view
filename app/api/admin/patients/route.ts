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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, date_of_birth, gender, blood_group, address, emergency_contact } = body;

        // Start a transaction
        const result = await sql.begin(async (tx: any) => {
            // 1. Create user record
            const [user] = await tx`
                INSERT INTO users (name, email, phone, role)
                VALUES (${name || null}, ${email}, ${phone || null}, 'patient')
                RETURNING uid
            `;

            // 2. Create patient record
            const [patient] = await tx`
                INSERT INTO patients (
                    uid, 
                    date_of_birth, 
                    gender, 
                    blood_group, 
                    address, 
                    emergency_contact
                )
                VALUES (
                    ${user.uid}, 
                    ${date_of_birth || null}, 
                    ${gender || null}, 
                    ${blood_group || null}, 
                    ${address || null}, 
                    ${emergency_contact || null}
                )
                RETURNING *
            `;

            return patient;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error creating patient:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
