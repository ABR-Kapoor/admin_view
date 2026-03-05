import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { is_active } = body;

        if (is_active === undefined) {
            return NextResponse.json({ error: 'Missing is_active field' }, { status: 400 });
        }

        await sql`UPDATE delivery_agents SET is_active = ${is_active} WHERE id = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in delivery agent update API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await sql`DELETE FROM delivery_agents WHERE id = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in delivery agent delete API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
