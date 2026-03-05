import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        console.log('Fetching doctor with ID:', id);

        const [doctorData] = await sql`SELECT * FROM doctors WHERE did = ${id}`;

        if (!doctorData) {
            return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
        }

        if (doctorData.uid) {
            const [userData] = await sql`SELECT uid, name, email, phone, profile_image_url FROM users WHERE uid = ${doctorData.uid}`;

            return NextResponse.json({
                success: true,
                data: {
                    ...doctorData,
                    user: userData,
                    experience_years: doctorData.years_of_experience,
                    specialization: Array.isArray(doctorData.specialization) ? doctorData.specialization[0] : doctorData.specialization
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

        const doctorUpdates: any = {};
        const userUpdates: any = {};

        if (body.specialization !== undefined) doctorUpdates.specialization = Array.isArray(body.specialization) ? body.specialization : [body.specialization];
        if (body.experience_years !== undefined) doctorUpdates.years_of_experience = body.experience_years;
        if (body.qualification !== undefined) doctorUpdates.qualification = body.qualification;
        if (body.registration_number !== undefined) doctorUpdates.registration_number = body.registration_number;
        if (body.consultation_fee !== undefined) doctorUpdates.consultation_fee = body.consultation_fee;
        if (body.bio !== undefined) doctorUpdates.bio = body.bio;

        if (body.name !== undefined) userUpdates.name = body.name;
        if (body.email !== undefined) userUpdates.email = body.email;
        if (body.phone !== undefined) userUpdates.phone = body.phone;

        const [currentDoctor] = await sql`SELECT uid FROM doctors WHERE did = ${id}`;

        if (!currentDoctor) {
            throw new Error('Doctor not found');
        }

        if (Object.keys(userUpdates).length > 0) {
            await sql`UPDATE users SET ${sql(userUpdates)} WHERE uid = ${currentDoctor.uid}`;
        }

        if (Object.keys(doctorUpdates).length > 0) {
            await sql`UPDATE doctors SET ${sql(doctorUpdates)} WHERE did = ${id}`;
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

        await sql`DELETE FROM doctors WHERE did = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in doctor delete API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
