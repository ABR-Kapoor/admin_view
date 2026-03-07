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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, address, city, state, pincode, operating_hours } = body;

        // Start a transaction
        const result = await sql.begin(async (tx: any) => {
            // 1. Create user record
            const [user] = await tx`
                INSERT INTO users (name, email, phone, role)
                VALUES (${name || null}, ${email}, ${phone || null}, 'clinic')
                RETURNING uid
            `;

            // 2. Create clinic record
            const [clinic] = await tx`
                INSERT INTO clinics (
                    uid, 
                    clinic_name, 
                    email, 
                    phone, 
                    address_line1, 
                    city, 
                    state, 
                    postal_code,
                    is_verified
                )
                VALUES (
                    ${user.uid}, 
                    ${name}, 
                    ${email || null}, 
                    ${phone || null}, 
                    ${address || null}, 
                    ${city || null}, 
                    ${state || null}, 
                    ${pincode || null},
                    false
                )
                RETURNING *
            `;

            return clinic;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error creating clinic:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
