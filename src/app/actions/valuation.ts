'use server';

import { createClient } from '@/lib/supabase/server';
import { generateValuation } from '@/lib/ai/valuation';
import { type ValuationParams } from '@/types/valuation';

export async function runValuationAction(listingId: string | null, params: ValuationParams, currentPrice?: number) {
    const supabase = createClient();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const marketQueryType = (params.type || 'apartment').toLowerCase();

    console.log('[Valuation Action] Step 1: Exact Match Search:', { city: params.city, district: params.district, type: marketQueryType, rooms: params.rooms });

    // 2. Fetch Market Data for this region (Multi-stage Relaxed Search)

    // Stage 1: Exact Match
    let { data: marketData } = await supabase
        .from('market_analysis')
        .select('*')
        .ilike('city', params.city)
        .ilike('district', params.district)
        .eq('listing_type', marketQueryType)
        .eq('rooms', params.rooms)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single(); // Might return null error if not found, but we check data

    // Stage 2: Relaxed Location Search (if Exact fails)
    // Check if district matches either input (user might swap city/district)
    if (!marketData) {
        console.log('[Valuation Action] Step 2: Relaxed Location Search');

        // Supabase .or() with ilike is a bit tricky in server actions, let's use a simpler approach:
        // Search by district ONLY (assuming district is unique enough or user entered it correctly in one of the fields)
        const { data: relaxedData } = await supabase
            .from('market_analysis')
            .select('*')
            .or(`district.ilike.%${params.district}%,district.ilike.%${params.city}%`)
            .eq('listing_type', marketQueryType)
            .eq('rooms', params.rooms)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (relaxedData && relaxedData.length > 0) {
            marketData = relaxedData[0];
            console.log('[Valuation Action] Found via Relaxed Search:', marketData);
        }
    }

    // Stage 3: Fallback (No Rooms Filter) - Broadest search
    let finalMarketData = marketData;
    if (!finalMarketData) {
        console.log('[Valuation Action] Step 3: Fallback (No Rooms Filter)');
        const { data: fallback } = await supabase
            .from('market_analysis')
            .select('*')
            .or(`district.ilike.%${params.district}%,district.ilike.%${params.city}%`)
            .eq('listing_type', marketQueryType)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (fallback && fallback.length > 0) {
            finalMarketData = fallback[0];
            console.log('[Valuation Action] Fallback Data Used:', finalMarketData);
        }
    }

    console.log('Final Market Data for AI:', finalMarketData ? 'Yes' : 'No');

    // 3. Run AI Valuation
    const valuationResult = await generateValuation(params, finalMarketData, currentPrice);

    // 4. Save Report
    const { data: agent } = await supabase.from('agents').select('id').eq('auth_user_id', user.id).single();

    if (agent && valuationResult) {
        try {
            await supabase.from('price_analysis_reports').insert({
                agent_id: agent.id,
                listing_id: listingId,
                analysis_params: params,
                estimated_price: valuationResult.estimated_market_price,
                price_range_min: valuationResult.price_range?.min,
                price_range_max: valuationResult.price_range?.max,
                price_score: valuationResult.price_score,
                price_per_sqm: valuationResult.price_per_sqm,
                market_comparison: valuationResult.market_comparison,
                recommendations: valuationResult.recommendations, // Object
                rental_yield: valuationResult.rental_yield,
                valuation_notes: valuationResult.valuation_notes || null // Ensure no undefined
            });
        } catch (dbError) {
            console.error('Failed to save report to DB:', dbError);
            // Non-blocking error
        }
    }

    return valuationResult;
}
