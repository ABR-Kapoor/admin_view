import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin access (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Allow updating is_active
        const { is_active } = body;

        if (is_active === undefined) {
            return NextResponse.json({ error: 'Missing is_active field' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('delivery_agents')
            .update({ is_active })
            .eq('id', id);

        if (error) {
            console.error('Error updating delivery agent:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

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

        const { error } = await supabaseAdmin
            .from('delivery_agents')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting delivery agent:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in delivery agent delete API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
