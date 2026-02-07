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
        // Note: Mock data stores age_range as 'all' usually, so we don't filter by age purely in DB
        const marketQueryType = (params.listing_type || 'apartment').toLowerCase();

        console.log('[PriceAnalysis] Searching for:', { city: params.city, district: params.district, type: marketQueryType, rooms: params.rooms });

        const { data: marketData, error: marketError } = await supabase
            .from('market_analysis')
            .select('*')
            .ilike('city', params.city)
            .ilike('district', params.district)
            .eq('listing_type', marketQueryType)
            .eq('rooms', params.rooms)
            // Get the most recent one
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (marketError && marketError.code !== 'PGRST116') {
            console.error('[PriceAnalysis] Query error:', marketError);
        }

        console.log('[PriceAnalysis] Market Data Result:', marketData || 'Not found');

        // Fallback: try without rooms filter
        let fallbackMarketData = marketData;
        if (!marketData) {
            const { data: fallback } = await supabase
                .from('market_analysis')
                .select('*')
                .ilike('city', params.city)
                .ilike('district', params.district)
                .eq('listing_type', marketQueryType)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (fallback && fallback.length > 0) {
                fallbackMarketData = fallback[0];
                console.log('[PriceAnalysis] Fallback Data Used:', fallbackMarketData);
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

        const prompt = `Sen Türkiye emlak piyasasında uzmanlaşmış kıdemli bir mülk değerleme uzmanısın.
Görev: Aşağıdaki mülk için doğru bir fiyat değerlemesi yapmak.

KRİTİK TALİMAT:
Sana aşağıda "PAZAR VERİLERİ (Gerçek Veriler)" başlığı altında sunduğum veriler, bu bölgedeki GÜNCEL ve GERÇEK piyasa verileridir.
Kendi genel bilgini veya eski verilerini DEĞİL, MUTLAKA bu sunduğum istatistikleri (ortalama fiyat, m² fiyatı vb.) baz alarak hesaplama yapmalısın.
Eğer verilen Pazar Verileri ile kendi tahminin çelişiyorsa, VERİLEN PAZAR VERİLERİNE ÖNCELİK VER.
Tahminini bu Pazar Verileri etrafında şekillendir.

PORTFÖY BİLGİLERİ
═══════════════════════════════════════
${listing ? `Başlık: ${listing.title}` : 'Genel Değerleme'}
${listing ? `Mevcut Fiyat: ${listing.price?.toLocaleString('tr-TR')} ₺` : ''}
Metrekare: ${params.sqm} m²
Oda Sayısı: ${params.rooms}
Bina Yaşı: ${parseInt(params.age) > 0 ? params.age + ' Yıllık' : 'Sıfır Bina (Yeni)'}
Lokasyon: ${params.district}, ${params.city}
Emlak Tipi: ${params.listing_type || 'Konut'}
${params.floor ? `Kat: ${params.floor}/${params.total_floors || '?'}` : ''}
${params.condition ? `Kondisyon: ${params.condition}` : ''}
${params.features?.length ? `Özellikler: ${params.features.join(', ')}` : ''}

PAZAR VERİLERİ ${fallbackMarketData ? '(Gerçek Veriler - BUNLARI KULLAN)' : '(Veri Yok - Tahmin Yap)'}
═══════════════════════════════════════════
Bölge: ${params.district}, ${params.city}
${fallbackMarketData ? `
DURUM: elimizde bu bölge ve özellikler için GÜNCEL veriler var. Analizini buna dayandır.
Kayıtlı Emsal Sayısı: ${fallbackMarketData.sample_size} adet
Bölge Ortalaması: ${fallbackMarketData.average_price?.toLocaleString('tr-TR')} ₺
Medyan Fiyat: ${fallbackMarketData.median_price?.toLocaleString('tr-TR')} ₺
Bölge Fiyat Aralığı: ${fallbackMarketData.min_price?.toLocaleString('tr-TR')} - ${fallbackMarketData.max_price?.toLocaleString('tr-TR')} ₺
Bölge m² Birim Fiyatı: ${fallbackMarketData.price_per_sqm?.toLocaleString('tr-TR')} ₺
Veri Tarihi: ${new Date(fallbackMarketData.updated_at).toLocaleDateString('tr-TR')}
` : 'Bu bölge için güncel pazar verisi bulunamadı. Genel piyasa bilgine ve mülk özelliklerine dayanarak en iyi tahminini yap.'}

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
  "estimated_market_price": 7500000,
  "price_range": { "min": 7100000, "max": 8000000 },
  "price_score": 8.5,
  "price_per_sqm": 41666,
  "comparison": "Bölge ortalaması olan 7.5 milyon TL civarındadır.",
  "recommendations": {
    "normal_price": 7500000,
    "quick_sale_price": 7150000,
    "premium_price": 7950000,
    "notes": "Mülkün konumu ve yeni olması sebebiyle liste fiyatı olarak 7.950.000 TL ile piyasaya çıkılması, pazarlık payı ile 7.500.000 TL civarında realize edilmesi önerilir."
  },
  "rental_analysis": {
    "estimated_monthly_rent": 45000,
    "annual_rent": 540000,
    "rental_yield_percentage": 7.2,
    "notes": "Yüksek sezon kira potansiyeli ile yıllık getiri %7 civarında olabilir."
  },
  "valuation_notes": "Genel notlar..."
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
            debug: {
                searched_for: { city: params.city, district: params.district, type: marketQueryType, rooms: params.rooms },
                found_data: !!fallbackMarketData
            }
        });

    } catch (error: any) {
        console.error('Price analysis error:', error);
        return NextResponse.json(
            { error: error.message || 'Price analysis failed' },
            { status: 500 }
        );
    }
}
