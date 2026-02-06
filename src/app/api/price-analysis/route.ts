import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PriceAnalysisRequest {
    listing_id?: string;
    analysis_params: {
        rooms: string;
        age: string;
        sqm: number;
        condition?: string;
        floor?: number;
        total_floors?: number;
        city: string;
        district: string;
        listing_type?: string;
        features?: string[];
        distance_to_sea?: number;
        distance_to_metro?: number;
    };
}

export async function POST(request: NextRequest) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body: PriceAnalysisRequest = await request.json();
        const params = body.analysis_params;

        // 1. Fetch market data for this location/type/rooms
        const { data: marketData } = await supabase
            .from('market_analysis')
            .select('*')
            .eq('city', params.city)
            .eq('district', params.district)
            .eq('listing_type', params.listing_type || 'apartment')
            .eq('rooms', params.rooms)
            .single();

        // Fallback: try without rooms filter
        let fallbackMarketData = marketData;
        if (!marketData) {
            const { data: fallback } = await supabase
                .from('market_analysis')
                .select('*')
                .eq('city', params.city)
                .eq('district', params.district)
                .eq('listing_type', params.listing_type || 'apartment')
                .limit(1);

            if (fallback && fallback.length > 0) {
                fallbackMarketData = fallback[0];
            }
        }

        // 2. Get listing data if provided
        let listing = null;
        if (body.listing_id) {
            const { data } = await supabase
                .from('listings')
                .select('*')
                .eq('id', body.listing_id)
                .single();
            listing = data;
        }

        // 3. Call Claude AI for analysis
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const prompt = `Sen bir emlak değerleme ve fiyat analiz uzmanısın.

PORTFÖY BİLGİLERİ
═══════════════════════════════════════
${listing ? `Başlık: ${listing.title}` : 'Genel Değerleme'}
${listing ? `Mevcut Fiyat: ${listing.price?.toLocaleString('tr-TR')} ₺` : ''}
Metrekare: ${params.sqm} m²
Oda Sayısı: ${params.rooms}
Bina Yaşı: ${params.age || 'Belirtilmemiş'}
Lokasyon: ${params.district}, ${params.city}
${params.floor ? `Kat: ${params.floor}/${params.total_floors || '?'}` : ''}
${params.condition ? `Kondisyon: ${params.condition}` : ''}
${params.features?.length ? `Özellikler: ${params.features.join(', ')}` : ''}

PAZAR VERİLERİ ${fallbackMarketData ? '(Gerçek Veriler)' : '(Tahmin)'}
═══════════════════════════════════════════
Bölge: ${params.district}, ${params.city}
${fallbackMarketData ? `
Benzer Portföyler: ${fallbackMarketData.sample_size} satış
Ortalama Fiyat: ${fallbackMarketData.average_price?.toLocaleString('tr-TR')} ₺
Medyan Fiyat: ${fallbackMarketData.median_price?.toLocaleString('tr-TR')} ₺
Fiyat Aralığı: ${fallbackMarketData.min_price?.toLocaleString('tr-TR')} - ${fallbackMarketData.max_price?.toLocaleString('tr-TR')} ₺
Fiyat/m²: ${fallbackMarketData.price_per_sqm?.toLocaleString('tr-TR')} ₺
` : 'Bu bölge için pazar verisi bulunamadı. Genel bilgine dayanarak tahmin yap.'}

TALEPLER
═════════════
1. Tahmini piyasa değeri (min-max aralığı)
2. Fiyat skoru (0-10, 10=harika fiyat)
3. Fiyat/m² karşılaştırması
4. Pazar analizi ve karşılaştırma
5. Fiyatlandırma önerileri (normal, hızlı satış, premium)
6. Kira getirisi hesaplaması (aylık kira, yıllık getiri %)
7. Yatırım potansiyeli notu

JSON formatında yanıt ver:
{
  "estimated_market_price": 3800000,
  "price_range": { "min": 3400000, "max": 4200000 },
  "price_score": 8.2,
  "price_per_sqm": 25333,
  "comparison": "Bu portföy bölge ortalamasından %3.4 pahalı fakat yeni olması sebebiyle uygun fiyatlandırılmıştır.",
  "recommendations": {
    "normal_price": 3800000,
    "quick_sale_price": 3650000,
    "premium_price": 4050000,
    "notes": "Bölgenin en çok aranan lokasyonunda konumlanması fiyata premium katmaktadır."
  },
  "rental_analysis": {
    "estimated_monthly_rent": 18500,
    "annual_rent": 222000,
    "rental_yield_percentage": 5.8,
    "notes": "Benzer mülkler aylık 16.500-21.000 ₺ arası kiraya verilmektedir."
  },
  "valuation_notes": "Yeni inşaat, tam donanım ve iyi lokasyon bu mülkü pazarda tercih edilen hale getirmektedir.",
  "investment_potential": "Yüksek - Turizm bölgesi, yüksek talepli konum, kira potansiyeli var"
}`;

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }],
        });

        const aiText = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        // 4. Get agent ID
        const { data: agent } = await supabase
            .from('agents')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        // 5. Save report to database
        if (agent) {
            await supabase.from('price_analysis_reports').insert({
                agent_id: agent.id,
                listing_id: body.listing_id || null,
                analysis_params: params,
                estimated_price: aiAnalysis.estimated_market_price,
                price_range_min: aiAnalysis.price_range?.min,
                price_range_max: aiAnalysis.price_range?.max,
                price_score: aiAnalysis.price_score,
                price_per_sqm: aiAnalysis.price_per_sqm,
                market_comparison: aiAnalysis.comparison,
                recommendations: aiAnalysis.recommendations,
                rental_yield: aiAnalysis.rental_yield,
                valuation_notes: aiAnalysis.valuation_notes,
            });
        }

        return NextResponse.json({
            success: true,
            analysis: aiAnalysis,
            market_data_available: !!fallbackMarketData,
        });

    } catch (error: any) {
        console.error('Price analysis error:', error);
        return NextResponse.json(
            { error: error.message || 'Price analysis failed' },
            { status: 500 }
        );
    }
}
