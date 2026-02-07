
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually load env
const envPath = path.resolve(process.cwd(), '.env.local');
let env: any = {};
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/"/g, '');
            env[key] = val;
        }
    });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
// Use SERVICE ROLE KEY to bypass RLS for debugging
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Env Vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugValuation() {
    console.log('--- Debugging Valuation Query ---');
    console.log('URL:', supabaseUrl);
    console.log('Key used:', supabaseKey.substring(0, 10) + '...');
    console.log('Target: Marmaris / Villa / 3+1');

    const pCity = 'Muğla'; // Try 'mugla' if this fails
    const pDistrict = 'Marmaris';
    const marketQueryType = 'villa';
    const params = { rooms: '3+1' };

    console.log(`Checking exact match for: city='${pCity}', district='${pDistrict}', type='${marketQueryType}'`);

    const { data, error } = await supabase
        .from('market_analysis')
        .select('*')
        .ilike('city', pCity)
        .ilike('district', pDistrict)
        .eq('listing_type', marketQueryType)
        .eq('rooms', params.rooms);

    if (error) {
        console.error('Query Error:', error);
    } else {
        console.log('Found records:', data?.length);
        if (data && data.length > 0) {
            console.log('Record:', data[0]);
        } else {
            console.log('No exact match found. Trying simple district search...');

            // Try only district
            const { data: distData } = await supabase
                .from('market_analysis')
                .select('*')
                .ilike('district', pDistrict)
                .eq('listing_type', marketQueryType)
                .eq('rooms', params.rooms);

            console.log('District search results:', distData?.length);
            if (distData && distData.length > 0) console.log('District Record:', distData[0]);
        }
    }
}

debugValuation();
