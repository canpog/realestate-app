import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel Pro

interface ScrapedProperty {
    title: string;
    price: number;
    sqm: number;
    rooms: string;
    age?: string;
}

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

// Sahibinden URL builder
function buildSahibindenUrl(
    city: string,
    district: string,
    listingType: string,
    rooms: string
): string {
    // Sahibinden villa satilik URL pattern
    // https://www.sahibinden.com/satilik-villa/mugla-marmaris?sorting=date_desc
    const citySlug = city.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
    const districtSlug = district.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

    // Rooms filter mapping for Sahibinden
    const roomsMap: { [key: string]: string } = {
        '2+1': 'a5', // 2+1
        '3+1': 'a6', // 3+1
        '4+1': 'a7', // 4+1
        '5+1': 'a8', // 5+1
    };

    const propertyType = listingType === 'villa' ? 'villa' : 'daire';
    let url = `https://www.sahibinden.com/satilik-${propertyType}/${citySlug}-${districtSlug}?sorting=date_desc`;

    if (roomsMap[rooms]) {
        url += `&a20=${roomsMap[rooms]}`;
    }

    return url;
}

// Puppeteer ile scrape
async function scrapeProperties(url: string): Promise<ScrapedProperty[]> {
    let browser;
    const properties: ScrapedProperty[] = [];

    try {
        // Launch browser with serverless-optimized Chromium
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 1920, height: 1080 },
            executablePath: await chromium.executablePath(),
            headless: true,
        });

        const page = await browser.newPage();

        // Set user agent to avoid detection
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Timeout: 60 seconds
        page.setDefaultNavigationTimeout(60000);

        console.log(`[Scraper] Fetching: ${url}`);

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });
        } catch (navigationError) {
            console.warn('[Scraper] Navigation timeout (continuing anyway):', navigationError);
        }

        // Wait for listings to load
        await page.waitForSelector('.searchResultsItem, .classifiedCard', { timeout: 10000 }).catch(() => {
            console.log('[Scraper] No results selector found, trying alternative...');
        });

        // Scrape property data
        const scrapedData = await page.evaluate(() => {
            const items: any[] = [];

            // Try multiple selectors for Sahibinden
            const listings = document.querySelectorAll('.searchResultsItem, .classifiedCard, [class*="listing"]');

            listings.forEach((listing, index) => {
                if (index > 50) return; // Max 50 listings

                try {
                    // Get title
                    const titleEl = listing.querySelector('.classifiedTitle, h3 a, [class*="title"]');
                    const title = titleEl?.textContent?.trim() || '';

                    // Get price
                    const priceEl = listing.querySelector('.searchResultsPriceValue, [class*="price"]');
                    const priceText = priceEl?.textContent?.trim() || '';

                    // Parse price (handle formats like "2.800.000 TL" or "2,800,000")
                    const cleanedPrice = priceText.replace(/[^\d]/g, '');
                    const price = parseInt(cleanedPrice) || 0;

                    // Get sqm from listing info
                    const infoEl = listing.querySelector('.searchResultsAttributeValue, [class*="attribute"]');
                    const infoText = infoEl?.textContent || title;
                    const sqmMatch = infoText.match(/(\d+)\s*m²/i) || title.match(/(\d+)\s*m²/i);

                    // Get rooms
                    const roomsMatch = title.match(/(\d\+\d)/) || infoText.match(/(\d\+\d)/);

                    if (price > 0 && price < 100000000000) { // Sanity check
                        items.push({
                            title,
                            price,
                            sqm: sqmMatch ? parseInt(sqmMatch[1]) : 150, // Default sqm
                            rooms: roomsMatch ? roomsMatch[1] : '3+1', // Default rooms
                        });
                    }
                } catch (e) {
                    // Skip this item
                }
            });

            return items;
        });

        properties.push(...scrapedData);
        console.log(`[Scraper] Found ${properties.length} properties`);

        await page.close();
    } catch (error) {
        console.error('[Scraper] Error:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    return properties;
}

// Verileri analiz et
function analyzeProperties(properties: ScrapedProperty[], targetRooms: string): MarketStats | null {
    // Filter by target rooms
    const filtered = properties.filter(p => p.rooms === targetRooms);

    if (filtered.length === 0) {
        // Use all properties if no exact match
        if (properties.length === 0) return null;
    }

    const propsToUse = filtered.length > 0 ? filtered : properties;
    const prices = propsToUse.map((p) => p.price);
    const sqms = propsToUse.map((p) => p.sqm);

    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const avgSqm = sqms.reduce((a, b) => a + b, 0) / sqms.length;
    const pricePerSqm = Math.round(avgPrice / avgSqm);

    return {
        rooms: targetRooms,
        age_range: 'all', // Simplified
        average_price: avgPrice,
        min_price: minPrice,
        max_price: maxPrice,
        median_price: medianPrice,
        price_per_sqm: pricePerSqm,
        sample_size: propsToUse.length,
    };
}

// Cron handler
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    // Create Supabase client - use service role if available, otherwise anon key
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

        console.log('[Cron] Sahibinden scraping started...');

        // Marmaris villalar
        const targets = [
            { city: 'muğla', district: 'marmaris', type: 'villa', rooms: ['2+1', '3+1', '4+1', '5+1'] },
        ];

        const results = [];

        for (const target of targets) {
            for (const rooms of target.rooms) {
                const roomStartTime = Date.now();

                try {
                    const url = buildSahibindenUrl(target.city, target.district, target.type, rooms);

                    // Scrape
                    const properties = await scrapeProperties(url);

                    if (properties.length === 0) {
                        console.log(`[Cron] No properties found for ${target.district}/${rooms}`);

                        // Log no data
                        await supabase.from('scraping_logs').insert({
                            city: target.city,
                            district: target.district,
                            listing_type: target.type,
                            rooms: rooms,
                            status: 'no_data',
                            properties_found: 0,
                            execution_time_ms: Date.now() - roomStartTime,
                        });

                        continue;
                    }

                    // Analiz
                    const stats = analyzeProperties(properties, rooms);

                    if (!stats) {
                        throw new Error('Analysis failed');
                    }

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
                        properties_found: properties.length,
                        average_price: stats.average_price,
                        execution_time_ms: Date.now() - roomStartTime,
                    });

                    results.push({
                        target: `${target.district}/${rooms}`,
                        found: properties.length,
                        avgPrice: stats.average_price,
                    });

                    console.log(`[Cron] ✓ ${target.district}/${rooms}: ${properties.length} properties`);

                    // Rate limiting (Anti-spam)
                    await new Promise((resolve) => setTimeout(resolve, 3000));
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
        console.log(`[Cron] ✅ Scraping completed in ${totalTime}ms`);

        return NextResponse.json({
            success: true,
            results,
            execution_time_ms: totalTime,
            timestamp: new Date().toISOString(),
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
