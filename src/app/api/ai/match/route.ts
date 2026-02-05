import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAIMatching } from '@/lib/ai/matching';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { clientId } = body;

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        const supabase = createClient();

        // 1. Get Client Data
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // 2. Get Client Notes
        const { data: notes } = await supabase
            .from('client_notes')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(10); // Analyze last 10 notes

        // 3. Get All Potential Listings (Active only)
        // Optimization: Filter by basic criteria first (e.g. status)
        let query = supabase
            .from('listings')
            .select('*')
            .eq('status', 'available');

        // Optional: Pre-filter by purpose matching to save tokens
        if (client.wanted_purpose) {
            query = query.eq('purpose', client.wanted_purpose);
        }

        const { data: listings } = await query;

        if (!listings || listings.length === 0) {
            return NextResponse.json({
                matches: [],
                summary: 'Aktif portföy bulunamadı.'
            });
        }

        // 4. Run AI Matching
        try {
            const results = await runAIMatching(client, notes || [], listings);
            return NextResponse.json(results);
        } catch (error: any) {
            if (error.message.includes('API key')) {
                return NextResponse.json({ error: 'AI servisi yapılandırılmamış (API Key eksik)' }, { status: 503 });
            }
            throw error;
        }

    } catch (error: any) {
        console.error('Matching API Error:', error);
        return NextResponse.json({ error: 'Eşleştirme işlemi başarısız oldu: ' + error.message }, { status: 500 });
    }
}
