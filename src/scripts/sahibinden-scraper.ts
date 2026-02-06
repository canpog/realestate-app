/**
 * Sahibinden.com Web Scraper
 * 
 * NOT: Sahibinden.com doğrudan scraping'i engelleyebilir.
 * Bu script eğitim amaçlıdır ve production'da API kullanılmalıdır.
 * 
 * Production için: /api/cron/scrape-sahibinden endpoint'ini kullanın.
 * Çalıştırmak için: npx ts-node --esm src/scripts/sahibinden-scraper.ts
 */

// Mock scraper - cheerio removed, production uses Puppeteer in cron job

interface ScrapedProperty {
    title: string;
    price: number;
    sqm: number;
    rooms: string;
    location: { city: string; district: string };
    listingType: string;
}

interface ScrapeTarget {
    city: string;
    district: string;
    type: string;
    rooms: string;
}

class SahibindenScraper {
    private baseUrl = 'https://www.sahibinden.com';

    /**
     * Mock scrape - Returns simulated data
     * In production, this would actually fetch from Sahibinden
     */
    async scrapeProperties(
        city: string,
        district: string,
        listingType: string,
        rooms: string
    ): Promise<ScrapedProperty[]> {
        console.log(`[Scraper] Simulating scrape for: ${city}/${district}/${listingType}/${rooms}`);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Generate mock data based on location
        const basePrice = this.getBasePrice(city, district, listingType);
        const count = Math.floor(Math.random() * 20) + 15;

        const properties: ScrapedProperty[] = [];
        for (let i = 0; i < count; i++) {
            const variation = 0.7 + Math.random() * 0.6; // 70% to 130%
            const sqm = listingType === 'villa' ? 180 + Math.floor(Math.random() * 120) : 80 + Math.floor(Math.random() * 60);

            properties.push({
                title: `${rooms} ${listingType} - ${sqm}m² - ${district}`,
                price: Math.round(basePrice * variation),
                sqm,
                rooms,
                location: { city, district },
                listingType,
            });
        }

        console.log(`[Scraper] Generated ${properties.length} mock properties`);
        return properties;
    }

    private getBasePrice(city: string, district: string, type: string): number {
        const cityPrices: Record<string, number> = {
            'istanbul': 3500000,
            'ankara': 2200000,
            'izmir': 2500000,
            'antalya': 2800000,
            'mugla': 4500000,
            'bursa': 2000000,
        };

        const base = cityPrices[city.toLowerCase()] || 2000000;
        const typeMultiplier = type === 'villa' ? 2.5 : 1;

        return base * typeMultiplier;
    }

    /**
     * Calculate statistics from scraped properties
     */
    calculateStats(properties: ScrapedProperty[]) {
        if (properties.length === 0) return null;

        const prices = properties.map((p) => p.price);
        const sqms = properties.map((p) => p.sqm);

        const sortedPrices = [...prices].sort((a, b) => a - b);

        return {
            average_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
            min_price: Math.min(...prices),
            max_price: Math.max(...prices),
            median_price: sortedPrices[Math.floor(sortedPrices.length / 2)],
            price_per_sqm: Math.round(
                prices.reduce((a, b) => a + b, 0) / sqms.reduce((a, b) => a + b, 0)
            ),
            sample_size: properties.length,
        };
    }

    /**
     * Run full scrape routine
     */
    async runFullScrape() {
        const targets: ScrapeTarget[] = [
            // İstanbul
            { city: 'İstanbul', district: 'Maltepe', type: 'apartment', rooms: '2+1' },
            { city: 'İstanbul', district: 'Maltepe', type: 'apartment', rooms: '3+1' },
            { city: 'İstanbul', district: 'Kadıköy', type: 'apartment', rooms: '2+1' },
            { city: 'İstanbul', district: 'Kadıköy', type: 'apartment', rooms: '3+1' },
            { city: 'İstanbul', district: 'Beşiktaş', type: 'apartment', rooms: '2+1' },
            { city: 'İstanbul', district: 'Beşiktaş', type: 'apartment', rooms: '3+1' },
            // Ankara
            { city: 'Ankara', district: 'Çankaya', type: 'apartment', rooms: '2+1' },
            { city: 'Ankara', district: 'Çankaya', type: 'apartment', rooms: '3+1' },
            // İzmir
            { city: 'İzmir', district: 'Konak', type: 'apartment', rooms: '2+1' },
            { city: 'İzmir', district: 'Karşıyaka', type: 'apartment', rooms: '2+1' },
            // Muğla
            { city: 'Muğla', district: 'Bodrum', type: 'villa', rooms: '3+1' },
            { city: 'Muğla', district: 'Marmaris', type: 'villa', rooms: '3+1' },
            // Antalya
            { city: 'Antalya', district: 'Konyaaltı', type: 'apartment', rooms: '2+1' },
            { city: 'Antalya', district: 'Lara', type: 'villa', rooms: '3+1' },
        ];

        console.log('═══════════════════════════════════════');
        console.log('   SAHIBINDEN SCRAPER - STARTING');
        console.log('═══════════════════════════════════════\n');

        const results = [];

        for (const target of targets) {
            const properties = await this.scrapeProperties(
                target.city,
                target.district,
                target.type,
                target.rooms
            );

            const stats = this.calculateStats(properties);

            if (stats) {
                results.push({
                    ...target,
                    ...stats,
                });

                console.log(`✅ ${target.city}/${target.district} (${target.rooms} ${target.type})`);
                console.log(`   Avg: ${stats.average_price.toLocaleString('tr-TR')} ₺`);
                console.log(`   Per m²: ${stats.price_per_sqm.toLocaleString('tr-TR')} ₺`);
                console.log(`   Samples: ${stats.sample_size}\n`);
            }

            // Rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        console.log('═══════════════════════════════════════');
        console.log(`   COMPLETED: ${results.length} locations scraped`);
        console.log('═══════════════════════════════════════\n');

        // Output SQL inserts
        console.log('-- SQL INSERT statements for market_analysis:');
        console.log('-- Copy and run in Supabase SQL Editor\n');

        for (const r of results) {
            console.log(`INSERT INTO market_analysis (city, district, listing_type, rooms, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source) VALUES`);
            console.log(`('${r.city}', '${r.district}', '${r.type}', '${r.rooms}', ${r.average_price}, ${r.min_price}, ${r.max_price}, ${r.median_price}, ${r.price_per_sqm}, ${r.sample_size}, 'scraper');`);
        }

        return results;
    }
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const scraper = new SahibindenScraper();
    scraper.runFullScrape().catch(console.error);
}

export { SahibindenScraper };
