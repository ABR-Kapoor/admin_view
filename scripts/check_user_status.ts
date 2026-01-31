import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(email: string) {
    console.log(`Checking user: ${email}`);

    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

    if (error) {
        console.error('Error fetching user:', error);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No user found with this email.');
    } else {
        console.log('User found:', JSON.stringify(users, null, 2));
    }
}

const email = process.argv[2];
if (!email) {
    console.error('Please provide email');
    process.exit(1);
}

checkUser(email);
