import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const [patient] = await sql`
            SELECT 
                p.*,
                (SELECT row_to_json(u.*) FROM users u WHERE u.uid = p.uid) as user
            FROM patients p
            WHERE p.pid = ${id}
        `;

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: patient });
    } catch (error: any) {
        console.error('Error fetching patient:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { patient, user } = body;

        // Start a transaction
        await sql.begin(async (tx) => {
            const sqlTx = tx as any;
            if (patient) {
                await sqlTx`
                    UPDATE patients 
                    SET ${sqlTx(patient)}
                    WHERE pid = ${id}
                `;
            }

            if (user) {
                const [p] = await sqlTx`SELECT uid FROM patients WHERE pid = ${id}`;
                if (p && p.uid) {
                    await sqlTx`
                        UPDATE users 
                        SET ${sqlTx(user)}
                        WHERE uid = ${p.uid}
                    `;
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating patient:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Start a transaction to delete patient and possibly user
        await sql.begin(async (tx) => {
            const sqlTx = tx as any;
            const [p] = await sqlTx`SELECT uid FROM patients WHERE pid = ${id}`;

            // Delete patient record
            await sqlTx`DELETE FROM patients WHERE pid = ${id}`;

            // Note: We might want to keep the user record or delete it too
            // For now, only deleting patient record as requested by the UI flow
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting patient:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
