# Sahibinden Scraper + Vercel Cron Job - FINAL Antigravity Prompt

**Proje:** TR Danışman CRM - Background Data Collection System  
**Hedef:** Günlük Sahibinden.com scraping + Supabase auto-update  
**Scope:** Marmaris villalar SADECE (2+1, 3+1, 4+1, 5+1)  
**Execution Time:** ~50 dakika (Antigravity)  
**Version:** 1.0 PRODUCTION

---

## 🎯 SYSTEM ARCHITECTURE

```
Sahibinden.com
    ↓ (Puppeteer scrape)
┌─────────────────────────────┐
│ Vercel Cron Function        │
│ (Günde 1x, 00:00 UTC)       │
└────────────┬────────────────┘
             │ Parse + Clean
             ↓
┌─────────────────────────────┐
│ Supabase market_analysis    │
│ + market_analysis_history   │
└────────────┬────────────────┘
             │ Query
             ↓
┌─────────────────────────────┐
│ Realestate App              │
│ Price Analysis Module       │
└─────────────────────────────┘
```

---

## 📋 IMPLEMENTATION PLAN

Bu promptu **Antigravity Cloud Code**'a yapıştır ve çalıştır:

```
HEMEN BAŞLA: Aşağıdaki promptu Antigravity'ye kopyala
```

---

# ANTIGRAVITY PROMPT - BAŞLANGIÇ

```
Merhaba Antigravity!

TR Danışman CRM için Market Data Collection System kuruyoruz.

PROJE BİLGİSİ
═════════════════════════════════════════════════════════════════
Proje: TR Danışman CRM + Portföy Yönetimi
Framework: Next.js 14 + Vercel
Database: Supabase PostgreSQL
GitHub: https://github.com/canpog/realestate-app
Production: realestate-app-prod.vercel.app
Local: C:\Users\canpo\OneDrive\Masaüstü\realestate-app

SYSTEM ÖZET
═════════════════════════════════════════════════════════════════
Günde 1x (00:00 UTC) Sahibinden.com'dan Marmaris villa verisi çek
Parse et, temizle, Supabase'e yaz
Realestate App'in Price Analysis için kullanması için hazırla
History tracking ile eski verileri sakla (future analytics)

---

GÖREV 1: SUPABASE SCHEMA GÜNCELLEMESI
═════════════════════════════════════════════════════════════════

Supabase SQL Editor'e şu SQL'leri çalıştır:

\`\`\`sql
-- Market Analysis (Güncel veriler)
CREATE TABLE IF NOT EXISTS market_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Lokasyon
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    
    -- Emlak Tipi
    listing_type TEXT NOT NULL, -- 'villa'
    rooms TEXT NOT NULL, -- '2+1', '3+1', '4+1', '5+1'
    age_range TEXT, -- 'new', '0-5_years', '5-10_years', '10+_years'
    
    -- Pazar Verileri
    average_price NUMERIC NOT NULL,
    min_price NUMERIC,
    max_price NUMERIC,
    median_price NUMERIC,
    price_per_sqm NUMERIC,
    
    -- İstatistikler
    sample_size INTEGER DEFAULT 1,
    data_source TEXT DEFAULT 'sahibinden.com',
    last_scraped TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Analysis History (Eski verileri sakla)
CREATE TABLE IF NOT EXISTS market_analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    listing_type TEXT NOT NULL,
    rooms TEXT NOT NULL,
    age_range TEXT,
    
    -- Veriler (o gün ne vardı?)
    average_price NUMERIC,
    min_price NUMERIC,
    max_price NUMERIC,
    median_price NUMERIC,
    price_per_sqm NUMERIC,
    sample_size INTEGER,
    
    -- Meta
    snapshot_date TIMESTAMPTZ NOT NULL, -- Hangi gün bu veri?
    data_source TEXT DEFAULT 'sahibinden.com',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scraping Logs (Her çalıştırmanın logu)
CREATE TABLE IF NOT EXISTS scraping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Bilgi
    city TEXT,
    district TEXT,
    listing_type TEXT,
    
    -- Sonuç
    status TEXT, -- 'success', 'failed', 'rate_limited', 'no_data'
    properties_found INTEGER,
    average_price NUMERIC,
    error_message TEXT,
    
    -- Meta
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    execution_time_ms INTEGER -- Kaç ms sürdü?
);

-- İndeksler
CREATE INDEX idx_market_analysis_location ON market_analysis(city, district);
CREATE INDEX idx_market_analysis_type ON market_analysis(listing_type, rooms);
CREATE INDEX idx_market_analysis_updated ON market_analysis(updated_at DESC);
CREATE INDEX idx_history_snapshot ON market_analysis_history(snapshot_date DESC);
CREATE INDEX idx_scraping_logs_timestamp ON scraping_logs(scraped_at DESC);
\`\`\`

---

GÖREV 2: VERCEL CRON FUNCTION OLUŞTUR
═════════════════════════════════════════════════════════════════

Yeni dosya oluştur: api/cron/scrape-sahibinden/route.ts

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@/lib/supabase/server';

// Anti-detection plugin
puppeteer.use(StealthPlugin());

export const dynamic = 'force-dynamic';

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
  // URL Format: sahibinden.com/konut/...
  const params = new URLSearchParams();
  params.append('searchStatuses', 'forSale');
  params.append('properties', listingType === 'villa' ? 'villa' : 'apartment');
  params.append('days', '180'); // Son 6 ay
  
  // Rooms mapping
  const roomsMap: { [key: string]: string } = {
    '2+1': '3',
    '3+1': '4',
    '4+1': '5',
    '5+1': '6',
  };
  
  if (roomsMap[rooms]) {
    params.append('bedrooms', roomsMap[rooms]);
  }
  
  return \`https://www.sahibinden.com/konut/\${city}/\${district}?sort=newest&\${params.toString()}\`;
}

// Puppeteer ile scrape
async function scrapeProperties(
  url: string
): Promise<ScrapedProperty[]> {
  let browser;
  const properties: ScrapedProperty[] = [];
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    
    // User-Agent ayarla
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    
    // Timeout: 30 saniye
    page.setDefaultNavigationTimeout(30000);
    
    console.log(\`[Scraper] Fetching: \${url}\`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
    } catch (navigationError) {
      console.warn('[Scraper] Navigation timeout (continuing anyway):', navigationError);
    }

    // İlanları scrape et
    const scrapedData = await page.evaluate(() => {
      const items: any[] = [];
      
      // Sahibinden listing item selector
      const listings = document.querySelectorAll('[class*="listingCard"], [class*="searchResults"] li');
      
      listings.forEach((listing, index) => {
        if (index > 50) return; // Max 50 ilan
        
        try {
          // Title/fiyat bilgisi
          const titleEl = listing.querySelector('[class*="title"], h3');
          const priceEl = listing.querySelector('[class*="price"]');
          
          const title = titleEl?.textContent?.trim() || '';
          const priceText = priceEl?.textContent?.trim() || '';
          
          // Fiyat parse et
          const priceMatch = priceText.match(/([0-9.]+)/);
          const price = priceMatch ? parseInt(priceMatch[1].replace(/\\./g, '')) * 1000000 : 0;
          
          // m² ve oda bilgisi
          const sqmMatch = title.match(/(\\d+)\\s*m²/i);
          const roomsMatch = title.match(/(\\d\\+\\d)/);
          
          if (price > 0 && sqmMatch && roomsMatch) {
            items.push({
              title,
              price,
              sqm: parseInt(sqmMatch[1]),
              rooms: roomsMatch[1],
            });
          }
        } catch (e) {
          // Skip bu item
        }
      });
      
      return items;
    });

    properties.push(...scrapedData);
    console.log(\`[Scraper] Found \${properties.length} properties\`);

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
function analyzeProperties(properties: ScrapedProperty[]): MarketStats[] {
  if (properties.length === 0) {
    throw new Error('No properties found');
  }

  const groupedByRooms = new Map<string, ScrapedProperty[]>();

  // Oda sayısına göre grupla
  properties.forEach((prop) => {
    if (!groupedByRooms.has(prop.rooms)) {
      groupedByRooms.set(prop.rooms, []);
    }
    groupedByRooms.get(prop.rooms)!.push(prop);
  });

  const stats: MarketStats[] = [];

  groupedByRooms.forEach((props, rooms) => {
    const prices = props.map((p) => p.price);
    const sqms = props.map((p) => p.sqm);

    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    const avgSqm = sqms.reduce((a, b) => a + b, 0) / sqms.length;
    const pricePerSqm = Math.round(avgPrice / avgSqm);

    stats.push({
      rooms,
      age_range: 'new', // Simplified, can be enhanced
      average_price: avgPrice,
      min_price: minPrice,
      max_price: maxPrice,
      median_price: medianPrice,
      price_per_sqm: pricePerSqm,
      sample_size: props.length,
    });
  });

  return stats;
}

// Cron handler
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const supabase = createClient();

  try {
    // Cron secret kontrolü
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== \`Bearer \${cronSecret}\`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Sahibinden scraping started...');

    // Marmaris villalar
    const targets = [
      { city: 'muğla', district: 'marmaris', type: 'villa', rooms: ['2+1', '3+1', '4+1', '5+1'] },
    ];

    const results = [];

    for (const target of targets) {
      for (const rooms of target.rooms) {
        try {
          const url = buildSahibindenUrl(target.city, target.district, target.type, rooms);
          
          // Scrape
          const properties = await scrapeProperties(url);

          if (properties.length === 0) {
            throw new Error('No properties found');
          }

          // Analiz
          const stats = analyzeProperties(properties);

          // History'ye kaydet (backup)
          for (const stat of stats) {
            await supabase.from('market_analysis_history').insert({
              city: target.city,
              district: target.district,
              listing_type: target.type,
              rooms: stat.rooms,
              age_range: stat.age_range,
              average_price: stat.average_price,
              min_price: stat.min_price,
              max_price: stat.max_price,
              median_price: stat.median_price,
              price_per_sqm: stat.price_per_sqm,
              sample_size: stat.sample_size,
              snapshot_date: new Date(),
            });
          }

          // Market_analysis güncelle (upsert)
          for (const stat of stats) {
            const { error } = await supabase
              .from('market_analysis')
              .upsert({
                city: target.city,
                district: target.district,
                listing_type: target.type,
                rooms: stat.rooms,
                age_range: stat.age_range,
                average_price: stat.average_price,
                min_price: stat.min_price,
                max_price: stat.max_price,
                median_price: stat.median_price,
                price_per_sqm: stat.price_per_sqm,
                sample_size: stat.sample_size,
                last_scraped: new Date(),
              });

            if (error) {
              console.error('[Cron] Upsert error:', error);
            }
          }

          // Log başarı
          await supabase.from('scraping_logs').insert({
            city: target.city,
            district: target.district,
            listing_type: target.type,
            status: 'success',
            properties_found: properties.length,
            average_price: stats[0]?.average_price,
            execution_time_ms: Date.now() - startTime,
          });

          results.push({
            target: \`\${target.district}/\${rooms}\`,
            found: properties.length,
            avgPrice: stats[0]?.average_price,
          });

          console.log(\`[Cron] ✓ \${target.district}/\${rooms}: \${properties.length} properties\`);

          // Rate limiting (Sahibinden'i spam etme)
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(\`[Cron] Error for \${target.district}/\${rooms}:\`, error);

          await supabase.from('scraping_logs').insert({
            city: target.city,
            district: target.district,
            listing_type: target.type,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            execution_time_ms: Date.now() - startTime,
          });
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(\`[Cron] ✅ Scraping completed in \${totalTime}ms\`);

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
\`\`\`

---

GÖREV 3: VERCEL.JSON CRON SETUP
═════════════════════════════════════════════════════════════════

vercel.json dosyasını aç/oluştur ve güncelle:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/scrape-sahibinden",
      "schedule": "0 0 * * *"
    }
  ]
}
\`\`\`

Bu: "Günde 1x, 00:00 UTC'de çalış"

---

GÖREV 4: ENVIRONMENT VARIABLES
═════════════════════════════════════════════════════════════════

Vercel Dashboard → Settings → Environment Variables:

Ekle:
- CRON_SECRET = aVerySecureRandomToken123456789ABC (AYNISI!)
- ANTHROPIC_API_KEY = (zaten var)
- SUPABASE_URL = (zaten var)
- SUPABASE_SERVICE_ROLE_KEY = (zaten var)

---

GÖREV 5: VERCEL'E DEPLOY
═════════════════════════════════════════════════════════════════

PowerShell'de:

\`\`\`bash
git add .
git commit -m "Add Sahibinden scraper with Vercel cron"
git push
\`\`\`

Vercel otomatik deploy edecek.

---

GÖREV 6: CRON JOB TEST
═════════════════════════════════════════════════════════════════

Vercel Dashboard → Project → Cron Jobs

Görüntü:
✓ /api/cron/scrape-sahibinden
✓ Schedule: 0 0 * * * (Günde 1x, 00:00 UTC)
✓ Status: Active

Manual test (Vercel Dashboard'da Test butonuna tıkla):

\`\`\`bash
curl -X GET https://realestate-app-prod.vercel.app/api/cron/scrape-sahibinden \\
  -H "Authorization: Bearer aVerySecureRandomToken123456789ABC"
\`\`\`

Beklenen sonuç:
\`\`\`json
{
  "success": true,
  "results": [
    {
      "target": "marmaris/2+1",
      "found": 23,
      "avgPrice": 2800000
    },
    ...
  ],
  "execution_time_ms": 45000,
  "timestamp": "2026-02-07T00:00:00.000Z"
}
\`\`\`

---

GÖREV 7: MONITORING & LOGS
═════════════════════════════════════════════════════════════════

Supabase'de şunu kontrol et:

1. market_analysis tablosu:
   SELECT * FROM market_analysis WHERE district = 'marmaris';
   
   Sonuç: 4 satır (2+1, 3+1, 4+1, 5+1)

2. market_analysis_history tablosu:
   SELECT * FROM market_analysis_history ORDER BY snapshot_date DESC LIMIT 10;
   
   Sonuç: Eski snapshots görüntülenecek

3. scraping_logs tablosu:
   SELECT * FROM scraping_logs ORDER BY scraped_at DESC;
   
   Sonuç: Başarılı loglar

---

GÖREV 8: REALESTATE APP İLE ENTEGRE
═════════════════════════════════════════════════════════════════

Price Analysis API zaten market_analysis'i kullanıyor!
Başka bir şey yapmanız gerekmez.

Sistem otomatik çalışacak:

1. 00:00 UTC: Vercel cron çalışır
2. Sahibinden scrape eder
3. market_analysis güncelle
4. User "Fiyat Analizi" tıkladığında:
   → market_analysis sorgulanır
   → Fresh data var!

---

DEPLOYMENT CHECKL İST
═════════════════════════════════════════════════════════════════

✓ SQL'ler Supabase'de çalıştırıldı mı?
✓ route.ts dosyası app/api/cron/scrape-sahibinden/ içinde mi?
✓ vercel.json dosyası güncellendi mi?
✓ CRON_SECRET env variable set mi?
✓ Git push yapıldı mı?
✓ Vercel deploy tamamlandı mı?
✓ Cron job Status: Active mi?
✓ Manual test başarılı mı?
✓ Supabase'de veri görünüyor mu?

---

TIMELINE
═════════════════════════════════════════════════════════════════

✓ SAAT 00:00 UTC: Cron otomatik çalışır
✓ SAAT 00:05 UTC: Veriler Supabase'de
✓ SAAT 00:10 UTC: Realestate app kullanıma hazır
✓ HER GÜN: Tekrar et

---

TESTING SENARYOLARI
═════════════════════════════════════════════════════════════════

Test 1: Manual Cron Trigger
- Vercel Dashboard'da Test tıkla
- 2-3 dakika bekle
- Supabase'de veri görün

Test 2: Price Analysis ile Entegrasyon
- /price-analysis sayfasına git
- Marmaris, 3+1 Villa seç
- Analiz Yap tıkla
- Fresh market data kullanılıyor mu kontrol et

Test 3: History Tracking
- Günde 2 kez manuel test yap
- 2 gün sonra history'de iki snapshot olacak
- Fiyat değişimleri görülecek

---

MONITORING & TROUBLESHOOTING
═════════════════════════════════════════════════════════════════

Eğer veri gelmezse:

1. Vercel logs kontrol et:
   vercel logs https://realestate-app-prod.vercel.app

2. Scraping logs:
   SELECT * FROM scraping_logs WHERE status != 'success';

3. Manual test:
   curl -X GET https://realestate-app-prod.vercel.app/api/cron/scrape-sahibinden \\
     -H "Authorization: Bearer CRON_SECRET"

4. İçin hızlı kontrol:
   - İnternet bağlantısı var mı?
   - Supabase erişilebilir mi?
   - Rate limiting var mı?

---

NEXT STEPS (Gelecek)
═════════════════════════════════════════════════════════════════

Şu anda: Marmaris Villalar
Sonra ekle:
- İstanbul (Maltepe, Beşiktaş, etc)
- Ankara Çankaya
- İzmir Alsancak
- Antalya Konyaaltı
- Muğla Bodrum

Her şehir için aynı script, sadece URL değişir.

---

BAŞARILI DEPLOYMENT SONUCU
═════════════════════════════════════════════════════════════════

✅ Günde 1x otomatik scraping
✅ Supabase'de fresh market data
✅ Price Analysis instant hesaplama
✅ History tracking (analytics için)
✅ Error logging (monitoring için)
✅ Zero manual work

= Sistem automatic, reliable, scalable
```

---

## 📝 ÖZET

Bu prompt 8 görevde complete sistem kuruyor:

| Görev | Yıl | Status |
|-------|-----|--------|
| 1 | Database schema | SQL |
| 2 | Vercel cron function | TypeScript |
| 3 | Cron schedule | JSON |
| 4 | Environment vars | Setup |
| 5 | Deployment | Git push |
| 6 | Testing | Manual |
| 7 | Monitoring | Supabase |
| 8 | Integration | Automatic |

---

## 🚀 YAPTICAGIN

```
1. Bu promptu Antigravity'ye yapıştır
2. RUN tıkla
3. Bitene kadar bekle (~2 saat)
4. Test et
5. Deployed! ✓
```

---

## ✨ SONUÇ

**Günde 1x otomatik Marmaris villa scraping!**

- Sahibinden'den veri çek
- Supabase'e yaz
- Price Analysis kullanır
- History sakla (analytics için)
- Zero manual work

= Production-ready, fully automated system!

🔥 **Hadi başlatalım!** 🔥
