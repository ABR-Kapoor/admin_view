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
        console.log('Fetching doctor with ID:', id);

        // Fetch doctor
        const { data: doctorData, error: doctorError } = await supabaseAdmin
            .from('doctors')
            .select('*')
            .eq('did', id)
            .single();

        if (doctorError) {
            console.error('Error fetching doctor:', doctorError);
            return NextResponse.json({ error: doctorError.message }, { status: 500 });
        }

        if (!doctorData) {
            return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
        }

        // Fetch user data
        if (doctorData.uid) {
            const { data: userData } = await supabaseAdmin
                .from('users')
                .select('uid, name, email, phone, profile_image_url')
                .eq('uid', doctorData.uid)
                .single();

            return NextResponse.json({
                success: true,
                data: {
                    ...doctorData,
                    user: userData,
                    // Map snake_case to what the frontend expects
                    experience_years: doctorData.years_of_experience,
                    specialization: Array.isArray(doctorData.specialization)
                        ? doctorData.specialization[0]
                        : doctorData.specialization // Handle array to string if needed by frontend
                }
            });
        }

        return NextResponse.json({ success: true, data: doctorData });
    } catch (error: any) {
        console.error('Error in doctor API:', error);
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

        // Separate doctor and user updates
        const doctorUpdates: any = {};
        const userUpdates: any = {};

        // Fields mapping based on frontend component
        // Fields mapping based on frontend component
        if (body.specialization !== undefined) {
            // Ensure specialization is an array
            doctorUpdates.specialization = Array.isArray(body.specialization)
                ? body.specialization
                : [body.specialization];
        }
        if (body.experience_years !== undefined) doctorUpdates.years_of_experience = body.experience_years;
        if (body.qualification !== undefined) doctorUpdates.qualification = body.qualification;
        if (body.registration_number !== undefined) doctorUpdates.registration_number = body.registration_number;
        if (body.consultation_fee !== undefined) doctorUpdates.consultation_fee = body.consultation_fee;
        if (body.bio !== undefined) doctorUpdates.bio = body.bio;

        // Check doctor table schema compatibility.
        // In types.ts: years_of_experience, license_number (vs registration_number)
        // In edit page: formData uses registration_number and experience_years.
        // I should check types.ts again to be sure about column names.

        if (body.name !== undefined) userUpdates.name = body.name;
        if (body.email !== undefined) userUpdates.email = body.email;
        if (body.phone !== undefined) userUpdates.phone = body.phone;

        // We need the UID to update the user
        // First fetch the doctor to get the UID
        const { data: currentDoctor, error: fetchError } = await supabaseAdmin
            .from('doctors')
            .select('uid')
            .eq('did', id)
            .single();

        if (fetchError || !currentDoctor) {
            throw new Error('Doctor not found');
        }

        // Update User
        if (Object.keys(userUpdates).length > 0) {
            const { error: userUpdateError } = await supabaseAdmin
                .from('users')
                .update(userUpdates)
                .eq('uid', currentDoctor.uid);

            if (userUpdateError) throw userUpdateError;
        }

        // Update Doctor
        if (Object.keys(doctorUpdates).length > 0) {
            const { error: doctorUpdateError } = await supabaseAdmin
                .from('doctors')
                .update(doctorUpdates)
                .eq('did', id);

            if (doctorUpdateError) throw doctorUpdateError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in doctor update API:', error);
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
            .from('doctors')
            .delete()
            .eq('did', id);

        if (error) {
            console.error('Error deleting doctor:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in doctor delete API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
