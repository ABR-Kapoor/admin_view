import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars. Make sure to run with dotenv or check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function convertUser(email: string) {
    console.log(`Finding user with email: ${email}`);

    // 1. Get User
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('uid, role')
        .eq('email', email);

    if (userError || !users || users.length === 0) {
        console.error('User not found or error:', userError);
        return;
    }

    const user = users[0];
    console.log(`Found user: ${user.uid} with role: ${user.role}`);

    if (user.role === 'doctor') {
        console.log('User is already a doctor.');
        // Still check doctor profile exists?
    }

    // 2. Delete from Patients (if exists)
    console.log('Removing from patients table...');
    const { error: delError } = await supabase
        .from('patients')
        .delete()
        .eq('uid', user.uid);

    if (delError) {
        console.log('Note on deleting patient:', delError.message);
    } else {
        console.log('Removed from patients (if existed).');
    }

    // 3. Update User Role
    console.log('Updating user role to doctor...');
    const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'doctor' })
        .eq('uid', user.uid);

    if (updateError) {
        console.error('Error updating role:', updateError);
        return;
    }
    console.log('Role updated.');

    // 4. Create Doctor Profile
    console.log('Creating doctor profile...');
    // We insert minimal required fields. constraints might exist.
    const { error: createError } = await supabase
        .from('doctors')
        .insert({
            uid: user.uid,
            is_verified: true,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        })
        .select();

    if (createError) {
        if (createError.code === '23505') { // Unique violation
            console.log('Doctor profile already exists (skipping creation).');
        } else {
            console.error('Error creating doctor profile:', createError);
        }
    } else {
        console.log('Doctor profile created successfully.');
    }

    console.log('SUCCESS: User converted to doctor.');
}

const email = process.argv[2];
if (!email) {
    console.error('Please provide email as argument');
    process.exit(1);
}

convertUser(email);
