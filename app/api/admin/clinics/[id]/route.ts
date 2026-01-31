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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        console.log('Fetching clinic with ID:', id);

        // Fetch clinic
        const { data: clinicData, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('*')
            .eq('clinic_id', id)
            .single();

        if (clinicError) {
            console.error('Error fetching clinic:', clinicError);
            return NextResponse.json({ error: clinicError.message }, { status: 500 });
        }

        if (!clinicData) {
            return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
        }

        // Fetch user data if uid exists
        if (clinicData.uid) {
            const { data: userData } = await supabaseAdmin
                .from('users')
                .select('uid, name, email, phone')
                .eq('uid', clinicData.uid)
                .single();

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

        const { data, error } = await supabaseAdmin
            .from('clinics')
            .update(updates)
            .eq('clinic_id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating clinic:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

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

        const { error } = await supabaseAdmin
            .from('clinics')
            .delete()
            .eq('clinic_id', id);

        if (error) {
            console.error('Error deleting clinic:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in clinic delete API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
