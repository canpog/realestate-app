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

    // Normalize inputs for logging
    const pCity = params.city.trim();
    const pDistrict = params.district.trim();

    console.log(`[Valuation Action] Searching for: City='${pCity}', District='${pDistrict}', Type='${marketQueryType}', Rooms='${params.rooms}'`);

    let marketData = null;

    // Strategy 1: Exact Match
    // Tries to find record where city=pCity AND district=pDistrict
    const { data: exactMatch } = await supabase
        .from('market_analysis')
        .select('*')
        .ilike('city', pCity)
        .ilike('district', pDistrict)
        .eq('listing_type', marketQueryType)
        .eq('rooms', params.rooms)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (exactMatch) {
        marketData = exactMatch;
        console.log('[Valuation Action] Found via Exact Match');
    }

    // Strategy 2: Search by District Input (Ignore City)
    // Maybe user typed correct district but wrong city, or we only care about district match
    if (!marketData) {
        const { data: districtMatch } = await supabase
            .from('market_analysis')
            .select('*')
            .ilike('district', pDistrict)
            .eq('listing_type', marketQueryType)
            .eq('rooms', params.rooms)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (districtMatch && districtMatch.length > 0) {
            marketData = districtMatch[0];
            console.log('[Valuation Action] Found via District Input Match');
        }
    }

    // Strategy 3: Search by City Input as District
    // User might have typed "Marmaris" in the City field
    if (!marketData) {
        const { data: swappedMatch } = await supabase
            .from('market_analysis')
            .select('*')
            .ilike('district', pCity)
            .eq('listing_type', marketQueryType)
            .eq('rooms', params.rooms)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (swappedMatch && swappedMatch.length > 0) {
            marketData = swappedMatch[0];
            console.log('[Valuation Action] Found via City Input as District');
        }
    }

    // Strategy 4: Fallback (No Rooms Filter) - Search by District Input
    let finalMarketData = marketData;
    if (!finalMarketData) {
        console.log('[Valuation Action] Fallback: Trying broad search (no rooms)...');
        const { data: fallback } = await supabase
            .from('market_analysis')
            .select('*')
            .ilike('district', pDistrict)
            .eq('listing_type', marketQueryType)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (fallback && fallback.length > 0) {
            finalMarketData = fallback[0];
            console.log('[Valuation Action] Fallback Data Found');
        } else {
            // Strategy 5: Fallback - Search by City Input as District
            const { data: fallbackSwapped } = await supabase
                .from('market_analysis')
                .select('*')
                .ilike('district', pCity)
                .eq('listing_type', marketQueryType)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (fallbackSwapped && fallbackSwapped.length > 0) {
                finalMarketData = fallbackSwapped[0];
                console.log('[Valuation Action] Fallback Swapped Data Found');
            }
        }
    }

    console.log('Final Market Data sent to AI:', finalMarketData ? 'YES (Data Found)' : 'NO (Empty)');

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
                recommendations: valuationResult.recommendations,
                rental_yield: valuationResult.rental_yield,
                valuation_notes: valuationResult.valuation_notes || null
            });
        } catch (dbError) {
            console.error('Failed to save report to DB:', dbError);
        }
    }

    return valuationResult;
}
