# Sprint 13: Fiyat Analizi Modülü - Antigravity Prompt

**Proje:** TR Danışman CRM + Portföy Uygulaması  
**Sprint:** 13 (Gün 11-15)  
**Hedef:** Akıllı Fiyat Analizi Sistemi + Web Scraping  
**Süre:** 4-5 iş günü  
**Versiyon:** 3.0

---

## 📋 SPRINT 13 ÖZET

### Hedefler:
1. ✅ Sahibinden.com'dan veri scraping (Python script)
2. ✅ Market Analysis veritabanı seeding
3. ✅ Fiyat Analizi API (Claude AI entegrasyonu)
4. ✅ Fiyat Analizi UI Components
5. ✅ Valuation Report Generate & Share

### Deliverables:
- Market Analysis DB seeded (10+ şehir, 50+ bölge)
- Web Scraper script (Sahibinden)
- Price Analysis API Route
- Price Analysis Form & Results UI
- PDF Export functionality

---

## 🎯 GÖREV: Antigravity İçin Detaylı Prompt

Aşağıdaki promptu **Antigravity Cloud Code**'a yapıştır ve çalıştır:

---

```
Merhaba Antigravity!

TR Danışman CRM'nin Fiyat Analizi Modülü (Sprint 13) için aşağıdaki görevleri otomatikleştir.

PROJE BİLGİSİ:
- Proje: TR Danışman CRM + Portföy Yönetimi
- Framework: Next.js 14
- Database: Supabase PostgreSQL
- GitHub: https://github.com/canpog/realestate-app
- Vercel: https://realestate-app-prod.vercel.app
- Proje Klasörü: C:\Users\canpo\OneDrive\Masaüstü\realestate-app

GÖREV 1: VERİTABANI SCHEMA OLUŞTUR
═══════════════════════════════════════

1.1 Supabase'de şu tabloları oluştur (SQL):

```sql
-- Market Analizi Verileri (Bölge pazar ortalamaları)
CREATE TABLE market_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Konum Bilgileri
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    neighborhood TEXT,
    
    -- Emlak Türü Gruplaması
    listing_type TEXT NOT NULL, -- 'apartment', 'villa', 'house', 'land', 'commercial'
    rooms TEXT, -- '2+1', '3+1', '4+1', '5+1', 'villa_3', 'villa_4'
    age_range TEXT, -- 'new', '0-5_years', '5-10_years', '10+_years'
    
    -- Pazar Verileri
    average_price NUMERIC NOT NULL,
    min_price NUMERIC,
    max_price NUMERIC,
    median_price NUMERIC,
    price_per_sqm NUMERIC,
    
    -- İstatistikler
    sample_size INTEGER DEFAULT 1, -- Kaç satışa dayalı?
    data_source TEXT DEFAULT 'sahibinden', -- 'sahibinden', 'manual', 'api'
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Fiyat Analiz Raporu
CREATE TABLE price_analysis_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Analiz Parametreleri
    analysis_params JSONB, -- { rooms, age, sqm, condition, floor, features, location }
    
    -- Sonuçlar (AI tarafından hesaplandı)
    estimated_price NUMERIC,
    price_range_min NUMERIC,
    price_range_max NUMERIC,
    price_score FLOAT, -- 0-10, 10=harika fiyat, 0=pahalı
    price_per_sqm NUMERIC,
    market_comparison TEXT, -- "Bu portföy bölge ortalamasından %15 ucuz"
    recommendations TEXT, -- Fiyatlandırma önerileri
    rental_yield FLOAT, -- Kira getirisi %
    valuation_notes TEXT,
    
    -- Meta
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Web Scraping Logu (Sahibinden verilerini izlemek için)
CREATE TABLE scraping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    city TEXT,
    district TEXT,
    listing_type TEXT,
    rooms TEXT,
    
    -- Sonuçlar
    properties_found INTEGER,
    average_price NUMERIC,
    price_range_min NUMERIC,
    price_range_max NUMERIC,
    
    -- Meta
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    data_source TEXT DEFAULT 'sahibinden.com',
    status TEXT DEFAULT 'success' -- 'success', 'failed', 'rate_limited'
);

-- İndeksler
CREATE INDEX idx_market_analysis_location ON market_analysis(city, district);
CREATE INDEX idx_market_analysis_listing_type ON market_analysis(listing_type);
CREATE INDEX idx_price_analysis_listing ON price_analysis_reports(listing_id);
CREATE INDEX idx_price_analysis_agent ON price_analysis_reports(agent_id);
CREATE INDEX idx_scraping_logs_timestamp ON scraping_logs(scraped_at);
```

GÖREV 2: SAHİBİNDEN WEB SCRAPER SCRIPT
════════════════════════════════════════

2.1 Node.js Web Scraper oluştur (src/scripts/sahibinden-scraper.ts):

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@/lib/supabase/server';

interface ScrapedProperty {
  title: string;
  price: number;
  sqm: number;
  rooms: string;
  location: { city: string; district: string };
  listingType: string;
}

class SahibindenScraper {
  private baseUrl = 'https://www.sahibinden.com/konut/;';
  private supabase = createClient();

  /**
   * Sahibinden.com'dan emlak verisi çek
   * URL formatı: /konut/;f=istanbul/maltepe/t=daire/dn=3+1
   */
  async scrapeProperties(
    city: string,
    district: string,
    listingType: string,
    rooms: string
  ): Promise<ScrapedProperty[]> {
    try {
      // URL oluştur
      const searchUrl = `${this.baseUrl}f=${city}/${district}/t=${listingType}/dn=${rooms}`;

      console.log(`[Scraper] Fetching: ${searchUrl}`);

      const { data } = await axios.get(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(data);
      const properties: ScrapedProperty[] = [];

      // İlanları parse et
      $('[class*="searchResultsItem"]').each((index, element) => {
        try {
          const title = $(element).find('[class*="listing-title"]').text().trim();
          const priceText = $(element)
            .find('[class*="price"]')
            .text()
            .trim()
            .replace(/[^0-9]/g, '');
          const price = parseInt(priceText);

          // m² ve oda bilgisini başlıktan çıkar
          const sqmMatch = title.match(/(\d+)\s*m²/);
          const roomsMatch = title.match(/(\d\+\d)/);

          if (price > 0 && sqmMatch && roomsMatch) {
            properties.push({
              title,
              price,
              sqm: parseInt(sqmMatch[1]),
              rooms: roomsMatch[1],
              location: { city, district },
              listingType,
            });
          }
        } catch (e) {
          console.warn(`[Scraper] Parse error on item ${index}:`, e);
        }
      });

      console.log(
        `[Scraper] Found ${properties.length} properties in ${district}, ${city}`
      );
      return properties;
    } catch (error) {
      console.error(`[Scraper] Error fetching ${city}/${district}:`, error);
      return [];
    }
  }

  /**
   * Scrape edilen verileri analiz et ve market_analysis'a kaydet
   */
  async saveMarketAnalysis(
    city: string,
    district: string,
    listingType: string,
    rooms: string,
    properties: ScrapedProperty[]
  ) {
    if (properties.length === 0) {
      console.warn(`[Analysis] No properties found for ${city}/${district}`);
      return;
    }

    // İstatistikleri hesapla
    const prices = properties.map((p) => p.price);
    const sqms = properties.map((p) => p.sqm);

    const avgPrice = Math.round(
      prices.reduce((a, b) => a + b, 0) / prices.length
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    const avgSqm = sqms.reduce((a, b) => a + b, 0) / sqms.length;
    const pricePerSqm = Math.round(avgPrice / avgSqm);

    console.log(`[Analysis] ${city}/${district} - Avg: ${avgPrice}, Per m²: ${pricePerSqm}`);

    // Supabase'e kaydet
    const { error } = await this.supabase
      .from('market_analysis')
      .upsert({
        city,
        district,
        listing_type: listingType,
        rooms,
        average_price: avgPrice,
        min_price: minPrice,
        max_price: maxPrice,
        median_price: medianPrice,
        price_per_sqm: pricePerSqm,
        sample_size: properties.length,
        data_source: 'sahibinden',
        last_updated: new Date(),
      });

    if (error) {
      console.error(`[Database] Error saving market analysis:`, error);
    }

    // Scraping log'u kaydet
    await this.supabase.from('scraping_logs').insert({
      city,
      district,
      listing_type: listingType,
      rooms,
      properties_found: properties.length,
      average_price: avgPrice,
      price_range_min: minPrice,
      price_range_max: maxPrice,
      scraped_at: new Date(),
      status: 'success',
    });
  }

  /**
   * Ana scraping rutini çalıştır
   */
  async runFullScrape() {
    // Scrape edilecek kombinasyonlar (şehir/ilçe/tip/oda)
    const targets = [
      // İstanbul
      { city: 'istanbul', district: 'maltepe', type: 'daire', rooms: '2+1' },
      { city: 'istanbul', district: 'maltepe', type: 'daire', rooms: '3+1' },
      { city: 'istanbul', district: 'besiktas', type: 'daire', rooms: '2+1' },
      { city: 'istanbul', district: 'besiktas', type: 'daire', rooms: '3+1' },
      { city: 'istanbul', district: 'atasehir', type: 'daire', rooms: '2+1' },
      { city: 'istanbul', district: 'atasehir', type: 'daire', rooms: '3+1' },
      { city: 'istanbul', district: 'kadikoy', type: 'daire', rooms: '2+1' },
      { city: 'istanbul', district: 'kadikoy', type: 'daire', rooms: '3+1' },
      // Ankara
      { city: 'ankara', district: 'cankaya', type: 'daire', rooms: '2+1' },
      { city: 'ankara', district: 'cankaya', type: 'daire', rooms: '3+1' },
      { city: 'ankara', district: 'kecioren', type: 'daire', rooms: '2+1' },
      // İzmir
      { city: 'izmir', district: 'alsancak', type: 'daire', rooms: '2+1' },
      { city: 'izmir', district: 'konak', type: 'daire', rooms: '2+1' },
      // Muğla
      { city: 'mugla', district: 'marmaris', type: 'villa', rooms: '3+1' },
      { city: 'mugla', district: 'bodrum', type: 'villa', rooms: '2+1' },
      // Antalya
      { city: 'antalya', district: 'konyaalti', type: 'daire', rooms: '2+1' },
      { city: 'antalya', district: 'lara', type: 'villa', rooms: '3+1' },
    ];

    for (const target of targets) {
      const properties = await this.scrapeProperties(
        target.city,
        target.district,
        target.type,
        target.rooms
      );

      await this.saveMarketAnalysis(
        target.city,
        target.district,
        target.type,
        target.rooms,
        properties
      );

      // Rate limiting (Sahibinden'i spam etme)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log('[Scraper] Full scrape completed!');
  }
}

// Çalıştırma
(async () => {
  const scraper = new SahibindenScraper();
  await scraper.runFullScrape();
})();
```

GÖREV 3: PRICE ANALYSIS API ROUTE
═════════════════════════════════

3.1 API endpoint oluştur (app/api/price-analysis/route.ts):

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PriceAnalysisRequest {
  listing_id: string;
  analysis_params: {
    rooms: string;
    age: string;
    sqm: number;
    condition: string;
    floor: number;
    total_floors: number;
    city: string;
    district: string;
    features: string[];
    distance_to_sea?: number;
    distance_to_metro?: number;
  };
}

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body: PriceAnalysisRequest = await request.json();

  try {
    // 1. Pazar verilerini bul
    const { data: marketData } = await supabase
      .from('market_analysis')
      .select('*')
      .eq('city', body.analysis_params.city)
      .eq('district', body.analysis_params.district)
      .eq('rooms', body.analysis_params.rooms)
      .single();

    if (!marketData) {
      return Response.json(
        { error: 'Market data not available for this area' },
        { status: 404 }
      );
    }

    // 2. Portfolio verilerini al
    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', body.listing_id)
      .single();

    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    // 3. Claude AI ile analiz yap
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Sen bir emlak değerleme ve fiyat analiz uzmanısın.

PORTFÖY BİLGİLERİ
═══════════════════════════════════════
Başlık: ${listing.title}
Mevcut Fiyat: ${listing.price.toLocaleString('tr-TR')} ₺
Metrekare: ${body.analysis_params.sqm} m²
Oda Sayısı: ${body.analysis_params.rooms}
Bina Yaşı: ${body.analysis_params.age}
Lokasyon: ${body.analysis_params.district}, ${body.analysis_params.city}
Kat: ${body.analysis_params.floor}/${body.analysis_params.total_floors}
Kondisyon: ${body.analysis_params.condition}
Özellikler: ${body.analysis_params.features.join(', ')}
${body.analysis_params.distance_to_sea ? `Denize Uzaklığı: ${body.analysis_params.distance_to_sea}m` : ''}
${body.analysis_params.distance_to_metro ? `Metroya Uzaklığı: ${body.analysis_params.distance_to_metro}km` : ''}

PAZAR VERİLERİ (Sahibinden.com Verileri)
═══════════════════════════════════════════
Bölge: ${body.analysis_params.district}, ${body.analysis_params.city}
Benzer Portföyler: ${marketData.sample_size} satış (son 3-6 ay)
Ortalama Fiyat: ${marketData.average_price?.toLocaleString('tr-TR')} ₺
Medyan Fiyat: ${marketData.median_price?.toLocaleString('tr-TR')} ₺
Fiyat Aralığı: ${marketData.min_price?.toLocaleString('tr-TR')} - ${marketData.max_price?.toLocaleString('tr-TR')} ₺
Fiyat/m²: ${marketData.price_per_sqm?.toLocaleString('tr-TR')} ₺

TALEPLER
═════════════
1. Tahmini piyasa değeri (min-max aralığı)
2. Fiyat skoru (0-10, 10=harika fiyat)
3. Fiyat/m² karşılaştırması
4. Pazar analizi ve karşılaştırma
5. Fiyatlandırma önerileri
6. Kira getirisi hesaplaması

JSON formatında detaylı yanıt ver:
{
  "estimated_market_price": 2850000,
  "price_range": { "min": 2700000, "max": 3000000 },
  "price_score": 8.2,
  "price_per_sqm": 23750,
  "comparison": "Bu portföy bölge ortalamasından %5 ucuz",
  "recommendations": "Mevcut fiyat makul. Hızlı satış için 2.750.000 ₺ önerilir.",
  "rental_yield": 7.8,
  "valuation_notes": "Yeni bina, denize yakınlık premium sağlıyor. Fiyat uygun."
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const aiAnalysis = JSON.parse(
      response.content[0].type === 'text' ? response.content[0].text : '{}'
    );

    // 4. Raporu veritabanına kaydet
    const { data: report } = await supabase
      .from('price_analysis_reports')
      .insert({
        agent_id: (
          await supabase
            .from('agents')
            .select('id')
            .eq('auth_user_id', user.id)
            .single()
        ).data?.id,
        listing_id: body.listing_id,
        analysis_params: body.analysis_params,
        estimated_price: aiAnalysis.estimated_market_price,
        price_range_min: aiAnalysis.price_range?.min,
        price_range_max: aiAnalysis.price_range?.max,
        price_score: aiAnalysis.price_score,
        price_per_sqm: aiAnalysis.price_per_sqm,
        market_comparison: aiAnalysis.comparison,
        recommendations: aiAnalysis.recommendations,
        rental_yield: aiAnalysis.rental_yield,
        valuation_notes: aiAnalysis.valuation_notes,
      })
      .select()
      .single();

    return Response.json({
      success: true,
      analysis: {
        ...aiAnalysis,
        report_id: report?.id,
      },
    });
  } catch (error) {
    console.error('Price analysis error:', error);
    return Response.json(
      { error: 'Price analysis failed' },
      { status: 500 }
    );
  }
}
```

GÖREV 4: PRICE ANALYSIS UI COMPONENTS
════════════════════════════════════════

4.1 Form Component (components/price-analysis/price-analysis-form.tsx):

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PriceAnalysisFormProps {
  listingId: string;
  listingData?: {
    title: string;
    price: number;
    sqm: number;
  };
  onAnalysisComplete: (result: any) => void;
}

export function PriceAnalysisForm({
  listingId,
  listingData,
  onAnalysisComplete,
}: PriceAnalysisFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rooms: '2+1',
    age: 'new',
    condition: 'excellent',
    floor: 1,
    total_floors: 5,
    city: 'istanbul',
    district: 'maltepe',
    features: [] as string[],
    distance_to_sea: 500,
    distance_to_metro: 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/price-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          analysis_params: {
            ...formData,
            sqm: listingData?.sqm || 100,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        onAnalysisComplete(data.analysis);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Fiyat Analizi Yap</h2>

      {/* Konum */}
      <div className="space-y-3">
        <h3 className="font-semibold">Konum</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select value={formData.city} onValueChange={(v) => setFormData({ ...formData, city: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="istanbul">İstanbul</SelectItem>
              <SelectItem value="ankara">Ankara</SelectItem>
              <SelectItem value="izmir">İzmir</SelectItem>
              <SelectItem value="antalya">Antalya</SelectItem>
              <SelectItem value="mugla">Muğla</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="İlçe"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          />
        </div>
      </div>

      {/* Temel Özellikler */}
      <div className="space-y-3">
        <h3 className="font-semibold">Temel Özellikler</h3>
        <div className="grid grid-cols-3 gap-4">
          <Select value={formData.rooms} onValueChange={(v) => setFormData({ ...formData, rooms: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2+1">2+1</SelectItem>
              <SelectItem value="3+1">3+1</SelectItem>
              <SelectItem value="4+1">4+1</SelectItem>
              <SelectItem value="5+1">5+1</SelectItem>
            </SelectContent>
          </Select>

          <Select value={formData.age} onValueChange={(v) => setFormData({ ...formData, age: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Yeni (0-2 yıl)</SelectItem>
              <SelectItem value="recent">Nispeten Yeni (2-5 yıl)</SelectItem>
              <SelectItem value="medium">Orta Yaşlı (5-10 yıl)</SelectItem>
              <SelectItem value="old">Eski (10+ yıl)</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Kat"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
          />
        </div>
      </div>

      {/* Özellikler */}
      <div className="space-y-3">
        <h3 className="font-semibold">Özellikler</h3>
        <div className="grid grid-cols-3 gap-3">
          {['Asansör', 'Otopark', 'Bahçe', 'Klima', 'Doğalgaz', 'Havuz'].map((feature) => (
            <label key={feature} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.features.includes(feature)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      features: [...formData.features, feature],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      features: formData.features.filter((f) => f !== feature),
                    });
                  }
                }}
              />
              <span className="text-sm">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Analiz Yapılıyor...' : 'Analiz Yap'}
      </Button>
    </form>
  );
}
```

4.2 Results Component (components/price-analysis/price-analysis-results.tsx):

```typescript
'use client';

interface PriceAnalysisResultsProps {
  analysis: {
    estimated_market_price: number;
    price_range: { min: number; max: number };
    price_score: number;
    price_per_sqm: number;
    comparison: string;
    recommendations: string;
    rental_yield: number;
    valuation_notes: string;
  };
  listingPrice: number;
}

export function PriceAnalysisResults({
  analysis,
  listingPrice,
}: PriceAnalysisResultsProps) {
  const priceRatio = listingPrice / analysis.estimated_market_price;
  const scoreColor = analysis.price_score >= 7 ? 'green' : analysis.price_score >= 5 ? 'yellow' : 'red';

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Değerleme Raporu</h2>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-gray-600">Tahmini Pazar Değeri</p>
          <p className="text-2xl font-bold">
            {analysis.estimated_market_price.toLocaleString('tr-TR')} ₺
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-gray-600">Fiyat Skoru</p>
          <p className={`text-2xl font-bold text-${scoreColor}-600`}>
            {analysis.price_score.toFixed(1)}/10
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-gray-600">Fiyat/m²</p>
          <p className="text-2xl font-bold">
            {analysis.price_per_sqm.toLocaleString('tr-TR')} ₺
          </p>
        </div>
      </div>

      {/* Fiyat Aralığı */}
      <div className="p-4 border rounded-lg">
        <p className="text-sm font-semibold mb-2">Tahmini Fiyat Aralığı</p>
        <p className="text-lg">
          {analysis.price_range.min.toLocaleString('tr-TR')} - {analysis.price_range.max.toLocaleString('tr-TR')} ₺
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Mevcut Fiyat: {listingPrice.toLocaleString('tr-TR')} ₺ ({(priceRatio * 100 - 100).toFixed(1)}%)
        </p>
      </div>

      {/* Pazar Karşılaştırması */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="font-semibold mb-2">Pazar Analizi</p>
        <p>{analysis.comparison}</p>
      </div>

      {/* Öneriler */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="font-semibold mb-2">Fiyatlandırma Önerileri</p>
        <p>{analysis.recommendations}</p>
      </div>

      {/* Kira Getirisi */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="font-semibold mb-2">Yatırım Analizi</p>
        <p>Tahmini Kira Getirisi: %{analysis.rental_yield.toFixed(1)}/yıl</p>
      </div>

      {/* Notlar */}
      <div className="p-4 border rounded-lg">
        <p className="font-semibold mb-2">Detaylı Notlar</p>
        <p className="text-sm text-gray-700">{analysis.valuation_notes}</p>
      </div>

      {/* Butonlar */}
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          PDF İndir
        </button>
        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Müşteriye Gönder
        </button>
      </div>
    </div>
  );
}
```

GÖREV 5: VERITABANINI SEED ET (BAŞLANGIÇ VERİSİ)
═════════════════════════════════════════════════════

5.1 Manual Seed Script (scripts/seed-market-data.ts):

Başlangıç için bu verileri Supabase'e ekle (market_analysis tablosuna):

İSTANBUL - Maltepe:
- 2+1 Daire: Ort. 2.500.000 ₺, m²: 22.000 ₺, Örnek: 45
- 3+1 Daire: Ort. 2.900.000 ₺, m²: 23.500 ₺, Örnek: 38
- Villa 3+1: Ort. 4.200.000 ₺, m²: 28.000 ₺, Örnek: 15

İSTANBUL - Beşiktaş:
- 2+1 Daire: Ort. 3.200.000 ₺, m²: 25.000 ₺, Örnek: 42
- 3+1 Daire: Ort. 3.800.000 ₺, m²: 26.500 ₺, Örnek: 35

ANKARA - Çankaya:
- 2+1 Daire: Ort. 1.800.000 ₺, m²: 18.000 ₺, Örnek: 50
- 3+1 Daire: Ort. 2.200.000 ₺, m²: 19.500 ₺, Örnek: 45

İZMİR - Alsancak:
- 2+1 Daire: Ort. 1.600.000 ₺, m²: 16.500 ₺, Örnek: 48
- 3+1 Daire: Ort. 1.950.000 ₺, m²: 17.800 ₺, Örnek: 42

MUĞLA - Marmaris:
- Villa 3+1: Ort. 3.800.000 ₺, m²: 24.000 ₺, Örnek: 25
- Villa 4+1: Ort. 5.200.000 ₺, m²: 26.500 ₺, Örnek: 18

ANTALYA - Konyaaltı:
- 2+1 Daire: Ort. 1.900.000 ₺, m²: 17.500 ₺, Örnek: 52
- Villa 3+1: Ort. 4.100.000 ₺, m²: 27.000 ₺, Örnek: 22

GÖREV 6: ENTEGRASYON
═══════════════════════

6.1 Pages ve Routes:

- App Page: app/(dashboard)/price-analysis/page.tsx
- API Route: app/api/price-analysis/route.ts
- Components: components/price-analysis/*

6.2 Navigation:

Dashboard veya Sidebar'a "Fiyat Analizi" linki ekle.

GÖREV 7: TESTING
════════════════

7.1 Test Senaryoları:

1. Sahibinden Scraper'ı çalıştır:
   npm run scrape:sahibinden

2. Market Data'yı doğrula:
   - Supabase market_analysis tablosunu kontrol et
   - sample_size >= 15 olmalı

3. API Test:
   - POST /api/price-analysis
   - Gerçek listing_id ve analysis_params gönder

4. UI Test:
   - Price Analysis Form'u doldur
   - "Analiz Yap" butonuna tıkla
   - Raporu doğrula

BAŞLAMAK İÇİN:
═══════════════

1. Bu prompt'taki SQL'leri Supabase'e çalıştır
2. Web Scraper script'ini oluştur ve çalıştır
3. API Route'u ekle
4. UI Components'ları ekle
5. Market data'yı seed et
6. Test et ve deploy et

VERSIYON: 3.0
TARİH: 05 Şubat 2026
HEDEF: 4-5 günde tamamla

Başarılar!
```

---

## 📝 YAPILACAKLAR

Antigravity bu promptu aldıktan sonra:

```
✅ Görev 1: Veritabanı schema oluşturma
✅ Görev 2: Sahibinden Web Scraper
✅ Görev 3: Price Analysis API
✅ Görev 4: UI Components
✅ Görev 5: Database Seeding
✅ Görev 6: Entegrasyon
✅ Görev 7: Testing
```

---

## 🚀 DEPLOYMENT

```bash
1. Antigravity tüm görevleri tamamla
2. git add .
3. git commit -m "Sprint 13: Price Analysis Module"
4. git push
5. Vercel otomatik deploy olacak
```

---

## 📊 BEKLENİ SONUÇ

**Sprint 13 Sonunda:**
- ✅ Akıllı fiyat analizi sistemi
- ✅ Sahibinden entegrasyonu
- ✅ AI-powered valuation reports
- ✅ Market analysis dashboard
- ✅ PDF export & sharing

**Sistem:**
```
Sahibinden Scraper → Market Analysis DB → Claude AI → Valuation Report
```

---

**Not:** Bu prompt Antigravity'ye yapıştırıp çalıştırabilirsin! 🚀
