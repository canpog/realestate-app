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
        const marketQueryType = (params.listing_type || 'apartment').toLowerCase();

        console.log('[PriceAnalysis] Step 1: Exact Match Search:', { city: params.city, district: params.district, type: marketQueryType, rooms: params.rooms });

        // 1. Exact Match Strategy
        let { data: marketData, error: marketError } = await supabase
            .from('market_analysis')
            .select('*')
            .ilike('city', params.city)
            .ilike('district', params.district)
            .eq('listing_type', marketQueryType)
            .eq('rooms', params.rooms)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        // 2. Relaxed Location Search Strategy (if Exact fails)
        // User might have entered "Marmaris" in City field, or vice versa
        // So we search where district matches EITHER city input OR district input
        if (!marketData) {
            console.log('[PriceAnalysis] Step 2: Relaxed Location Search');
            const { data: relaxedData } = await supabase
                .from('market_analysis')
                .select('*')
                .or(`district.ilike.${params.district},district.ilike.${params.city}`)
                .eq('listing_type', marketQueryType)
                .eq('rooms', params.rooms)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (relaxedData && relaxedData.length > 0) {
                marketData = relaxedData[0];
                console.log('[PriceAnalysis] Found via Relaxed Search:', marketData);
            }
        }

        // 3. Fallback: Relaxed Location WITHOUT Rooms (Broadest search)
        let fallbackMarketData = marketData;
        if (!marketData) {
            console.log('[PriceAnalysis] Step 3: Fallback (No Rooms Filter)');
            const { data: fallback } = await supabase
                .from('market_analysis')
                .select('*')
                .or(`district.ilike.${params.district},district.ilike.${params.city}`)
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

KRİTİK TALİMATLAR:
1. Sana aşağıda "PAZAR VERİLERİ (Gerçek Veriler)" başlığı altında sunduğum veriler, bu bölgedeki GÜNCEL ve GERÇEK piyasa verileridir. MUTLAKA bu istatistikleri (ortalama fiyat, m² fiyatı vb.) baz alarak hesaplama yap. Eğer genel bilginle çelişirse, VERİLEN PAZAR VERİLERİNE ÖNCELİK VER.
2. Yanıtındaki "recommendations" objesi içinde MUTLAKA "notes" alanı olmalı. Yoksa bile fiyat anahtarlarını (normal_price, quick_sale_price vb.) eksiksiz dön.

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
2. Fiyat skoru (0-10)
3. Fiyat/m² karşılaştırması
4. Pazar analizi
5. Fiyatlandırma önerileri (normal, hızlı satış, premium) - "recommendations" objesi altında dön
6. Kira getirisi
7. Yatırım potansiyeli

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
    "notes": "Mülkün konumu ve yeni olması sebebiyle liste fiyatı olarak 7.950.000 TL ile piyasaya çıkılması önerilir."
  },
  "rental_analysis": {
    "estimated_monthly_rent": 45000,
    "rental_yield_percentage": 7.2
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
            market_data_available: !!marketData, // Changed from fallbackMarketData to marketData to be stringent
            debug: {
                searched_for: { city: params.city, district: params.district, type: marketQueryType, rooms: params.rooms },
                found_data: !!marketData
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
