import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface MarketStats {
    rooms: string;
    age_range: string;
    average_price: number;
    min_price: number;
    max_price: number;
    median_price: number;
    price_per_sqm: number;
    sample_size: number;
}

// Marmaris villa base prices (realistic market data)
const BASE_PRICES: { [key: string]: { base: number; sqm: number } } = {
    '2+1': { base: 4500000, sqm: 120 },
    '3+1': { base: 7500000, sqm: 180 },
    '4+1': { base: 12000000, sqm: 250 },
    '5+1': { base: 18000000, sqm: 350 },
};

// Generate realistic market data with some variation
function generateMarketData(rooms: string): MarketStats {
    const config = BASE_PRICES[rooms] || BASE_PRICES['3+1'];

    // Add realistic variation (±15%)
    const variation = 0.15;
    const avgPrice = config.base * (1 + (Math.random() - 0.5) * variation);
    const minPrice = avgPrice * 0.75;
    const maxPrice = avgPrice * 1.35;
    const medianPrice = avgPrice * (0.95 + Math.random() * 0.1);
    const pricePerSqm = avgPrice / config.sqm;
    const sampleSize = Math.floor(15 + Math.random() * 25); // 15-40 samples

    return {
        rooms,
        age_range: 'all',
        average_price: Math.round(avgPrice),
        min_price: Math.round(minPrice),
        max_price: Math.round(maxPrice),
        median_price: Math.round(medianPrice),
        price_per_sqm: Math.round(pricePerSqm),
        sample_size: sampleSize,
    };
}

// Cron handler
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    // Create Supabase client
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseKey) {
        return NextResponse.json({ error: 'Supabase key not configured' }, { status: 500 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey
    );

    try {
        // Cron secret kontrolü
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            // Allow in development mode
            if (process.env.NODE_ENV !== 'development') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        console.log('[Cron] Market data generation started...');

        // Marmaris villalar
        const targets = [
            { city: 'muğla', district: 'marmaris', type: 'villa', rooms: ['2+1', '3+1', '4+1', '5+1'] },
        ];

        const results = [];

        for (const target of targets) {
            for (const rooms of target.rooms) {
                const roomStartTime = Date.now();

                try {
                    // Generate market data
                    const stats = generateMarketData(rooms);

                    // History'ye kaydet (backup)
                    await supabase.from('market_analysis_history').insert({
                        city: target.city,
                        district: target.district,
                        listing_type: target.type,
                        rooms: stats.rooms,
                        age_range: stats.age_range,
                        average_price: stats.average_price,
                        min_price: stats.min_price,
                        max_price: stats.max_price,
                        median_price: stats.median_price,
                        price_per_sqm: stats.price_per_sqm,
                        sample_size: stats.sample_size,
                        snapshot_date: new Date().toISOString(),
                        data_source: 'simulated',
                    });

                    // Market_analysis güncelle (upsert)
                    const { error } = await supabase
                        .from('market_analysis')
                        .upsert({
                            city: target.city,
                            district: target.district,
                            listing_type: target.type,
                            rooms: stats.rooms,
                            age_range: stats.age_range,
                            average_price: stats.average_price,
                            min_price: stats.min_price,
                            max_price: stats.max_price,
                            median_price: stats.median_price,
                            price_per_sqm: stats.price_per_sqm,
                            sample_size: stats.sample_size,
                            last_scraped: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            data_source: 'simulated',
                        }, {
                            onConflict: 'city,district,listing_type,rooms,age_range',
                        });

                    if (error) {
                        console.error('[Cron] Upsert error:', error);
                    }

                    // Log başarı
                    await supabase.from('scraping_logs').insert({
                        city: target.city,
                        district: target.district,
                        listing_type: target.type,
                        rooms: rooms,
                        status: 'success',
                        properties_found: stats.sample_size,
                        average_price: stats.average_price,
                        execution_time_ms: Date.now() - roomStartTime,
                    });

                    results.push({
                        target: `${target.district}/${rooms}`,
                        found: stats.sample_size,
                        avgPrice: stats.average_price,
                    });

                    console.log(`[Cron] ✓ ${target.district}/${rooms}: avg ${stats.average_price.toLocaleString('tr-TR')} ₺`);

                } catch (error) {
                    console.error(`[Cron] Error for ${target.district}/${rooms}:`, error);

                    await supabase.from('scraping_logs').insert({
                        city: target.city,
                        district: target.district,
                        listing_type: target.type,
                        rooms: rooms,
                        status: 'failed',
                        error_message: error instanceof Error ? error.message : 'Unknown error',
                        execution_time_ms: Date.now() - roomStartTime,
                    });
                }
            }
        }

        const totalTime = Date.now() - startTime;
        console.log(`[Cron] ✅ Market data generation completed in ${totalTime}ms`);

        return NextResponse.json({
            success: true,
            results,
            execution_time_ms: totalTime,
            timestamp: new Date().toISOString(),
            note: 'Using simulated market data. Real scraping can be added later.',
        });
    } catch (error) {
        console.error('[Cron] Fatal error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
