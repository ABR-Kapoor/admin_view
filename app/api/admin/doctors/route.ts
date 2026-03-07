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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, specialization, experience_years, qualification, registration_number, consultation_fee, bio } = body;

        // Start a transaction
        const result = await sql.begin(async (tx: any) => {
            // 1. Create user record
            const [user] = await tx`
                INSERT INTO users (name, email, phone, role)
                VALUES (${name || null}, ${email}, ${phone || null}, 'doctor')
                RETURNING uid
            `;

            // 2. Create doctor record
            const [doctor] = await tx`
                INSERT INTO doctors (
                    uid, 
                    specialization, 
                    experience_years, 
                    qualification, 
                    registration_number, 
                    consultation_fee, 
                    bio
                )
                VALUES (
                    ${user.uid}, 
                    ${specialization || null}, 
                    ${experience_years ? parseInt(experience_years.toString()) : 0}, 
                    ${qualification || null}, 
                    ${registration_number || null}, 
                    ${consultation_fee ? parseFloat(consultation_fee.toString()) : 0}, 
                    ${bio || null}
                )
                RETURNING *
            `;

            return doctor;
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error creating doctor:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
