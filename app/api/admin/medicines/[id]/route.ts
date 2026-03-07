import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const [medicine] = await sql`
            SELECT * FROM medicines WHERE id = ${id}
        `;

        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: medicine });
    } catch (error: any) {
        console.error('Error fetching medicine:', error);
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

        // Clean undefined values
        const cleanedData = Object.fromEntries(
            Object.entries(body).map(([k, v]) => [k, v === undefined ? null : v])
        );

        const [medicine] = await sql`
            UPDATE medicines 
            SET ${sql(cleanedData)}
            WHERE id = ${id}
            RETURNING *
        `;

        return NextResponse.json({ success: true, data: medicine });
    } catch (error: any) {
        console.error('Error updating medicine:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await sql`DELETE FROM medicines WHERE id = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting medicine:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
