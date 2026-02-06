# Sprint 13: Fiyat Analizi Modülü - FINAL Antigravity Prompt

**Proje:** TR Danışman CRM + Portföy Uygulaması  
**Sprint:** 13 (Gün 11-15)  
**Hedef:** Akıllı Fiyat Analizi Sistemi + Sahibinden Entegrasyonu  
**Süre:** 4-5 iş günü  
**Versiyon:** 3.0 FINAL

---

## 🎯 BAŞLAMA TALİMATI

Bu promptu **Antigravity Cloud Code**'a kopyala-yapıştır ve çalıştır:

```
HEMEN BAŞLA: Aşağıdaki promptu Antigravity'ye yapıştır
```

---

# ANTIGRAVITY PROMPT - BAŞLANGIC

```
Merhaba Antigravity!

TR Danışman CRM'nin Fiyat Analizi Modülü (Sprint 13) için tüm görevleri otomatikleştir.

PROJE BİLGİSİ
═══════════════════════════════════════════════════════════════════════════════
Proje Adı: TR Danışman CRM + Portföy Yönetimi
Framework: Next.js 14 + TypeScript
Database: Supabase PostgreSQL
GitHub: https://github.com/canpog/realestate-app
Production: https://realestate-app-prod.vercel.app
Local Path: C:\Users\canpo\OneDrive\Masaüstü\realestate-app
Current Deployment: realestate-app-prod.vercel.app

SPRINTIN HEDEFLERI
═══════════════════════════════════════════════════════════════════════════════
✓ Sahibinden.com veri entegrasyonu (Web Scraper)
✓ Market Analysis veritabanı (Bölge pazar ortalamaları)
✓ Price Analysis API (Claude AI with Anthropic)
✓ Valuation Report UI Components
✓ Marmaris test data (bolca)
✓ Deployment & Testing

---

GÖREV 1: SUPABASE VERİTABANI SCHEMA OLUŞTUR
═══════════════════════════════════════════════════════════════════════════════

1.1 Supabase Console'a gir ve şu SQL'leri çalıştır:

\`\`\`sql
-- ================================
-- 1. Market Analysis Tablosu
-- ================================
CREATE TABLE IF NOT EXISTS market_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Lokasyon
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    neighborhood TEXT,
    
    -- Emlak Tipi Gruplaması
    listing_type TEXT NOT NULL, -- 'apartment', 'villa', 'house', 'land'
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
    data_source TEXT DEFAULT 'manual', -- 'sahibinden', 'manual', 'api'
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_analysis_location ON market_analysis(city, district);
CREATE INDEX idx_market_analysis_type ON market_analysis(listing_type, rooms);

-- ================================
-- 2. Price Analysis Reports Tablosu
-- ================================
CREATE TABLE IF NOT EXISTS price_analysis_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Analiz Parametreleri
    analysis_params JSONB,
    
    -- Sonuçlar (AI tarafından hesaplandı)
    estimated_price NUMERIC,
    price_range_min NUMERIC,
    price_range_max NUMERIC,
    price_score FLOAT,
    price_per_sqm NUMERIC,
    market_comparison TEXT,
    recommendations TEXT,
    rental_yield FLOAT,
    valuation_notes TEXT,
    
    -- Meta
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_analysis_listing ON price_analysis_reports(listing_id);
CREATE INDEX idx_price_analysis_agent ON price_analysis_reports(agent_id);

-- ================================
-- 3. Scraping Logs Tablosu
-- ================================
CREATE TABLE IF NOT EXISTS scraping_logs (
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
    status TEXT DEFAULT 'success'
);

CREATE INDEX idx_scraping_logs_timestamp ON scraping_logs(scraped_at);
\`\`\`

---

GÖREV 2: MARMARIS TEST DATA SEED ET
═══════════════════════════════════════════════════════════════════════════════

2.1 Market Analysis tablosuna şu verileri INSERT et:

\`\`\`sql
-- Marmaris - Villa (TEST DATA - çok sayıda varyasyon)
INSERT INTO market_analysis (agent_id, city, district, neighborhood, listing_type, rooms, age_range, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source)
VALUES
-- 3+1 Villa - Yeni
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'İçmeler', 'villa', '3+1', 'new', 3800000, 3200000, 4500000, 3900000, 25333, 28, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Turunç', 'villa', '3+1', 'new', 3650000, 3100000, 4300000, 3750000, 24333, 25, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Eski Mezarlık', 'villa', '3+1', 'new', 3950000, 3400000, 4600000, 4050000, 26333, 22, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Orhaniye', 'villa', '3+1', 'new', 3550000, 3000000, 4200000, 3650000, 23667, 24, 'manual'),

-- 3+1 Villa - Nispeten Yeni (2-5 yıl)
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'İçmeler', 'villa', '3+1', '0-5_years', 3450000, 2900000, 4000000, 3550000, 23000, 32, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Turunç', 'villa', '3+1', '0-5_years', 3300000, 2800000, 3900000, 3400000, 22000, 29, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Eski Mezarlık', 'villa', '3+1', '0-5_years', 3550000, 3000000, 4100000, 3650000, 23667, 27, 'manual'),

-- 3+1 Villa - Orta Yaşlı (5-10 yıl)
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'İçmeler', 'villa', '3+1', '5-10_years', 3100000, 2600000, 3600000, 3150000, 20667, 35, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Turunç', 'villa', '3+1', '5-10_years', 2950000, 2500000, 3500000, 3000000, 19667, 31, 'manual'),

-- 4+1 Villa - Yeni
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'İçmeler', 'villa', '4+1', 'new', 5200000, 4500000, 6200000, 5300000, 26000, 20, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Turunç', 'villa', '4+1', 'new', 4950000, 4200000, 5900000, 5050000, 24750, 18, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Eski Mezarlık', 'villa', '4+1', 'new', 5450000, 4700000, 6500000, 5550000, 27250, 16, 'manual'),

-- 4+1 Villa - Nispeten Yeni
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'İçmeler', 'villa', '4+1', '0-5_years', 4850000, 4100000, 5700000, 4900000, 24250, 22, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Turunç', 'villa', '4+1', '0-5_years', 4650000, 3900000, 5500000, 4700000, 23250, 20, 'manual'),

-- 5+1 Villa - Yeni
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'İçmeler', 'villa', '5+1', 'new', 6800000, 5900000, 8000000, 6900000, 28333, 14, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Turunç', 'villa', '5+1', 'new', 6450000, 5500000, 7600000, 6550000, 26875, 12, 'manual'),

-- 2+1 Villa - Yeni (Ufak villalar)
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'İçmeler', 'villa', '2+1', 'new', 2800000, 2300000, 3300000, 2850000, 23333, 26, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'Turunç', 'villa', '2+1', 'new', 2650000, 2200000, 3150000, 2700000, 22083, 24, 'manual'),

-- Marmaris - Daire (Ek veri)
INSERT INTO market_analysis (agent_id, city, district, neighborhood, listing_type, rooms, age_range, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source)
VALUES
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'İçmeler', 'apartment', '2+1', 'new', 1600000, 1300000, 1900000, 1650000, 18000, 35, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'muğla', 'marmaris', 'İçmeler', 'apartment', '3+1', 'new', 2100000, 1800000, 2500000, 2150000, 19091, 32, 'manual');

-- Diğer şehirler (BAŞLANGIÇ VERİSİ)
INSERT INTO market_analysis (agent_id, city, district, neighborhood, listing_type, rooms, age_range, average_price, min_price, max_price, median_price, price_per_sqm, sample_size, data_source)
VALUES
-- İstanbul Maltepe
('550e8400-e29b-41d4-a716-446655440000', 'istanbul', 'maltepe', 'Fenerbahçe', 'apartment', '2+1', 'new', 2500000, 2200000, 2800000, 2550000, 22000, 45, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'istanbul', 'maltepe', 'Fenerbahçe', 'apartment', '3+1', 'new', 2900000, 2600000, 3300000, 2950000, 23500, 38, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'istanbul', 'maltepe', 'Fenerbahçe', 'villa', '3+1', 'new', 4200000, 3800000, 4800000, 4300000, 28000, 15, 'manual'),

-- İstanbul Beşiktaş
('550e8400-e29b-41d4-a716-446655440000', 'istanbul', 'besiktas', 'Ortaköy', 'apartment', '2+1', 'new', 3200000, 2900000, 3600000, 3250000, 25000, 42, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'istanbul', 'besiktas', 'Ortaköy', 'apartment', '3+1', 'new', 3800000, 3400000, 4300000, 3850000, 26500, 35, 'manual'),

-- Ankara Çankaya
('550e8400-e29b-41d4-a716-446655440000', 'ankara', 'cankaya', 'Gaziosmanpaşa', 'apartment', '2+1', 'new', 1800000, 1500000, 2100000, 1850000, 18000, 50, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'ankara', 'cankaya', 'Gaziosmanpaşa', 'apartment', '3+1', 'new', 2200000, 1900000, 2500000, 2250000, 19500, 45, 'manual'),

-- İzmir Alsancak
('550e8400-e29b-41d4-a716-446655440000', 'izmir', 'alsancak', 'Alsancak', 'apartment', '2+1', 'new', 1600000, 1400000, 1900000, 1650000, 16500, 48, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'izmir', 'alsancak', 'Alsancak', 'apartment', '3+1', 'new', 1950000, 1700000, 2250000, 2000000, 17800, 42, 'manual'),

-- Antalya Konyaaltı
('550e8400-e29b-41d4-a716-446655440000', 'antalya', 'konyaalti', 'Konyaaltı', 'apartment', '2+1', 'new', 1900000, 1600000, 2200000, 1950000, 17500, 52, 'manual'),
('550e8400-e29b-41d4-a716-446655440000', 'antalya', 'konyaalti', 'Konyaaltı', 'villa', '3+1', 'new', 4100000, 3600000, 4700000, 4150000, 27000, 22, 'manual');
\`\`\`

---

GÖREV 3: PRICE ANALYSIS API ROUTE OLUŞTUR
═══════════════════════════════════════════════════════════════════════════════

3.1 Yeni dosya oluştur: app/api/price-analysis/route.ts

\`\`\`typescript
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface AnalysisParams {
  rooms: string;
  age: string;
  sqm: number;
  condition?: string;
  floor?: number;
  total_floors?: number;
  city: string;
  district: string;
  features?: string[];
  distance_to_sea?: number;
  distance_to_metro?: number;
}

interface PriceAnalysisRequest {
  listing_id: string;
  analysis_params: AnalysisParams;
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PriceAnalysisRequest = await request.json();

    // 1. Market data'yı bul
    const { data: marketData } = await supabase
      .from('market_analysis')
      .select('*')
      .eq('city', body.analysis_params.city)
      .eq('district', body.analysis_params.district)
      .eq('rooms', body.analysis_params.rooms)
      .single();

    if (!marketData) {
      return Response.json(
        { error: `Market data not found for ${body.analysis_params.district}, ${body.analysis_params.city}` },
        { status: 404 }
      );
    }

    // 2. Listing data'yı al
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

    const analysisPrompt = \`Sen bir emlak değerleme ve fiyat analiz uzmanısın. Verilen portföy detayları ve pazar verilerine göre detaylı analiz yap.

PORTFÖY BİLGİLERİ
═══════════════════════════════════════════════════════════════════
Başlık: \${listing.title}
Mevcut Fiyat: \${listing.price.toLocaleString('tr-TR')} ₺
Metrekare: \${body.analysis_params.sqm} m²
Oda Sayısı: \${body.analysis_params.rooms}
Bina Yaşı: \${body.analysis_params.age}
Lokasyon: \${body.analysis_params.district}, \${body.analysis_params.city}
\${body.analysis_params.floor ? \`Kat: \${body.analysis_params.floor}/\${body.analysis_params.total_floors}\` : ''}
\${body.analysis_params.condition ? \`Kondisyon: \${body.analysis_params.condition}\` : ''}
\${body.analysis_params.features ? \`Özellikler: \${body.analysis_params.features.join(', ')}\` : ''}
\${body.analysis_params.distance_to_sea ? \`Denize Uzaklığı: \${body.analysis_params.distance_to_sea}m\` : ''}
\${body.analysis_params.distance_to_metro ? \`Metroya Uzaklığı: \${body.analysis_params.distance_to_metro}km\` : ''}

PAZAR VERİLERİ
═══════════════════════════════════════════════════════════════════
Bölge: \${body.analysis_params.district}, \${body.analysis_params.city}
Benzer Portföyler: \${marketData.sample_size} satış (son 3-6 ay)
Ortalama Fiyat: \${marketData.average_price?.toLocaleString('tr-TR')} ₺
Medyan Fiyat: \${marketData.median_price?.toLocaleString('tr-TR')} ₺
Fiyat Aralığı: \${marketData.min_price?.toLocaleString('tr-TR')} - \${marketData.max_price?.toLocaleString('tr-TR')} ₺
Fiyat/m²: \${marketData.price_per_sqm?.toLocaleString('tr-TR')} ₺

TALEPLERİM
═══════════════════════════════════════════════════════════════════
1. Tahmini piyasa değeri (min-max aralığı ile)
2. Fiyat skoru (0-10 ölçeğinde, 10=harika fiyat, 0=çok pahalı)
3. Fiyat/m² karşılaştırması
4. Pazar analizi ve karşılaştırma (spesifik yüzdelerle)
5. Fiyatlandırma önerileri (3 seçenek: normal, hızlı satış, premium)
6. Kira getirisi hesaplaması (aylık kira tahmini + yıllık %)
7. Yatırım potansiyeli notu

Lütfen aşağıdaki JSON formatında cevap ver (SADECE JSON, başka bir şey yazma):

{
  "estimated_market_price": 3800000,
  "price_range": {
    "min": 3400000,
    "max": 4200000
  },
  "price_score": 8.2,
  "price_per_sqm": 25333,
  "comparison": "Bu portföy bölge ortalamasından %3.4 pahalı fakat yeni olması ve denize yakınlığı sebebiyle uygun fiyatlandırılmıştır. Benzer özellikli 28 satış verisine göre medyan fiyat 3.9M ₺'dir.",
  "recommendations": {
    "normal_price": 3800000,
    "quick_sale_price": 3650000,
    "premium_price": 4050000,
    "notes": "Marmaris'in en çok aranan İçmeler bölgesinde konumlanması fiyata premium katmaktadır."
  },
  "rental_analysis": {
    "estimated_monthly_rent": 18500,
    "annual_rent": 222000,
    "rental_yield_percentage": 5.8,
    "notes": "Marmaris'te benzer villalar aylık 16.500-21.000 ₺ arası kiraya verilmektedir."
  },
  "valuation_notes": "Yeni inşaat, tam donanım, deniz manzarası ve İçmeler konumu bu villayı Marmaris pazarında tercih edilen hale getirmektedir. Yatırım amaçlı dahi satın alındığında kira getirisi makuldür.",
  "investment_potential": "Yüksek - Turizm bölgesi, yüksek talepli konum, kira potansiyeli var"
}
\`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    let aiAnalysis: any = {};
    
    try {
      const textContent = response.content[0].type === 'text' ? response.content[0].text : '{}';
      // JSON'u ekstrakt et (```json \\n ... \\n ``` formatından temizle)
      const jsonMatch = textContent.match(/\\{[\\s\\S]*\\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : textContent;
      aiAnalysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return Response.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // 4. Raporu DB'ye kaydet
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (agent) {
      await supabase
        .from('price_analysis_reports')
        .insert({
          agent_id: agent.id,
          listing_id: body.listing_id,
          analysis_params: body.analysis_params,
          estimated_price: aiAnalysis.estimated_market_price,
          price_range_min: aiAnalysis.price_range?.min,
          price_range_max: aiAnalysis.price_range?.max,
          price_score: aiAnalysis.price_score,
          price_per_sqm: aiAnalysis.price_per_sqm,
          market_comparison: aiAnalysis.comparison,
          recommendations: JSON.stringify(aiAnalysis.recommendations),
          rental_yield: aiAnalysis.rental_analysis?.rental_yield_percentage,
          valuation_notes: aiAnalysis.valuation_notes,
        });
    }

    return Response.json({
      success: true,
      analysis: aiAnalysis,
    });

  } catch (error) {
    console.error('Price analysis error:', error);
    return Response.json(
      { error: 'Price analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}
\`\`\`

---

GÖREV 4: PRICE ANALYSIS UI COMPONENTS OLUŞTUR
═══════════════════════════════════════════════════════════════════════════════

4.1 Form Component: components/price-analysis/price-analysis-form.tsx

\`\`\`typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface PriceAnalysisFormProps {
  listingId: string;
  listingPrice: number;
  onAnalysisComplete: (result: any) => void;
}

export function PriceAnalysisForm({
  listingId,
  listingPrice,
  onAnalysisComplete,
}: PriceAnalysisFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    rooms: '3+1',
    age: 'new',
    sqm: 150,
    condition: 'excellent',
    floor: 2,
    total_floors: 3,
    city: 'muğla',
    district: 'marmaris',
    features: ['Havuz', 'Doğalgaz', 'Asansör', 'Otopark'],
    distance_to_sea: 300,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/price-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          analysis_params: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      if (data.success) {
        setSuccess(true);
        onAnalysisComplete(data.analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 max-w-2xl mx-auto bg-white rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Fiyat Analizi Yap</h2>
        <p className="text-sm text-gray-600">Mevcut Fiyat: {listingPrice.toLocaleString('tr-TR')} ₺</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Hata</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-800">Analiz başarıyla tamamlandı!</p>
        </div>
      )}

      {/* Konum */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Konum</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select value={formData.city} onValueChange={(v) => setFormData({ ...formData, city: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="muğla">Muğla</SelectItem>
              <SelectItem value="istanbul">İstanbul</SelectItem>
              <SelectItem value="ankara">Ankara</SelectItem>
              <SelectItem value="izmir">İzmir</SelectItem>
              <SelectItem value="antalya">Antalya</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="İlçe (örn: marmaris)"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            className="text-sm"
          />
        </div>
      </div>

      {/* Temel Özellikler */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Temel Özellikler</h3>
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

          <Input
            type="number"
            placeholder="m²"
            value={formData.sqm}
            onChange={(e) => setFormData({ ...formData, sqm: parseInt(e.target.value) })}
            className="text-sm"
          />

          <Select value={formData.age} onValueChange={(v) => setFormData({ ...formData, age: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Yeni (0-2)</SelectItem>
              <SelectItem value="recent">Nispeten Yeni (2-5)</SelectItem>
              <SelectItem value="medium">Orta (5-10)</SelectItem>
              <SelectItem value="old">Eski (10+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kat Bilgisi */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Bina</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            placeholder="Kat"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
            className="text-sm"
          />
          <Input
            type="number"
            placeholder="Toplam Kat"
            value={formData.total_floors}
            onChange={(e) => setFormData({ ...formData, total_floors: parseInt(e.target.value) })}
            className="text-sm"
          />
        </div>
      </div>

      {/* Denize Uzaklık */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Lokasyon Avantajları</h3>
        <Input
          type="number"
          placeholder="Denize uzaklığı (metre)"
          value={formData.distance_to_sea}
          onChange={(e) => setFormData({ ...formData, distance_to_sea: parseInt(e.target.value) })}
          className="text-sm"
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analiz Yapılıyor...
          </span>
        ) : (
          'Analiz Yap'
        )}
      </Button>
    </form>
  );
}
\`\`\`

4.2 Results Component: components/price-analysis/price-analysis-results.tsx

\`\`\`typescript
'use client';

import { Download, Send, TrendingUp, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisResult {
  estimated_market_price: number;
  price_range: { min: number; max: number };
  price_score: number;
  price_per_sqm: number;
  comparison: string;
  recommendations: {
    normal_price: number;
    quick_sale_price: number;
    premium_price: number;
    notes: string;
  };
  rental_analysis: {
    estimated_monthly_rent: number;
    annual_rent: number;
    rental_yield_percentage: number;
    notes: string;
  };
  valuation_notes: string;
  investment_potential: string;
}

interface PriceAnalysisResultsProps {
  analysis: AnalysisResult;
  listingPrice: number;
  listingTitle: string;
}

export function PriceAnalysisResults({
  analysis,
  listingPrice,
  listingTitle,
}: PriceAnalysisResultsProps) {
  const scoreColor =
    analysis.price_score >= 7
      ? 'text-green-600'
      : analysis.price_score >= 5
      ? 'text-yellow-600'
      : 'text-red-600';

  const priceDiff = listingPrice - analysis.estimated_market_price;
  const priceDiffPercent = ((priceDiff / analysis.estimated_market_price) * 100).toFixed(1);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Başlık */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Değerleme Raporu</h2>
        <p className="text-sm text-gray-600">{listingTitle}</p>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tahmini Pazar Değeri */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Tahmini Pazar Değeri</p>
          <p className="text-2xl font-bold text-blue-600">
            {analysis.estimated_market_price.toLocaleString('tr-TR')} ₺
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {priceDiff > 0 ? '+' : ''}{priceDiff.toLocaleString('tr-TR')} ₺ ({priceDiffPercent}%)
          </p>
        </div>

        {/* Fiyat Skoru */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Fiyat Skoru</p>
          <p className={\`text-2xl font-bold \${scoreColor}\`}>
            {analysis.price_score.toFixed(1)}/10
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {analysis.price_score >= 7 ? '✓ İyi Fiyat' : analysis.price_score >= 5 ? '○ Orta' : '✗ Pahalı'}
          </p>
        </div>

        {/* Fiyat/m² */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Fiyat/m²</p>
          <p className="text-2xl font-bold text-green-600">
            {analysis.price_per_sqm.toLocaleString('tr-TR')} ₺
          </p>
          <p className="text-xs text-gray-500 mt-2">Bölge Ortalaması</p>
        </div>
      </div>

      {/* Fiyat Aralığı */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Home className="w-4 h-4" />
          Tahmini Fiyat Aralığı
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Minimum</span>
            <span className="font-semibold text-red-600">
              {analysis.price_range.min.toLocaleString('tr-TR')} ₺
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: \`\${
                  ((listingPrice - analysis.price_range.min) /
                    (analysis.price_range.max - analysis.price_range.min)) *
                  100
                }%\`
              }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Maksimum</span>
            <span className="font-semibold text-green-600">
              {analysis.price_range.max.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>
      </div>

      {/* Pazar Analizi */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Pazar Analizi</h3>
        <p className="text-sm text-gray-700">{analysis.comparison}</p>
      </div>

      {/* Fiyatlandırma Önerileri */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-3">Fiyatlandırma Önerileri</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-white border rounded">
            <p className="text-xs text-gray-600 mb-1">Normal Fiyat</p>
            <p className="text-lg font-bold text-blue-600">
              {analysis.recommendations.normal_price.toLocaleString('tr-TR')} ₺
            </p>
          </div>
          <div className="p-3 bg-white border rounded">
            <p className="text-xs text-gray-600 mb-1">Hızlı Satış</p>
            <p className="text-lg font-bold text-orange-600">
              {analysis.recommendations.quick_sale_price.toLocaleString('tr-TR')} ₺
            </p>
          </div>
          <div className="p-3 bg-white border rounded">
            <p className="text-xs text-gray-600 mb-1">Premium</p>
            <p className="text-lg font-bold text-green-600">
              {analysis.recommendations.premium_price.toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-3">{analysis.recommendations.notes}</p>
      </div>

      {/* Yatırım Analizi */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Yatırım Analizi
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">Tahmini Aylık Kira</p>
            <p className="text-lg font-bold text-purple-600">
              {analysis.rental_analysis.estimated_monthly_rent.toLocaleString('tr-TR')} ₺
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Yıllık Getiri</p>
            <p className="text-lg font-bold text-green-600">
              %{analysis.rental_analysis.rental_yield_percentage.toFixed(1)}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-3">{analysis.rental_analysis.notes}</p>
      </div>

      {/* Detaylı Notlar */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">Detaylı Değerleme</h3>
        <p className="text-sm text-gray-700 mb-3">{analysis.valuation_notes}</p>
        <div className="p-3 bg-gray-100 rounded">
          <p className="text-xs text-gray-600 mb-1">Yatırım Potansiyeli</p>
          <p className="text-sm font-semibold text-gray-800">{analysis.investment_potential}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          PDF İndir
        </Button>
        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
          <Send className="w-4 h-4" />
          Müşteriye Gönder
        </Button>
      </div>
    </div>
  );
}
\`\`\`

---

GÖREV 5: PAGE OLUŞTUR
═══════════════════════════════════════════════════════════════════════════════

5.1 Yeni dosya: app/(dashboard)/price-analysis/page.tsx

\`\`\`typescript
'use client';

import { useState } from 'react';
import { PriceAnalysisForm } from '@/components/price-analysis/price-analysis-form';
import { PriceAnalysisResults } from '@/components/price-analysis/price-analysis-results';

// TEST DATA - Marmaris Villa
const DEMO_LISTING = {
  id: 'test-listing-1',
  title: '3+1 Yeni Villa - Marmaris İçmeler',
  price: 3800000,
  sqm: 150,
};

export default function PriceAnalysisPage() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Fiyat Analizi Modülü</h1>
          <p className="text-gray-600 mt-2">
            Portföylerinizin pazar değerini anında analiz edin. Claude AI ve gerçek pazar verilerine göre akıllı değerleme.
          </p>
        </div>

        {!analysisResult ? (
          // Form Gösterimi
          <div className="bg-white rounded-lg shadow-lg">
            <PriceAnalysisForm
              listingId={DEMO_LISTING.id}
              listingPrice={DEMO_LISTING.price}
              onAnalysisComplete={setAnalysisResult}
            />
          </div>
        ) : (
          // Sonuç Gösterimi
          <div>
            <button
              onClick={() => setAnalysisResult(null)}
              className="mb-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Yeni Analiz Yap
            </button>
            <PriceAnalysisResults
              analysis={analysisResult}
              listingPrice={DEMO_LISTING.price}
              listingTitle={DEMO_LISTING.title}
            />
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Test Bilgisi</h3>
          <p className="text-sm text-blue-800">
            Bu sayfada Marmaris İçmeler bölgesindeki 3+1 villalar için test yapabilirsiniz. 
            Ön tanımlı veriler Marmaris'e ayarlanmıştır. Formdaki bilgileri değiştirerek farklı senaryoları test edin.
          </p>
        </div>
      </div>
    </div>
  );
}
\`\`\`

---

GÖREV 6: NAVIGATION GÜNCELLEMESI
═════════════════════════════════════════════════════════════════════════════════

6.1 Sidebar veya Navigation menüsüne link ekle:

\`\`\`typescript
// components/sidebar.tsx veya navigation.tsx içinde:

{
  title: 'Fiyat Analizi',
  href: '/price-analysis',
  icon: TrendingUp, // lucide-react'ten
  description: 'Portföy değerleme ve pazar analizi'
}
\`\`\`

---

GÖREV 7: TESTING VE DEPLOY
═════════════════════════════════════════════════════════════════════════════════

7.1 Testing Adımları:

\`\`\`bash
# 1. Supabase'de tabloların oluşturulduğunu doğrula
   - https://supabase.com → Proje → SQL Editor
   - market_analysis, price_analysis_reports tabellarını kontrol et

# 2. Test datalarını verify et
   - SELECT COUNT(*) FROM market_analysis;
   - SELECT * FROM market_analysis WHERE district = 'marmaris';
   - 20+ kayıt görmek gerekir

# 3. API'yi test et
   POST /api/price-analysis
   Body:
   {
     "listing_id": "test-listing-1",
     "analysis_params": {
       "rooms": "3+1",
       "age": "new",
       "sqm": 150,
       "city": "muğla",
       "district": "marmaris",
       "floor": 2,
       "total_floors": 3,
       "distance_to_sea": 300
     }
   }

# 4. UI'yi test et
   - http://localhost:3000/price-analysis
   - Form'u doldur
   - "Analiz Yap" tıkla
   - Rapport görmek gerekir

# 5. Deploy et
   git add .
   git commit -m "Sprint 13: Price Analysis Module with Marmaris test data"
   git push
   - Vercel otomatik deploy olacak

# 6. Production'da test et
   https://realestate-app-prod.vercel.app/price-analysis
\`\`\`

---

GÖREV 8: MARMARIS TEST SENARYOLARı
═════════════════════════════════════════════════════════════════════════════════

Test bu kombinasyonlarla:

1. Marmaris 3+1 Yeni Villa (300m denize):
   - Expected: ~3.8M ₺, Skor: 8+, Kira: %5.8
   
2. Marmaris 4+1 Yeni Villa (500m denize):
   - Expected: ~5.2M ₺, Skor: 8+, Kira: %5.5
   
3. Marmaris 2+1 Villa (Eski):
   - Expected: ~2.1M ₺, Skor: 7+, Kira: %6.2

4. Marmaris 2+1 Daire (Yeni):
   - Expected: ~1.6M ₺, Skor: 7.5+

---

BAŞLAMAK İÇİN ÖNEMLİ NOTLAR
═════════════════════════════════════════════════════════════════════════════════

✓ SQL'leri Supabase SQL Editor'e KOPYALA-YAPIŞSTIR
✓ Dosyaları VS Code'da projeye EKLE
✓ Environment Variables doğru mu? (ANTHROPIC_API_KEY)
✓ Test data for Marmaris BAŞARILI mı?
✓ API Response test YAPILDI mı?
✓ UI render OLUYOR mu?
✓ Deployment BAŞARILI mı?

---

BEKLENEN SONUÇ
═════════════════════════════════════════════════════════════════════════════════

✅ Akıllı Fiyat Analizi Sistemi
✅ Sahibinden Pazar Verisi Entegrasyonu
✅ Claude AI Powered Valuation Reports
✅ Marmaris Test Data (Bolca)
✅ PDF Export & Customer Sharing Ready
✅ Production Deployed

Sistem Akışı:
┌─────────────────┐
│  Form (User)    │
└────────┬────────┘
         │ POST /api/price-analysis
         ↓
┌─────────────────┐
│ Market Data     │─→ Supabase
│ (Marmaris, vb) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Claude AI      │─→ Anthropic API
│ (Valuation)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Report          │─→ UI Display
│ (Detailed)      │
└─────────────────┘

---

HATA DURUMUNDA
═════════════════════════════════════════════════════════════════════════════════

❌ "Market data not found" hatası:
   → Supabase'de market_analysis verisi var mı kontrol et
   → INSERT komutları çalıştırıldı mı?
   → city/district değerleri lowercase mi?

❌ "Unauthorized" hatası:
   → Supabase auth doğru mu?
   → User login yapıldı mı?

❌ API timeout:
   → Anthropic API key geçerli mi?
   → Rate limit mi?

❌ UI render etmiyor:
   → Components import doğru mu?
   → lucide-react icons var mı?

---

TAMAMLANINCA YAPACAKLAR
═════════════════════════════════════════════════════════════════════════════════

1. ✅ Sprint 13 tamamlandı
2. ✅ Deployment başarılı
3. ✅ Marmaris test datası var
4. ✅ API working
5. ✅ UI complete
   
Sonra → Sprint 14: CRM Excel Import + Komisyon Sistemi
```

---

# 📝 ÖZET

Bu prompt **7 görevde** Sprint 13'ü tamamlıyor:

| Görev | Açıklama | Durum |
|-------|----------|-------|
| 1 | Veritabanı Schema | SQL dosya |
| 2 | Marmaris Test Data | 20+ satır |
| 3 | Price Analysis API | TypeScript |
| 4 | UI Components | React |
| 5 | Page & Navigation | Integration |
| 6 | Testing | Scenarios |
| 7 | Deploy | Production |

---

## 🚀 HEMEN BAŞLA

```
1. Promptu Antigravity'ye yapıştır
2. Run/Execute tıkla
3. 4-5 günde Sprint 13 bitti!
```

---

**Version:** 3.0 FINAL  
**Date:** 05 Şubat 2026  
**Status:** Ready to Deploy  
**Test City:** Marmaris ✓
