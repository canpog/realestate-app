'use server';

import { createClient } from '@/lib/supabase/server';
import { generateValuation } from '@/lib/ai/valuation';
import { type ValuationParams } from '@/types/valuation';

export async function runValuationAction(listingId: string | null, params: ValuationParams, currentPrice?: number) {
    const supabase = createClient();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    console.log('Fetching market data for:', params.city, params.district, params.type, params.rooms);

    // 2. Fetch Market Data for this region
    let marketData = null;

    // Try precise match
    const { data: exactMatch } = await supabase
        .from('market_analysis')
        .select('*')
        .eq('city', params.city)
        .eq('district', params.district)
        .eq('listing_type', params.type)
        .eq('rooms', params.rooms)
        .single();

    if (exactMatch) {
        marketData = exactMatch;
    } else {
        // Fallback: Try average of the district for the listing type (ignoring rooms)
        const { data: fallback } = await supabase
            .from('market_analysis')
            .select('*')
            .eq('city', params.city)
            .eq('district', params.district)
            .eq('listing_type', params.type)
            .limit(1); // Take first one found as a baseline or ideally aggregate

        if (fallback && fallback.length > 0) {
            marketData = fallback[0];
        }
    }

    console.log('Market Data Found:', marketData ? 'Yes' : 'No');

    // 3. Run AI Valuation
    // If no market data, the AI will rely on its own knowledge but we warn
    const valuationResult = await generateValuation(params, marketData, currentPrice);

    // 4. Save Report
    const { data: agent } = await supabase.from('agents').select('id').eq('auth_user_id', user.id).single();

    if (agent && valuationResult) {
        try {
            await supabase.from('price_analysis_reports').insert({
                agent_id: agent.id,
                listing_id: listingId, // Can be null now
                analysis_params: params,
                estimated_price: valuationResult.estimated_market_price,
                price_range_min: valuationResult.price_range.min,
                price_range_max: valuationResult.price_range.max,
                price_score: valuationResult.price_score,
                market_comparison: valuationResult.market_comparison,
                recommendations: valuationResult.recommendations,
                rental_yield: valuationResult.rental_yield
            });
        } catch (dbError) {
            console.error('Failed to save report to DB:', dbError);
            // Verify if listing_id is null and allowed
        }
    }

    return valuationResult;
}
