import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const medicines = await sql`
            SELECT * FROM medicines ORDER BY name ASC
        `;
        return NextResponse.json({ success: true, data: medicines || [] });
    } catch (error: any) {
        console.error('Error fetching medicines:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Clean undefined values
        const cleanedData = Object.fromEntries(
            Object.entries(body).map(([k, v]) => [k, v === undefined ? null : v])
        );

        const [medicine] = await sql`
            INSERT INTO medicines ${sql(cleanedData)}
            RETURNING *
        `;

        return NextResponse.json({ success: true, data: medicine });
    } catch (error: any) {
        console.error('Error creating medicine:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
