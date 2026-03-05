import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        console.log('Fetching clinic with ID:', id);

        const [clinicData] = await sql`SELECT * FROM clinics WHERE clinic_id = ${id}`;

        if (!clinicData) {
            return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
        }

        if (clinicData.uid) {
            const [userData] = await sql`SELECT uid, name, email, phone FROM users WHERE uid = ${clinicData.uid}`;

            return NextResponse.json({
                success: true,
                data: {
                    ...clinicData,
                    user: userData
                }
            });
        }

        return NextResponse.json({ success: true, data: clinicData });
    } catch (error: any) {
        console.error('Error in clinic API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const updates = await request.json();

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ success: true });
        }

        const [data] = await sql`UPDATE clinics SET ${sql(updates)} WHERE clinic_id = ${id} RETURNING *`;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error in clinic update API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await sql`DELETE FROM clinics WHERE clinic_id = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in clinic delete API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
